const prisma = require("../../src/lib/prisma");
const {
  getSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
} = require("../../src/controllers/savedSearchController");

jest.mock("../../src/lib/prisma", () => ({
  savedSearch: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

describe("savedSearchController", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: { query: "  Mini   Fridge " },
      params: { id: "0ef93c50-f9a0-4dab-9c68-fdf09c922118" },
      user: { telegramId: "123456789" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("returns only the current user's saved searches", async () => {
    prisma.savedSearch.findMany.mockResolvedValue([{ query: "Calculator" }]);

    await getSavedSearches(req, res, next);

    expect(prisma.savedSearch.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: BigInt("123456789") },
    }));
    expect(res.json).toHaveBeenCalledWith([{ query: "Calculator" }]);
  });

  it("normalizes whitespace and casing before creating a saved search", async () => {
    prisma.savedSearch.findUnique.mockResolvedValue(null);
    prisma.savedSearch.count.mockResolvedValue(0);
    prisma.savedSearch.create.mockResolvedValue({ query: "Mini Fridge" });

    await createSavedSearch(req, res, next);

    expect(prisma.savedSearch.create).toHaveBeenCalledWith({
      data: {
        userId: BigInt("123456789"),
        query: "Mini Fridge",
        normalizedQuery: "mini fridge",
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("rejects blank or excessively long queries", async () => {
    req.body.query = "x";

    await createSavedSearch(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.savedSearch.create).not.toHaveBeenCalled();
  });

  it("enforces the per-user saved search limit", async () => {
    prisma.savedSearch.findUnique.mockResolvedValue(null);
    prisma.savedSearch.count.mockResolvedValue(10);

    await createSavedSearch(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(prisma.savedSearch.create).not.toHaveBeenCalled();
  });

  it("deletes a saved search only for its owner", async () => {
    prisma.savedSearch.deleteMany.mockResolvedValue({ count: 1 });

    await deleteSavedSearch(req, res, next);

    expect(prisma.savedSearch.deleteMany).toHaveBeenCalledWith({
      where: {
        id: req.params.id,
        userId: BigInt("123456789"),
      },
    });
    expect(res.json).toHaveBeenCalledWith({ deleted: true });
  });
});