const prisma = require("../../src/lib/prisma");
const {
  approveUser,
  getAllUsers,
  getPendingUsers,
  rejectUser,
  setUserStatus,
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

  it("searches and paginates non-moderator accounts", async () => {
    req.query = { q: "student", status: "ACTIVE", page: "2", limit: "25" };
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(30);

    await getAllUsers(req, res, next);

    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        isModerator: false,
        status: "ACTIVE",
        OR: expect.arrayContaining([
          { name: { contains: "student", mode: "insensitive" } },
        ]),
      }),
      skip: 25,
      take: 25,
    }));
    expect(res.json.mock.calls[0][0].pagination).toMatchObject({
      page: 2,
      limit: 25,
      total: 30,
      totalPages: 2,
    });
  });

  it("does not allow moderators to change their own access", async () => {
    req.params.id = "123456789";
    req.user = { telegramId: "123456789" };
    req.body = { status: "BANNED" };

    await setUserStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it("does not allow changing another moderator's access", async () => {
    req.params.id = "987654321";
    req.user = { telegramId: "123456789" };
    req.body = { status: "BANNED" };
    prisma.user.findUnique.mockResolvedValue({
      telegramId: BigInt("987654321"),
      name: "Moderator",
      status: "ACTIVE",
      isModerator: true,
    });

    await setUserStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it("changes an ordinary user's status with a guarded update", async () => {
    req.params.id = "123456789";
    req.user = { telegramId: "987654321" };
    req.body = { status: "SUSPENDED" };
    prisma.user.findUnique.mockResolvedValue({
      telegramId: BigInt("123456789"),
      name: "Student",
      status: "ACTIVE",
      isModerator: false,
    });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    await setUserStatus(req, res, next);

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: {
        telegramId: BigInt("123456789"),
        isModerator: false,
        status: "ACTIVE",
      },
      data: { status: "SUSPENDED" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
