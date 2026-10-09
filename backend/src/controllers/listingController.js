const prisma = require("../lib/prisma");
const { uploadImage } = require("../services/uploadService");

const LISTING_TYPES = {
  sell: { listingType: "SELL", categoryType: "MARKETPLACE" },
  rent: { listingType: "RENT", categoryType: "MARKETPLACE" },
  service: { listingType: "SERVICE", categoryType: "SERVICE" },
};

function serializeListing(listing) {
  if (!listing.listingType) {
    return {
      ...listing,
      sellerId: listing.sellerId.toString(),
    };
  }

  const details = listing.details && typeof listing.details === "object"
    ? listing.details
    : {};

  return {
    ...details,
    ...listing,
    sellerId: listing.sellerId.toString(),
    title: listing.title,
    description: listing.description,
    type: listing.listingType.toLowerCase(),
    photos: listing.imageUrls,
    photoUrl: listing.imageUrls[0] ?? null,
    rentalPricing: details.rentalPricing ?? {
      hourly: details.durations?.hour,
      daily: details.durations?.day,
      weekly: details.durations?.week,
      monthly: details.durations?.month,
      semester: details.durations?.semester,
    },
    category: listing.category?.name ?? "",
    campus: listing.campus || details.campus || details.location || "",
    price: Number(listing.price),
    seller: listing.seller
      ? {
          id: listing.sellerId.toString(),
          fullName: listing.seller.name,
          name: listing.seller.name,
          telegramUsername: listing.seller.username,
          username: listing.seller.username,
        }
      : undefined,
  };
}

// GET /listings/mine
async function getMyListings(req, res) {
  try {
    const listings = await prisma.listing.findMany({
      where: {
        sellerId: BigInt(req.user.telegramId),
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        seller: { select: { name: true, username: true } },
      },
    });

    return res.status(200).json(listings.map(serializeListing));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch your listings" });
  }
}

// POST /listings
async function createListing(req, res) {
  try {
    const body = req.body ?? {};
    const type = String(body.type ?? "").toLowerCase();
    const typeConfig = LISTING_TYPES[type];
    const title = String(body.title ?? body.serviceTitle ?? "").trim();
    const description = String(body.description ?? "").trim();
    const categoryName = String(body.category ?? "").trim();
    const campus = String(body.campus ?? body.location ?? "").trim();
    const images = body.images;
    const details = body.details && typeof body.details === "object" && !Array.isArray(body.details)
      ? body.details
      : {};
    const durationPrices = Object.values(body.durations ?? {}).map(Number).filter(Number.isFinite);
    const price = Number(body.price ?? durationPrices[0] ?? 0);

    if (!typeConfig || !title || !description || !categoryName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!Number.isFinite(price) || (type !== "service" && price <= 0) || price < 0) {
      return res.status(400).json({ error: "Price must be greater than 0" });
    }

    if (!Array.isArray(images) || images.length === 0 || images.length > 5 ||
      images.some((image) => typeof image !== "string" || !image.trim())) {
      return res.status(400).json({ error: "Provide between 1 and 5 valid image URLs" });
    }

    const sellerId = BigInt(req.user.telegramId);
    const category = await prisma.category.upsert({
      where: {
        name_type: {
          name: categoryName,
          type: typeConfig.categoryType,
        },
      },
      create: {
        name: categoryName,
        type: typeConfig.categoryType,
      },
      update: {},
    });

    if (!category.isActive) {
      return res.status(400).json({ error: "This listing category is not available" });
    }

    let originalListing = null;
    const originalListingId = body.originalListingId ?? body.id ?? null;
    if (originalListingId) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(originalListingId)) {
        return res.status(400).json({ error: "Invalid listing ID" });
      }
      originalListing = await prisma.listing.findFirst({
        where: {
          id: originalListingId,
          sellerId,
          deletedAt: null,
          status: { in: ["ACTIVE", "PAUSED", "SOLD", "RENTED"] },
        },
      });
      if (!originalListing) {
        return res.status(404).json({ error: "Listing to edit was not found" });
      }
      const existingEdit = await prisma.listing.findFirst({
        where: {
          originalListingId,
          status: "PENDING",
          deletedAt: null,
        },
        select: { id: true },
      });
      if (existingEdit) {
        return res.status(409).json({ error: "An edit for this listing is already awaiting review" });
      }
    }

    const listing = await prisma.listing.create({
      data: {
        sellerId,
        categoryId: category.id,
        title,
        description,
        price,
        imageUrls: images,
        listingType: typeConfig.listingType,
        details,
        campus,
        originalListingId,
        status: "PENDING",
        expiresAt: originalListing?.expiresAt ??
          new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      },
    });

    return res.status(201).json({
      ...listing,
      sellerId: listing.sellerId.toString(),
      price: Number(listing.price),
      message: "Listing submitted for moderator review",
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
      where: { status: "ACTIVE", deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        seller: {
          select: { name: true, username: true },
        },
      },
    });

    res.status(200).json(listings.map(serializeListing));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
}

