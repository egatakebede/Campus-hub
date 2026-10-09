const prisma = require("../../src/lib/prisma");
const {
  approveListing,
  getPendingListings,
  rejectListing,
} = require("../../src/controllers/listingModerationController");

jest.mock("../../src/lib/prisma", () => ({
  listing: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
}));

describe("listing moderation persistence", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { id: "0ef93c50-f9a0-4dab-9c68-fdf09c922118" } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("loads persisted pending listings with safe seller IDs", async () => {
    prisma.listing.findMany.mockResolvedValue([{
      id: req.params.id,
      sellerId: BigInt("123456789"),
      listingType: "SELL",
      price: 350,
      imageUrls: ["https://images.example/item.jpg"],
      details: { condition: "good" },
      category: { name: "Electronics" },
      seller: { name: "Student", username: null },
    }]);

    await getPendingListings(req, res, next);

    expect(res.json.mock.calls[0][0][0]).toMatchObject({
      id: req.params.id,
      sellerId: "123456789",
      type: "sell",
      photoUrl: "https://images.example/item.jpg",
      postedBy: "Student",
      payload: { condition: "good" },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("publishes a persisted pending listing on approval", async () => {
    prisma.listing.findFirst.mockResolvedValue({
      id: req.params.id,
      originalListingId: null,
    });
    prisma.listing.updateMany.mockResolvedValue({ count: 1 });

    await approveListing(req, res, next);

    expect(prisma.listing.updateMany).toHaveBeenCalledWith({
      where: { id: req.params.id, status: "PENDING", deletedAt: null },
      data: { status: "ACTIVE" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("applies an approved pending edit to the original listing atomically", async () => {
    const pending = {
      id: req.params.id,
      sellerId: BigInt("123456789"),
      originalListingId: "8b00adcc-669a-4c52-a1c7-e0a8d9d13fce",
      categoryId: 7,
      title: "Updated title",
      description: "Updated description",
      price: 420,
      imageUrls: ["https://images.example/new.jpg"],
      listingType: "RENT",
      details: { durations: { day: 420 } },
      campus: "South Campus",
    };
    const tx = {
      listing: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findFirst: jest.fn().mockResolvedValue({ id: pending.originalListingId }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    prisma.listing.findFirst.mockResolvedValue(pending);
    prisma.$transaction.mockImplementation((callback) => callback(tx));

    await approveListing(req, res, next);

    expect(tx.listing.update).toHaveBeenNthCalledWith(1, {
      where: { id: pending.originalListingId },
      data: expect.objectContaining({
        title: pending.title,
        description: pending.description,
        price: pending.price,
        listingType: "RENT",
      }),
    });
    expect(tx.listing.update).toHaveBeenNthCalledWith(2, {
      where: { id: pending.id },
      data: { deletedAt: expect.any(Date) },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("persists rejection by soft-deleting only a pending listing", async () => {
    prisma.listing.updateMany.mockResolvedValue({ count: 1 });

    await rejectListing(req, res, next);

    expect(prisma.listing.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: req.params.id, status: "PENDING", deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });
});
