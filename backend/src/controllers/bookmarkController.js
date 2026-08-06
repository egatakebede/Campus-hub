const prisma = require("../lib/prisma");

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
const toggleBookmark = async (req, res) => {
  try {
    const { target_id, target_type } = req.body;

    if (!target_id || !target_type) {
      return res
        .status(400)
        .json({ error: "target_id and target_type are required" });
    }

    const telegramId = req.user?.telegramId;

    if (!telegramId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: BigInt(telegramId),
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
    const telegramId = req.user?.telegramId;

    if (!telegramId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: BigInt(telegramId),
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
const removeBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const telegramId = req.user?.telegramId;

    if (!telegramId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 1. Find the bookmark first to check if it exists
    const bookmark = await prisma.bookmark.findUnique({
      where: { id },
    });

    if (!bookmark) {
      return res.status(404).json({ error: "Bookmark not found" });
    }

    // 2. Enforce ownership check
    if (bookmark.userId !== BigInt(telegramId)) {
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
  toggleBookmark,
  getMyBookmarks,
  removeBookmark,
};