// GET /listings/search
async function searchListings(req, res) {
  try {
    const q = req.query.q?.toString().trim();

    if (!q) {
      return res.status(200).json([]);
    }

    const listings = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        seller: {
          select: { name: true, username: true },
        },
      },
    });

    return res.status(200).json(listings.map(serializeListing));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to search listings" });
  }
}

// GET /listings/:id
async function getListingDetail(req, res) {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findFirst({
      where: { id, status: "ACTIVE", deletedAt: null },
      include: {
        category: { select: { name: true } },
        seller: {
          select: { name: true, username: true, phone: true, showPhone: true },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const seller = serializeListing(listing).seller;
    if (listing.seller.showPhone) {
      seller.phone = listing.seller.phone;
    }

    res.status(200).json({ ...serializeListing(listing), seller });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch listing" });
  }
}

// PATCH /listings/:id
async function updateListing(req, res) {
  try {
    const { id } = req.params;
    const { title, description, price, category_id, images, status } = req.body;

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // TODO: replace with req.user.telegramId once T-AUTH-003 merges
    const requesterId = BigInt(req.user.telegramId);
    if (existing.sellerId !== requesterId) {
      return res.status(403).json({ error: "Not authorized to edit this listing" });
    }
    if (existing.status === "PENDING" || existing.status === "EXPIRED" || existing.deletedAt) {
      return res.status(409).json({ error: "This listing cannot be edited in its current state" });
    }

    if (price !== undefined && price <= 0) {
      return res.status(400).json({ error: "Price must be greater than 0" });
    }
    if (images && images.length > 5) {
      return res.status(400).json({ error: "Maximum 5 images allowed" });
    }
    const isValidStatusTransition = status === undefined ||
      (status === "PAUSED" && existing.status === "ACTIVE") ||
      (status === "ACTIVE" && existing.status === "PAUSED") ||
      (status === "SOLD" && ["ACTIVE", "PAUSED"].includes(existing.status)) ||
      (status === "RENTED" && existing.listingType === "RENT" &&
        ["ACTIVE", "PAUSED"].includes(existing.status));
    if (!isValidStatusTransition) {
      return res.status(400).json({ error: "Invalid listing status transition" });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price !== undefined && { price }),
        ...(category_id && { categoryId: parseInt(category_id) }),
        ...(images && { imageUrls: images }),
        ...(status && { status }),
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
    const requesterId = BigInt(req.user.telegramId);
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
    const requesterId = BigInt(req.user.telegramId);
    if (existing.sellerId !== requesterId) {
      return res.status(403).json({ error: "Not authorized to mark this listing as sold" });
    }
    if (!["ACTIVE", "PAUSED"].includes(existing.status)) {
      return res.status(409).json({ error: "This listing cannot be marked as sold in its current state" });
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
  getMyListings,
  searchListings,
  getListingDetail,
  updateListing,
  deleteListing,
  markAsSold,
};