const prisma = require("../lib/prisma");

async function getPendingListings(req, res, next) {
  try {
    const listings = await prisma.listing.findMany({
      where: {
        status: "PENDING",
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
      include: {
        category: { select: { name: true } },
        seller: { select: { name: true, username: true } },
      },
    });

    return res.status(200).json(listings.map((listing) => ({
      ...listing,
      sellerId: listing.sellerId.toString(),
      price: Number(listing.price),
      type: listing.listingType.toLowerCase(),
      photos: listing.imageUrls,
      photoUrl: listing.imageUrls[0] ?? null,
      category: listing.category.name,
      postedBy: listing.seller.name,
      payload: listing.details,
      isEdit: Boolean(listing.originalListingId),
    })));
  } catch (error) {
    return next(error);
  }
}

async function approveListing(req, res, next) {
  try {
    const { id } = req.params;
    const pending = await prisma.listing.findFirst({
      where: { id, status: "PENDING", deletedAt: null },
    });

    if (!pending) {
      return res.status(404).json({ error: "Pending listing not found" });
    }

    if (!pending.originalListingId) {
      const result = await prisma.listing.updateMany({
        where: { id, status: "PENDING", deletedAt: null },
        data: { status: "ACTIVE" },
      });
      if (!result.count) {
        return res.status(409).json({ error: "Listing was already moderated" });
      }
    } else {
      const applied = await prisma.$transaction(async (transaction) => {
        const result = await transaction.listing.updateMany({
          where: { id, status: "PENDING", deletedAt: null },
          data: { status: "ACTIVE" },
        });
        if (!result.count) return false;

        const original = await transaction.listing.findFirst({
          where: {
            id: pending.originalListingId,
            sellerId: pending.sellerId,
            deletedAt: null,
          },
        });
        if (!original) {
          throw new Error("Original listing for pending edit was not found");
        }

        await transaction.listing.update({
          where: { id: original.id },
          data: {
            categoryId: pending.categoryId,
            title: pending.title,
            description: pending.description,
            price: pending.price,
            imageUrls: pending.imageUrls,
            listingType: pending.listingType,
            details: pending.details,
            campus: pending.campus,
          },
        });
        await transaction.listing.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
        return true;
      });

      if (!applied) {
        return res.status(409).json({ error: "Listing was already moderated" });
      }
    }

    return res.status(200).json({ message: "Listing approved successfully" });
  } catch (error) {
    return next(error);
  }
}

async function rejectListing(req, res, next) {
  try {
    const { id } = req.params;
    const result = await prisma.listing.updateMany({
      where: { id, status: "PENDING", deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (!result.count) {
      return res.status(404).json({ error: "Pending listing not found" });
    }

    return res.status(200).json({ message: "Listing rejected successfully" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getPendingListings,
  approveListing,
  rejectListing,
};
