const prisma = require('../../src/lib/prisma');
const listingController = require('../../src/controllers/listingController');
const serviceController = require('../../src/controllers/serviceController');

jest.mock('../../src/lib/prisma', () => ({
  listing: { findMany: jest.fn() },
  serviceProfile: { findMany: jest.fn() },
}));

jest.mock('../../src/services/uploadService', () => ({
  uploadImage: jest.fn(),
}));

describe('search controllers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  test('searchListings returns partial, case-insensitive matches', async () => {
    const req = { query: { q: 'bike' } };
    const res = createRes();
    const mockListings = [{ id: 'listing-1', title: 'Used Bike', sellerId: BigInt(123), seller: { name: 'Alice', username: 'alice' } }];

    prisma.listing.findMany.mockResolvedValueOnce(mockListings);

    await listingController.searchListings(req, res);

    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ACTIVE',
          OR: [
            { title: { contains: 'bike', mode: 'insensitive' } },
            { description: { contains: 'bike', mode: 'insensitive' } },
          ],
        }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      {
        ...mockListings[0],
        sellerId: '123',
      },
    ]);
  });

  test('searchServices returns partial, case-insensitive matches', async () => {
    const req = { query: { q: 'plumb' } };
    const res = createRes();
    const mockServices = [{ id: 'service-1', title: 'Plumbing Help', providerId: BigInt(456), provider: { name: 'Bob', username: 'bob' } }];

    prisma.serviceProfile.findMany.mockResolvedValueOnce(mockServices);

    await serviceController.searchServices(req, res);

    expect(prisma.serviceProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          OR: [
            { title: { contains: 'plumb', mode: 'insensitive' } },
            { description: { contains: 'plumb', mode: 'insensitive' } },
          ],
        }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      {
        ...mockServices[0],
        providerId: '456',
      },
    ]);
  });

  test('searchListings returns an empty array when no results match', async () => {
    const req = { query: { q: 'zzzz' } };
    const res = createRes();

    prisma.listing.findMany.mockResolvedValueOnce([]);

    await listingController.searchListings(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });
});
