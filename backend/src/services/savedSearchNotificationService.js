const prisma = require("../lib/prisma");

const APP_URL = process.env.FRONTEND_URL || "https://campus-hub2026.vercel.app";
const LISTING_ROUTE = {
  SELL: "sell",
  RENT: "rent",
  SERVICE: "service",
};

async function notifySavedSearchesForListing(listing) {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) return;

  const savedSearches = await prisma.savedSearch.findMany({
    where: {
      userId: { not: listing.sellerId },
      user: { status: "ACTIVE" },
    },
    select: {
      query: true,
      user: { select: { telegramId: true } },
    },
  });

  const searchableText = `${listing.title} ${listing.description}`.toLowerCase();
  const matchesByUser = new Map();
  for (const savedSearch of savedSearches) {
    if (!searchableText.includes(savedSearch.query.toLowerCase())) continue;
    const userId = savedSearch.user.telegramId.toString();
    const matchedQueries = matchesByUser.get(userId) ?? new Set();
    matchedQueries.add(savedSearch.query);
    matchesByUser.set(userId, matchedQueries);
  }

  const route = LISTING_ROUTE[listing.listingType];
  if (!route) return;

  const listingUrl = new URL(`/listing/${route}/${listing.id}`, APP_URL).toString();
  const messages = [...matchesByUser.entries()].map(async ([chatId, queries]) => {
    const querySummary = [...queries].join(", ");
    const text = `A new listing matches your saved search${queries.size > 1 ? "es" : ""} (${querySummary}):\n${listing.title}`;

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          reply_markup: {
            inline_keyboard: [[
              { text: "Open listing", web_app: { url: listingUrl } },
            ]],
          },
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) console.error(`Telegram saved-search alert failed: ${response.status}`);
    } catch (error) {
      console.error("Telegram saved-search alert could not be delivered:", error.message);
    }
  });

  await Promise.allSettled(messages);
}

module.exports = { notifySavedSearchesForListing };