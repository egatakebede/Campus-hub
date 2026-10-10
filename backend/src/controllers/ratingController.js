const prisma = require("../lib/prisma");

const APP_TARGET_ID = "campus-hub";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveTarget(targetType, targetId) {
  if (targetType === "SELLER") {
    if (!/^\d{1,20}$/.test(targetId)) return null;
    const seller = await prisma.user.findUnique({
      where: { telegramId: BigInt(targetId) },
      select: { telegramId: true },
    });
    return seller ? { targetType, targetId, sellerId: seller.telegramId } : null;
  }

  if (targetType === "LISTING") {
    if (!UUID_PATTERN.test(targetId)) return null;
    const listing = await prisma.listing.findFirst({
      where: { id: targetId, status: "ACTIVE", deletedAt: null },
      select: { sellerId: true },
    });
    return listing ? { targetType, targetId, sellerId: listing.sellerId } : null;
  }

  if (targetType === "APP" && targetId === APP_TARGET_ID) {
    return { targetType, targetId };
  }

  return null;
}

function getTargetParameters(req) {
  return {
    targetType: String(req.params.targetType ?? "").toUpperCase(),
    targetId: String(req.params.targetId ?? ""),
  };
}

function canRateTarget(target, reviewerId) {
  return target.targetType === "APP" || target.sellerId !== BigInt(reviewerId);
}

async function getRating(req, res) {
  try {
    const { targetType, targetId } = getTargetParameters(req);
    const target = await resolveTarget(targetType, targetId);
    if (!target) return res.status(404).json({ error: "Rating target not found" });

    const reviewerId = BigInt(req.user.telegramId);
    const where = { targetType, targetId };
    const [aggregate, ownRating] = await Promise.all([
      prisma.rating.aggregate({
        where,
        _avg: { score: true },
        _count: { _all: true },
      }),
      prisma.rating.findUnique({
        where: {
          reviewerId_targetType_targetId: { reviewerId, targetType, targetId },
        },
        select: { score: true },
      }),
    ]);

    return res.status(200).json({
      average: aggregate._avg.score === null ? null : Number(aggregate._avg.score),
      count: aggregate._count._all,
      myScore: ownRating?.score ?? null,
      canRate: canRateTarget(target, reviewerId),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch rating" });
  }
}

async function saveRating(req, res) {
  try {
    const score = req.body?.score;
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return res.status(400).json({ error: "Rating must be a whole number from 1 to 5" });
    }

    const { targetType, targetId } = getTargetParameters(req);
    const target = await resolveTarget(targetType, targetId);
    if (!target) return res.status(404).json({ error: "Rating target not found" });

    const reviewerId = BigInt(req.user.telegramId);
    if (!canRateTarget(target, reviewerId)) {
      return res.status(403).json({ error: "You cannot rate your own account or listing" });
    }

    await prisma.rating.upsert({
      where: {
        reviewerId_targetType_targetId: { reviewerId, targetType, targetId },
      },
      create: { reviewerId, targetType, targetId, score },
      update: { score },
    });

    return getRating(req, res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to save rating" });
  }
}

module.exports = { getRating, saveRating };