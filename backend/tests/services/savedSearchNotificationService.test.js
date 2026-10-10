const prisma = require("../../src/lib/prisma");
const { notifySavedSearchesForListing } = require("../../src/services/savedSearchNotificationService");

jest.mock("../../src/lib/prisma", () => ({
  savedSearch: { findMany: jest.fn() },
}));

describe("savedSearchNotificationService", () => {
  const originalFetch = global.fetch;
  const originalBotToken = process.env.BOT_TOKEN;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BOT_TOKEN = "test-bot-token";
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
  });

  afterAll(() => {
    global.fetch = originalFetch;
    if (originalBotToken === undefined) delete process.env.BOT_TOKEN;
    else process.env.BOT_TOKEN = originalBotToken;
  });

  it("sends one alert per matching user and excludes the listing seller", async () => {
    prisma.savedSearch.findMany.mockResolvedValue([
      { query: "calculator", user: { telegramId: BigInt("123") } },
      { query: "scientific", user: { telegramId: BigInt("123") } },
      { query: "fridge", user: { telegramId: BigInt("456") } },
    ]);

    await notifySavedSearchesForListing({
      id: "0ef93c50-f9a0-4dab-9c68-fdf09c922118",
      sellerId: BigInt("789"),
      listingType: "SELL",
      title: "Scientific Calculator",
      description: "A used calculator in good condition.",
    });

    expect(prisma.savedSearch.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: { not: BigInt("789") } }),
    }));
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.chat_id).toBe("123");
    expect(body.text).toContain("calculator, scientific");
    expect(body.reply_markup.inline_keyboard[0][0].web_app.url)
      .toContain("/listing/sell/0ef93c50-f9a0-4dab-9c68-fdf09c922118");
  });

  it("does not query saved searches when the bot is not configured", async () => {
    delete process.env.BOT_TOKEN;

    await notifySavedSearchesForListing({});

    expect(prisma.savedSearch.findMany).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});