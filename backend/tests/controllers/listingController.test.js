const prisma = require("../../src/lib/prisma");
const {
  createListing,
  getMyListings,
  updateListing,
} = require("../../src/controllers/listingController");

jest.mock("../../src/lib/prisma", () => ({
  category: { upsert: jest.fn() },
  listing: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock("../../src/services/uploadService", () => ({
  uploadImage: jest.fn(),
}));

describe("listingController submission persistence", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {
        type: "sell",
        title: "Calculator",
        description: "Scientific calculator",
        category: "Electronics",
        campus: "Main Campus",
        price: 350,
        images: ["https://images.example/calculator.jpg"],
        details: { condition: "good" },
      },
      user: { telegramId: "123456789" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("stores a new listing as pending with its full details", async () => {
    prisma.category.upsert.mockResolvedValue({ id: 4, isActive: true });
    prisma.listing.create.mockResolvedValue({
      id: "0ef93c50-f9a0-4dab-9c68-fdf09c922118",
      sellerId: BigInt("123456789"),
      price: 350,
      status: "PENDING",
    });

    await createListing(req, res);

    expect(prisma.listing.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        sellerId: BigInt("123456789"),
        categoryId: 4,
        title: "Calculator",
        listingType: "SELL",
        details: { condition: "good" },
        status: "PENDING",
        imageUrls: ["https://images.example/calculator.jpg"],
      }),
    }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].message).toMatch(/moderator review/);
  });

  it("rejects incomplete listing submissions before writing a category", async () => {
    req.body.images = [];

    await createListing(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.category.upsert).not.toHaveBeenCalled();
    expect(prisma.listing.create).not.toHaveBeenCalled();
  });

  it("returns only the authenticated student's own listings", async () => {
    const listing = {
      id: "0ef93c50-f9a0-4dab-9c68-fdf09c922118",
      sellerId: BigInt("123456789"),
      listingType: "SELL",
      imageUrls: [],
      details: {},
      price: 350,
      category: { name: "Electronics" },
      seller: { name: "Student", username: null },
    };
    prisma.listing.findMany.mockResolvedValue([listing]);

    await getMyListings(req, res);

    expect(prisma.listing.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        sellerId: BigInt("123456789"),
        deletedAt: null,
      },
    }));
    expect(res.json.mock.calls[0][0][0]).toMatchObject({
      id: listing.id,
      type: "sell",
      sellerId: "123456789",
      category: "Electronics",
    });
  });

  it("persists a valid pause transition", async () => {
    req.params = { id: "0ef93c50-f9a0-4dab-9c68-fdf09c922118" };
    req.body = { status: "PAUSED" };
    prisma.listing.findUnique.mockResolvedValue({
      sellerId: BigInt("123456789"),
      status: "ACTIVE",
      deletedAt: null,
      listingType: "SELL",
    });
    prisma.listing.update.mockResolvedValue({
      sellerId: BigInt("123456789"),
      status: "PAUSED",
    });

    await updateListing(req, res);

    expect(prisma.listing.update).toHaveBeenCalledWith({
      where: { id: req.params.id },
      data: { status: "PAUSED" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("does not allow owners to bypass review by editing a pending listing", async () => {
    req.params = { id: "0ef93c50-f9a0-4dab-9c68-fdf09c922118" };
    req.body = { title: "Changed title" };
    prisma.listing.findUnique.mockResolvedValue({
      sellerId: BigInt("123456789"),
      status: "PENDING",
      deletedAt: null,
    });

    await updateListing(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(prisma.listing.update).not.toHaveBeenCalled();
  });
});
