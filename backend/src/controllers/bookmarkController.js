const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Hardcoded user ID for local endpoint testing (matches the user in your database)
const TEST_USER_ID = BigInt("123456789");

/**
 * Helper function to safely map BigInt values to Strings for JSON response
 */
const formatBookmark = (bookmark) => ({
  ...bookmark,
  id: bookmark.id,
  userId: bookmark.userId.toString(),
  targetId: bookmark.targetId,
});

/**
 * 1. Create a Bookmark (POST /bookmarks)
 */
const createBookmark = async (req, res) => {
  try {
    const { target_id, target_type } = req.body;

    if (!target_id || !target_type) {
      return res
        .status(400)
        .json({ error: "target_id and target_type are required" });
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: TEST_USER_ID,
        targetId: String(target_id),
        targetType: target_type.toUpperCase(),
      },
    });

    return res.status(201).json(formatBookmark(bookmark));
  } catch (error) {
    // Unique constraint violation (userId, targetId, targetType)
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Already bookmarked" });
    }

    console.error("--- ERROR CREATING BOOKMARK ---");
    console.error(error);
    console.error("--------------------------------");

    return res.status(500).json({ error: "Failed to create bookmark" });
  }
};

/**
 * 2. Get All Bookmarks for Current User (GET /bookmarks)
 */
const getMyBookmarks = async (req, res) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: TEST_USER_ID,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedBookmarks = bookmarks.map(formatBookmark);

    return res.status(200).json(formattedBookmarks);
  } catch (error) {
    console.error("--- ERROR FETCHING BOOKMARKS ---");
    console.error(error);
    console.error("--------------------------------");

    return res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
};

/**
 * 3. Delete a Bookmark (DELETE /bookmarks/:id)
 */
const deleteBookmark = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the bookmark first to check if it exists
    const bookmark = await prisma.bookmark.findUnique({
      where: { id },
    });

    if (!bookmark) {
      return res.status(404).json({ error: "Bookmark not found" });
    }

    // 2. Enforce ownership check
    if (bookmark.userId !== TEST_USER_ID) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this bookmark" });
    }

    // 3. Delete the record
    await prisma.bookmark.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Bookmark deleted successfully" });
  } catch (error) {
    console.error("--- ERROR DELETING BOOKMARK ---");
    console.error(error);
    console.error("--------------------------------");

    return res.status(500).json({ error: "Failed to delete bookmark" });
  }
};

module.exports = {
  createBookmark,
  getMyBookmarks,
  deleteBookmark,
};
