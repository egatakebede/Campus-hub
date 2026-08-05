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
      body: { target_id: 'listing-1', target_type: 'listing', reason: 'spam' },
    };
    const res = createRes();

    prisma.report.create.mockResolvedValueOnce({
      id: 'report-1',
      reporterId: BigInt(123456789),
      targetId: 'listing-1',
      targetType: 'LISTING',
      reason: 'spam',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await reportController.createReport(req, res);

    expect(prisma.report.create).toHaveBeenCalledWith({
      data: {
        reporterId: BigInt(123456789),
        targetId: 'listing-1',
        targetType: 'LISTING',
        reason: 'spam',
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
