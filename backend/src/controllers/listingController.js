const prisma = require("../lib/prisma");
const { uploadImage } = require("../services/uploadService");

async function createListing(req, res) {
  try {
    const { title, description, price, category_id, images } = req.body;

    if (!title || !description || !price || !category_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (price <= 0) {
      return res.status(400).json({ error: "Price must be greater than zero" });
    }

    if (images && images.length > 5) {
      return res.status(400).json({ error: "Maximum 5 images allowed" });
    }

    // TODO: replace with req.user.telegramId once T-AUTH-003 merges
    const sellerId = 123456;

    const expiresAt = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000);

    const listing = await prisma.listing.create({
      data: {
        sellerId: BigInt(sellerId),
        categoryId: parseInt(category_id),
        title,
        description,
        price,
        imageUrls: images || [],
        status: "ACTIVE",
        expiresAt
      }
    });

    // Convert BigInt to string for JSON response
    const responseListing = {
      ...listing,
      sellerId: listing.sellerId.toString()
    };

    res.status(201).json(responseListing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create listing" });
  }
}

async function uploadListingImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const url = await uploadImage(req.file, "listing-images");
    res.status(200).json({ url });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

module.exports = { createListing, uploadListingImage };
