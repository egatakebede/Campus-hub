const prisma = require("../lib/prisma");
const { uploadImage } = require("../services/uploadService");

// POST /listings
async function createListing(req, res) {
  try {
    const { title, description, price, category_id, images } = req.body;

    if (!title || !description || !price || !category_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (price <= 0) {
      return res.status(400).json({ error: "Price must be greater than 0" });
    }

    if (images && images.length > 5) {
      return res.status(400).json({ error: "Maximum 5 images allowed" });
    }

    // TODO: replace with req.user.telegramId once T-AUTH-003 merges
    const sellerId = BigInt(123456789);

    const listing = await prisma.listing.create({
      data: {
        sellerId,
        categoryId: parseInt(category_id),
        title,
        description,
        price,
        imageUrls: images || [],
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      ...listing,
      sellerId: listing.sellerId.toString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create listing" });
  }
}

// POST /listings/upload-image
async function uploadListingImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }
    const url = await uploadImage(req.file, "listing-images");
    res.status(200).json({ url });
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ error: err.message });
  }
}

// GET /listings
async function getListings(req, res) {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: {
        seller: {
          select: { name: true, username: true },
        },
      },
    });

    const safeListings = listings.map((l) => ({
      ...l,
      sellerId: l.sellerId.toString(),
    }));

    res.status(200).json(safeListings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
}

// GET /listings/:id
async function getListingDetail(req, res) {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: { name: true, username: true, phone: true, showPhone: true },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const seller = {
      name: listing.seller.name,
      username: listing.seller.username,
    };
    if (listing.seller.showPhone) {
      seller.phone = listing.seller.phone;
    }

    res.status(200).json({
      ...listing,
      sellerId: listing.sellerId.toString(),
      seller,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch listing" });
  }
}

// PATCH /listings/:id
async function updateListing(req, res) {
  try {
    const { id } = req.params;
    const { title, description, price, category_id, images } = req.body;

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // TODO: replace with req.user.telegramId once T-AUTH-003 merges
    const requesterId = BigInt(123456789);
    if (existing.sellerId !== requesterId) {
      return res.status(403).json({ error: "Not authorized to edit this listing" });
    }

    if (price !== undefined && price <= 0) {
      return res.status(400).json({ error: "Price must be greater than 0" });
    }
    if (images && images.length > 5) {
      return res.status(400).json({ error: "Maximum 5 images allowed" });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price !== undefined && { price }),
        ...(category_id && { categoryId: parseInt(category_id) }),
        ...(images && { imageUrls: images }),
      },
    });

    res.status(200).json({
      ...updated,
      sellerId: updated.sellerId.toString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update listing" });
  }
}

// DELETE /listings/:id
async function deleteListing(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // TODO: replace with req.user.telegramId once T-AUTH-003 merges
    const requesterId = BigInt(123456789);
    if (existing.sellerId !== requesterId) {
      return res.status(403).json({ error: "Not authorized to delete this listing" });
    }

    await prisma.listing.delete({ where: { id } });

    res.status(200).json({ message: "Listing deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete listing" });
  }
}

// PATCH /listings/:id/sold
async function markAsSold(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: { status: "SOLD" },
    });

    res.status(200).json({
      ...updated,
      sellerId: updated.sellerId.toString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark listing as sold" });
  }
}

module.exports = {
  createListing,
  uploadListingImage,
  getListings,
  getListingDetail,
  updateListing,
  deleteListing,
  markAsSold,
};
