const prisma = require("../lib/prisma");
const { uploadImage } = require("../services/uploadService");

async function getServices(req, res) {
  try {
    const services = await prisma.serviceProfile.findMany({
      where: { isActive: true },
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

async function getServiceDetail(req, res) {
  try {
    const { id } = req.params;

    const service = await prisma.serviceProfile.findUnique({
      where: { id },
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

module.exports = { getServices, getServiceDetail, uploadServiceImage };
