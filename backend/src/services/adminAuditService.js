const prisma = require("../lib/prisma");

async function recordAdminAction(req, { action, targetType, targetId = null, details = null }) {
  if (!req.user?.telegramId || !prisma.adminAuditLog) return;

  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: BigInt(req.user.telegramId),
        action,
        targetType,
        targetId: targetId == null ? null : String(targetId),
        details,
      },
    });
  } catch (error) {
    console.error("Failed to record admin action:", error.message);
  }
}

module.exports = { recordAdminAction };