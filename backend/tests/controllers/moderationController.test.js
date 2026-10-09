const prisma = require("../../src/lib/prisma");
const {
  approveUser,
  getPendingUsers,
  rejectUser,
} = require("../../src/controllers/moderationController");
const {
  createPrivateImageSignedUrl,
  removePrivateImage,
} = require("../../src/services/uploadService");

jest.mock("../../src/lib/prisma", () => ({
  user: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
}));

jest.mock("../../src/services/uploadService", () => ({
  createPrivateImageSignedUrl: jest.fn(),
  removePrivateImage: jest.fn(),
}));

describe("moderationController verification requests", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("loads only submitted requests and returns a signed photo URL without exposing storage paths", async () => {
    prisma.user.findMany.mockResolvedValue([{
      telegramId: BigInt("123456789"),
      name: "Student Name",
      studentIdNumber: "1938/27",
      department: "Computer Science",
      idPhotoPath: "123456789/id.jpg",
      verificationSubmittedAt: new Date("2026-10-09T12:00:00.000Z"),
    }]);
    prisma.user.count.mockResolvedValue(1);
    createPrivateImageSignedUrl.mockResolvedValue("https://signed.example/id.jpg");

    await getPendingUsers(req, res, next);

    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        status: "PENDING",
        verificationSubmittedAt: { not: null },
      },
    }));
    expect(createPrivateImageSignedUrl).toHaveBeenCalledWith(
      "123456789/id.jpg",
      "verification-ids",
    );
    expect(res.json.mock.calls[0][0].data[0]).toMatchObject({
      telegramId: "123456789",
      name: "Student Name",
      studentIdNumber: "1938/27",
      idPhoto: "https://signed.example/id.jpg",
    });
    expect(res.json.mock.calls[0][0].data[0]).not.toHaveProperty("idPhotoPath");
    expect(next).not.toHaveBeenCalled();
  });

  it("approves only a user who has a persisted verification submission", async () => {
    req.params.id = "123456789";
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.findUnique.mockResolvedValue({
      telegramId: BigInt("123456789"),
      status: "ACTIVE",
    });

    await approveUser(req, res, next);

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: {
        telegramId: BigInt("123456789"),
        status: "PENDING",
        verificationSubmittedAt: { not: null },
      },
      data: { status: "ACTIVE" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("clears a denied submission so the student can submit again", async () => {
    req.params.id = "123456789";
    prisma.user.findUnique
      .mockResolvedValueOnce({
        telegramId: BigInt("123456789"),
        status: "PENDING",
        verificationSubmittedAt: new Date(),
        idPhotoPath: "123456789/id.jpg",
      })
      .mockResolvedValueOnce({
        telegramId: BigInt("123456789"),
        status: "PENDING",
        verificationSubmittedAt: null,
      });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    await rejectUser(req, res, next);

    expect(prisma.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        verificationSubmittedAt: null,
        studentIdNumber: null,
        idPhotoPath: null,
      },
    }));
    expect(removePrivateImage).toHaveBeenCalledWith(
      "123456789/id.jpg",
      "verification-ids",
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });
});
