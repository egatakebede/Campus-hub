const prisma = require("../lib/prisma");
const { uploadImage } = require("../services/uploadService");

async function getServices(req, res) {
  try {
    const services = await prisma.serviceProfile.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        provider: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const safeServices = services.map((service) => ({
      ...service,
      providerId: service.providerId.toString(),
      provider: {
        name: service.provider.name,
        username: service.provider.username,
      },
    }));

    return res.status(200).json(safeServices);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch services" });
  }
}

async function searchServices(req, res) {
  try {
    const q = req.query.q?.toString().trim();

    if (!q) {
      return res.status(200).json([]);
    }

    const services = await prisma.serviceProfile.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        provider: { select: { name: true, username: true } },
      },
    });

    const safeServices = services.map((service) => ({
      ...service,
      providerId: service.providerId.toString(),
      provider: {
        name: service.provider.name,
        username: service.provider.username,
      },
    }));

    return res.status(200).json(safeServices);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to search services" });
  }
}

async function getServiceDetail(req, res) {
  try {
    const { id } = req.params;

    const service = await prisma.serviceProfile.findFirst({
      where: { id, deletedAt: null },
      include: {
        provider: {
          select: { name: true, username: true, phone: true, showPhone: true },
        },
      },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const provider = {
      name: service.provider.name,
      username: service.provider.username,
    };

    if (service.provider.showPhone) {
      provider.phone = service.provider.phone;
    }

    return res.status(200).json({
      ...service,
      providerId: service.providerId.toString(),
      provider,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch service" });
  }
}

async function uploadServiceImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const url = await uploadImage(req.file, "service-images");
    return res.status(200).json({ url });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getServices,
  searchServices,
  getServiceDetail,
  uploadServiceImage,
  createService,
  updateService,
  deleteService,
};

async function createService(req, res) {
  try {
    const { title, description, category_id, portfolio_images } = req.body;
    const providerId = req.user?.telegramId;

    if (!providerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!title || !description || !category_id) {
      return res.status(400).json({ error: "title, description, and category_id are required" });
    }
    const catId = Number(category_id);
    if (!Number.isInteger(catId) || catId <= 0) {
      return res.status(400).json({ error: "Invalid category_id" });
    }
    if (title.length > 150) {
      return res.status(400).json({ error: "Title must be 150 characters or fewer" });
    }
    if (description.length > 2000) {
      return res.status(400).json({ error: "Description must be 2000 characters or fewer" });
    }

    const images = Array.isArray(portfolio_images) ? portfolio_images : [];
    if (images.length > 8) {
      return res.status(400).json({ error: "Maximum 8 portfolio images allowed" });
    }

    const service = await prisma.serviceProfile.create({
      data: {
        providerId: BigInt(providerId),
        categoryId: catId,
        title,
        description,
        portfolioImages: images,
        isActive: true,
      },
    });

    return res.status(201).json({
      ...service,
      providerId: service.providerId.toString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create service" });
  }
}

async function updateService(req, res) {
  try {
    const { id } = req.params;
    const providerId = req.user?.telegramId;

    const existing = await prisma.serviceProfile.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }

    if (existing.providerId.toString() !== String(providerId)) {
      return res.status(403).json({ error: "Not authorized to edit this service" });
    }

    const { title, description, category_id, portfolio_images } = req.body;

    if (portfolio_images && portfolio_images.length > 8) {
      return res.status(400).json({ error: "Maximum 8 portfolio images allowed" });
    }

    const updated = await prisma.serviceProfile.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category_id && { categoryId: Number(category_id) }),
        ...(portfolio_images && { portfolioImages: portfolio_images }),
      },
    });

    return res.status(200).json({
      ...updated,
      providerId: updated.providerId.toString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update service" });
  }
}

async function deleteService(req, res) {
  try {
    const { id } = req.params;
    const providerId = req.user?.telegramId;
    const isModerator = req.user?.isModerator;

    const existing = await prisma.serviceProfile.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }

    if (existing.providerId.toString() !== String(providerId) && !isModerator) {
      return res.status(403).json({ error: "Not authorized to delete this service" });
    }

    await prisma.serviceProfile.update({ where: { id }, data: { deletedAt: new Date() } });

    return res.status(200).json({ message: "Service deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete service" });
  }
}
