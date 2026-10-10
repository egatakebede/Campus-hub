const prisma = require("../lib/prisma");

async function getRecentActions(req, res, next) {
  try {
    const actions = await prisma.adminAuditLog.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { name: true } } },
    });

    return res.status(200).json(actions.map((entry) => ({
      id: entry.id,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      details: entry.details,
      actorName: entry.actor?.name ?? "Moderator",
      createdAt: entry.createdAt,
    })));
  } catch (error) {
    return next(error);
  }
}

module.exports = { getRecentActions };