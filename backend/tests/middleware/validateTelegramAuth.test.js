const crypto = require("crypto");
const validateTelegramAuth = require("../../src/middleware/validateTelegramAuth");

describe("validateTelegramAuth Middleware", () => {
  const MOCK_BOT_TOKEN = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz";
  let req, res, next;

  beforeEach(() => {
    process.env.BOT_TOKEN = MOCK_BOT_TOKEN;
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  function createValidInitData(
    userDataObj = { id: 123456789, first_name: "Nahom" },
  ) {
    const userStr = JSON.stringify(userDataObj);
    const authDate = Math.floor(Date.now() / 1000).toString();
    const params = new Map([
      ["auth_date", authDate],
      ["query_id", "AAH..."],
      ["user", userStr],
    ]);

    const dataCheckArr = Array.from(params.entries())
      .map(([k, v]) => `${k}=${v}`)
      .sort();
    const dataCheckString = dataCheckArr.join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(MOCK_BOT_TOKEN)
      .digest();

    const hash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    return `auth_date=${authDate}&query_id=AAH...&user=${encodeURIComponent(userStr)}&hash=${hash}`;
  }

  test("1. Should pass and attach req.telegramUser on valid initData", () => {
    req.body.initData = createValidInitData();

    validateTelegramAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.telegramUser).toBeDefined();
    expect(req.telegramUser.first_name).toBe("Nahom");
  });

  test("2. Should return 401 for tampered hash", () => {
    const validData = createValidInitData();
    req.body.initData = validData.replace(
      /hash=[a-f0-9]+/,
      "hash=badhash12345",
    );

    validateTelegramAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid Telegram auth" });
    expect(next).not.toHaveBeenCalled();
  });

  test("3. Should return 401 when initData is missing", () => {
    req.body = {};

    validateTelegramAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid Telegram auth" });
    expect(next).not.toHaveBeenCalled();
  });

  test("4. Should return 401 when hash field is missing from initData", () => {
    req.body.initData = "auth_date=1600000000&query_id=AAH...";

    validateTelegramAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid Telegram auth" });
    expect(next).not.toHaveBeenCalled();
  });

  test("5. Should never reveal BOT_TOKEN in responses or errors", () => {
    delete process.env.BOT_TOKEN;
    req.body.initData = "hash=somehash";

    validateTelegramAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    const responseJson = JSON.stringify(res.json.mock.calls[0][0]);
    expect(responseJson).not.toContain(MOCK_BOT_TOKEN);
  });
});
