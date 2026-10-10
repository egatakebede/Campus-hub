const prisma = require("../../src/lib/prisma");
const { getRating, saveRating } = require("../../src/controllers/ratingController");

jest.mock("../../src/lib/prisma", () => ({
  user: { findUnique: jest.fn() },
  listing: { findFirst: jest.fn() },
  rating: {
    aggregate: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
}));

describe("ratingController", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { targetType: "app", targetId: "campus-hub" },
      body: { score: 4 },
      user: { telegramId: "123456789" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    prisma.rating.aggregate.mockResolvedValue({ _avg: { score: 4.5 }, _count: { _all: 2 } });
    prisma.rating.findUnique.mockResolvedValue({ score: 5 });
  });

  it("returns aggregate and current user's app rating", async () => {
    await getRating(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      average: 4.5,
      count: 2,
      myScore: 5,
      canRate: true,
    });
  });

  it("rejects scores outside the one-to-five range", async () => {
    req.body.score = 6;

    await saveRating(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.rating.upsert).not.toHaveBeenCalled();
  });

  it("prevents users from rating themselves", async () => {
    req.params = { targetType: "seller", targetId: "123456789" };
    prisma.user.findUnique.mockResolvedValue({ telegramId: BigInt("123456789") });

    await saveRating(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.rating.upsert).not.toHaveBeenCalled();
  });

  it("upserts one rating per user and target", async () => {
    prisma.rating.findUnique.mockResolvedValueOnce({ score: 4 });

    await saveRating(req, res);

    expect(prisma.rating.upsert).toHaveBeenCalledWith({
      where: {
        reviewerId_targetType_targetId: {
          reviewerId: BigInt("123456789"),
          targetType: "APP",
          targetId: "campus-hub",
        },
      },
      create: {
        reviewerId: BigInt("123456789"),
        targetType: "APP",
        targetId: "campus-hub",
        score: 4,
      },
      update: { score: 4 },
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ myScore: 4 }));
  });
});