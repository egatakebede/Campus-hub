const prisma = require("../../lib/prisma");

const deleteListingByModerator = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.listing.findFirst({ where: { id, deletedAt: null } });
    if (!existing) return res.status(404).json({ error: "Listing not found" });

    await prisma.listing.update({ where: { id }, data: { deletedAt: new Date() } });

    return res.status(200).json({ message: "Listing removed by moderator" });
  } catch (error) {
    next(error);
  }
};

const deleteServiceByModerator = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.serviceProfile.findFirst({ where: { id, deletedAt: null } });
    if (!existing) return res.status(404).json({ error: "Service not found" });

    await prisma.serviceProfile.update({ where: { id }, data: { deletedAt: new Date() } });

    return res.status(200).json({ message: "Service removed by moderator" });
  } catch (error) {
    next(error);
  }
};

module.exports = { deleteListingByModerator, deleteServiceByModerator };
