const { getAdminTelegramIds, notifyAdminsOfVerification } = require("../../src/services/verificationNotificationService");

describe("verificationNotificationService", () => {
  const originalBotToken = process.env.BOT_TOKEN;
  const originalAdminIds = process.env.ADMIN_TELEGRAM_IDS;
  const originalFrontendUrl = process.env.FRONTEND_URL;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.BOT_TOKEN = "test-bot-token";
    process.env.ADMIN_TELEGRAM_IDS = "12345, invalid, 67890,12345";
    process.env.FRONTEND_URL = "https://campus.example";
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
  });

  afterAll(() => {
    if (originalBotToken === undefined) delete process.env.BOT_TOKEN;
    else process.env.BOT_TOKEN = originalBotToken;
    if (originalAdminIds === undefined) delete process.env.ADMIN_TELEGRAM_IDS;
    else process.env.ADMIN_TELEGRAM_IDS = originalAdminIds;
    if (originalFrontendUrl === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = originalFrontendUrl;
    global.fetch = originalFetch;
  });

  it("parses unique numeric Telegram admin IDs only", () => {
    expect(getAdminTelegramIds()).toEqual(["12345", "67890"]);
  });

  it("sends a privacy-conscious queue notification to each configured admin", async () => {
    const result = await notifyAdminsOfVerification({
      name: "Student Name",
      department: "Computer Science",
      studentIdNumber: "1938/27",
      idPhotoPath: "private/photo.jpg",
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.chat_id).toBe("12345");
    expect(body.text).toContain("Student Name");
    expect(body.text).not.toContain("1938/27");
    expect(body.text).not.toContain("private/photo.jpg");
    expect(body.reply_markup.inline_keyboard[0][0].web_app.url)
      .toBe("https://campus.example/admin/verifications");
    expect(result).toEqual({ sent: 2, failed: 0 });
  });

  it("does not try to send when bot or admin recipients are not configured", async () => {
    delete process.env.ADMIN_TELEGRAM_IDS;

    await expect(notifyAdminsOfVerification({ name: "Student" }))
      .resolves.toEqual({ sent: 0 });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});