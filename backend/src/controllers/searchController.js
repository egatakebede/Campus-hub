const prisma = require("../lib/prisma");

// GET /search/listings?q=...
async function searchListings(req, res) {
  try {
    const q = req.query.q?.trim();

    if (!q) {
      return res.status(200).json([]);
    }

    const listings = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          {
            title: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: q,
              mode: "insensitive",
            },
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const safeListings = listings.map((listing) => ({
  ...listing,
  sellerId: listing.sellerId.toString(),
}));

return res.status(200).json(safeListings);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Failed to search listings",
    });
  }
}

// GET /search/services?q=...
async function searchServices(req, res) {
  try {
    const q = req.query.q?.trim();

    if (!q) {
      return res.status(200).json([]);
    }

    const services = await prisma.serviceProfile.findMany({
      where: {
        isActive: true,
        OR: [
          {
            title: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: q,
              mode: "insensitive",
            },
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const safeServices = services.map((service) => ({
  ...service,
  providerId: service.providerId.toString(),
}));

return res.status(200).json(safeServices);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Failed to search services",
    });
  }
}

module.exports = {
  searchListings,
  searchServices,
};