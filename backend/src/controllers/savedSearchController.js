const prisma = require("../lib/prisma");

const MAX_SAVED_SEARCHES = 10;

async function getSavedSearches(req, res, next) {
  try {
    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId: BigInt(req.user.telegramId) },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(savedSearches);
  } catch (error) {
    return next(error);
  }
}

async function createSavedSearch(req, res, next) {
  try {
    const query = String(req.body?.query ?? "").trim().replace(/\s+/g, " ");
    if (query.length < 2 || query.length > 80) {
      return res.status(400).json({ error: "Search must be between 2 and 80 characters" });
    }

    const userId = BigInt(req.user.telegramId);
    const normalizedQuery = query.toLowerCase();
    const existing = await prisma.savedSearch.findUnique({
      where: { userId_normalizedQuery: { userId, normalizedQuery } },
    });
    if (existing) return res.status(200).json(existing);

    const count = await prisma.savedSearch.count({ where: { userId } });
    if (count >= MAX_SAVED_SEARCHES) {
      return res.status(409).json({ error: `You can save up to ${MAX_SAVED_SEARCHES} searches` });
    }

    const savedSearch = await prisma.savedSearch.create({
      data: { userId, query, normalizedQuery },
    });
    return res.status(201).json(savedSearch);
  } catch (error) {
    if (error.code === "P2002") {
      const existing = await prisma.savedSearch.findUnique({
        where: {
          userId_normalizedQuery: {
            userId: BigInt(req.user.telegramId),
            normalizedQuery: String(req.body?.query ?? "").trim().replace(/\s+/g, " ").toLowerCase(),
          },
        },
      });
      if (existing) return res.status(200).json(existing);
    }
    return next(error);
  }
}

async function deleteSavedSearch(req, res, next) {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "Invalid saved search ID" });
    }

    const result = await prisma.savedSearch.deleteMany({
      where: {
        id: req.params.id,
        userId: BigInt(req.user.telegramId),
      },
    });
    if (!result.count) return res.status(404).json({ error: "Saved search not found" });
    return res.status(200).json({ deleted: true });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getSavedSearches, createSavedSearch, deleteSavedSearch };