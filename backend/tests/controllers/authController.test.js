const jwt = require("jsonwebtoken");
const { telegramAuth } = require("../../src/controllers/authController");
const prisma = require("../../src/lib/prisma");

// Mock process.env.JWT_SECRET
process.env.JWT_SECRET = "test_secret_key";

// Mock Prisma client to prevent actual DB calls
jest.mock("../../src/lib/prisma", () => ({
  user: {
    upsert: jest.fn(),
  },
}));

describe("authController - telegramAuth", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should handle error when req.telegramUser is missing", async () => {
    req = {}; // Missing telegramUser property

    await telegramAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should issue a valid JWT with 7-day expiry for a PENDING (new) user", async () => {
    req = {
      telegramUser: {
        id: "123456789",
        first_name: "Nahom",
        last_name: "Azmach",
        username: "nahom_dev",
      },
    };

    // Mock Prisma upsert response for a new user
    prisma.user.upsert.mockResolvedValue({
      telegramId: BigInt(123456789),
      name: "Nahom Azmach",
      username: "nahom_dev",
      status: "PENDING",
      isModerator: false,
    });

    await telegramAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);

    const responseData = res.json.mock.calls[0][0];
    expect(responseData).toHaveProperty("token");
    expect(responseData.user).toEqual({
      telegramId: "123456789",
      status: "PENDING",
      isModerator: false,
      isOnboarded: false, // status is PENDING -> false
    });

    // Verify JWT decoding & 7-day expiry claim
    const decoded = jwt.verify(responseData.token, process.env.JWT_SECRET);
    expect(decoded.telegramId).toBe("123456789");
    expect(decoded.status).toBe("PENDING");
    expect(decoded.isModerator).toBe(false);
    expect(decoded.exp - decoded.iat).toEqual(7 * 24 * 60 * 60);
  });

  it("should return isOnboarded: true for an ACTIVE user", async () => {
    req = {
      telegramUser: {
        id: "987654321",
        first_name: "Test",
        last_name: "User",
        username: "testuser",
      },
    };

    // Mock Prisma upsert response for an active user
    prisma.user.upsert.mockResolvedValue({
      telegramId: BigInt(987654321),
      name: "Test User",
      username: "testuser",
      status: "ACTIVE",
      isModerator: true,
    });

    await telegramAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);

    const responseData = res.json.mock.calls[0][0];
    expect(responseData.user).toEqual({
      telegramId: "987654321",
      status: "ACTIVE",
      isModerator: true,
      isOnboarded: true, // status is ACTIVE -> true
    });
  });
});
