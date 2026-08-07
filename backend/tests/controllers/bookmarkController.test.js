const prisma = require('../../src/lib/prisma');
const bookmarkController = require('../../src/controllers/bookmarkController');

jest.mock('../../src/lib/prisma', () => ({
  bookmark: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('bookmark controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  test('toggleBookmark creates a bookmark and returns 201', async () => {
    const req = {
      user: { telegramId: '999999999' },
      body: { target_id: 'listing-1', target_type: 'listing' },
    };
    const res = createRes();

    prisma.bookmark.create.mockResolvedValueOnce({
      id: 'bookmark-1',
      userId: BigInt(123456789),
      targetId: 'listing-1',
      targetType: 'LISTING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await bookmarkController.toggleBookmark(req, res);

    expect(prisma.bookmark.create).toHaveBeenCalledWith({
      data: {
        userId: BigInt(999999999),
        targetId: 'listing-1',
        targetType: 'LISTING',
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'bookmark-1',
        userId: '123456789',
        targetId: 'listing-1',
        targetType: 'LISTING',
      })
    );
  });

  test('toggleBookmark returns 409 for duplicate bookmarks', async () => {
    const req = {
      user: { telegramId: '999999999' },
      body: { target_id: 'listing-1', target_type: 'listing' },
    };
    const res = createRes();

    const duplicateError = new Error('duplicate');
    duplicateError.code = 'P2002';
    prisma.bookmark.create.mockRejectedValueOnce(duplicateError);

    await bookmarkController.toggleBookmark(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Already bookmarked' });
  });

  test('getMyBookmarks returns bookmarks for the current user', async () => {
    const req = { user: { telegramId: '999999999' } };
    const res = createRes();

    prisma.bookmark.findMany.mockResolvedValueOnce([
      { id: 'bookmark-1', userId: BigInt(123456789), targetId: 'listing-1', targetType: 'LISTING' },
    ]);

    await bookmarkController.getMyBookmarks(req, res);

    expect(prisma.bookmark.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: BigInt(999999999) },
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ userId: '123456789', targetId: 'listing-1' }),
    ]);
  });

  test('removeBookmark deletes owned bookmarks', async () => {
    const req = { user: { telegramId: '999999999' }, params: { id: 'bookmark-1' } };
    const res = createRes();

    prisma.bookmark.findUnique.mockResolvedValueOnce({
      id: 'bookmark-1',
      userId: BigInt(999999999),
    });

    await bookmarkController.removeBookmark(req, res);

    expect(prisma.bookmark.delete).toHaveBeenCalledWith({ where: { id: 'bookmark-1' } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Bookmark deleted successfully' });
  });
});
