const jwt = require("jsonwebtoken");
const { telegramAuth, verifyStudent } = require("../../src/controllers/authController");
const prisma = require("../../src/lib/prisma");
const { uploadPrivateImage, removePrivateImage } = require("../../src/services/uploadService");

// Mock process.env.JWT_SECRET
process.env.JWT_SECRET = "test_secret_key";

// Mock Prisma client to prevent actual DB calls
jest.mock("../../src/lib/prisma", () => ({
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock("../../src/services/uploadService", () => ({
  uploadPrivateImage: jest.fn(),
  removePrivateImage: jest.fn(),
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
      department: "",
      yearOfStudy: 0,
    });

    await telegramAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);

    const responseData = res.json.mock.calls[0][0];
    expect(responseData).toHaveProperty("token");
    expect(responseData.user).toEqual({
      telegramId: "123456789",
      status: "PENDING",
      verificationStatus: "UNVERIFIED",
      isModerator: false,
      isOnboarded: false, // status is PENDING -> false
      fullName: "Nahom Azmach",
      username: "nahom_dev",
      department: "",
      yearOfStudy: 0,
      studentIdNumber: undefined,
      verificationSubmittedAt: undefined,
      bio: undefined,
      profilePictureUrl: undefined,
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
      department: "Computer Science",
      yearOfStudy: 3,
    });

    await telegramAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);

    const responseData = res.json.mock.calls[0][0];
    expect(responseData.user).toEqual({
      telegramId: "987654321",
      status: "ACTIVE",
      verificationStatus: "VERIFIED",
      isModerator: true,
      isOnboarded: true, // status is ACTIVE -> true
      fullName: "Test User",
      username: "testuser",
      department: "Computer Science",
      yearOfStudy: 3,
      studentIdNumber: undefined,
      verificationSubmittedAt: undefined,
      bio: undefined,
      profilePictureUrl: undefined,
    });
  });

  it("should return PENDING only when a verification request was saved", async () => {
    req = {
      telegramUser: {
        id: "456123789",
        first_name: "Pending",
        last_name: "Student",
        username: "pending_student",
      },
    };

    prisma.user.upsert.mockResolvedValue({
      telegramId: BigInt(456123789),
      name: "Pending Student",
      username: "pending_student",
      status: "PENDING",
      isModerator: false,
      verificationSubmittedAt: new Date(),
    });

    await telegramAuth(req, res, next);

    expect(res.json.mock.calls[0][0].user.verificationStatus).toBe("PENDING");
  });

  it("should reject duplicate verification submissions while a user is already PENDING", async () => {
    req = {
      user: { telegramId: "123456789" },
      body: {
        fullName: "Nahom Azmach",
        studentIdNumber: "1938/27",
        department: "Computer Science",
      },
    };

    prisma.user.findUnique.mockResolvedValue({
      telegramId: BigInt("123456789"),
      status: "PENDING",
      verificationSubmittedAt: new Date(),
    });

    await verifyStudent(req, res, next);

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "PENDING",
      message: "Verification request already submitted",
    });
  });

  it("should persist a first verification submission for a PENDING account without a request", async () => {
    req = {
      user: { telegramId: "123456789" },
      body: {
        fullName: "Nahom Azmach",
        studentIdNumber: "1938/27",
        department: "Computer Science, Year 3",
      },
      file: {
        buffer: Buffer.from("student id image"),
        mimetype: "image/jpeg",
        size: 16,
      },
    };

    prisma.user.findUnique.mockResolvedValue({
      telegramId: BigInt("123456789"),
      status: "PENDING",
      verificationSubmittedAt: null,
    });
    uploadPrivateImage.mockResolvedValue("123456789/id-photo.jpg");
    prisma.user.update.mockImplementation(async ({ data }) => ({
      ...data,
      verificationSubmittedAt: data.verificationSubmittedAt,
    }));

    await verifyStudent(req, res, next);

    expect(uploadPrivateImage).toHaveBeenCalledWith(
      req.file,
      "verification-ids",
      "123456789",
    );
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { telegramId: BigInt("123456789") },
      data: expect.objectContaining({
        name: "Nahom Azmach",
        department: "Computer Science, Year 3",
        studentIdNumber: "1938/27",
        idPhotoPath: "123456789/id-photo.jpg",
        status: "PENDING",
      }),
    }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "PENDING",
      verificationStatus: "PENDING",
      message: "Verification request received",
    });
    expect(next).not.toHaveBeenCalled();
    expect(removePrivateImage).not.toHaveBeenCalled();
  });
});
