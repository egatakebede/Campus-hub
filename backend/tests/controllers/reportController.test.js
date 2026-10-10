const prisma = require('../../src/lib/prisma');
const reportController = require('../../src/controllers/reportController');

jest.mock('../../src/lib/prisma', () => ({
  report: {
    create: jest.fn(),
  },
}));

describe('report controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  test('createReport uses the authenticated Telegram ID', async () => {
    const req = {
      user: { telegramId: '123456789' },
      body: {
        target_id: '0ef93c50-f9a0-4dab-9c68-fdf09c922118',
        target_type: 'listing',
        reason: 'scam',
        details: 'Requests payment before allowing inspection',
      },
    };
    const res = createRes();

    prisma.report.create.mockResolvedValueOnce({
      id: '88de8d7b-d1aa-48fa-88f8-3481f73897d4',
      reporterId: BigInt(123456789),
      targetId: '0ef93c50-f9a0-4dab-9c68-fdf09c922118',
      targetType: 'LISTING',
      reason: 'SCAM',
      details: 'Requests payment before allowing inspection',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await reportController.createReport(req, res);

    expect(prisma.report.create).toHaveBeenCalledWith({
      data: {
        reporterId: BigInt(123456789),
        targetId: '0ef93c50-f9a0-4dab-9c68-fdf09c922118',
        targetType: 'LISTING',
        reason: 'SCAM',
        details: 'Requests payment before allowing inspection',
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('rejects report reasons outside the supported categories', async () => {
    const req = {
      user: { telegramId: '123456789' },
      body: {
        target_id: '0ef93c50-f9a0-4dab-9c68-fdf09c922118',
        target_type: 'listing',
        reason: 'made-up-reason',
      },
    };
    const res = createRes();

    await reportController.createReport(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.report.create).not.toHaveBeenCalled();
  });
});
