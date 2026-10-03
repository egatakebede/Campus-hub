const prisma = require('../../src/lib/prisma');
const userController = require('../../src/controllers/userController');

jest.mock('../../src/lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

describe('userController settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  test('updateSettings stores the show_phone preference', async () => {
    const req = {
      user: { telegramId: '123456789' },
      body: { show_phone: false },
    };
    const res = createRes();

    prisma.user.update.mockResolvedValueOnce({
      telegramId: BigInt('123456789'),
      showPhone: false,
    });

    await userController.updateSettings(req, res);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { telegramId: BigInt('123456789') },
      data: { showPhone: false },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ showPhone: false });
  });

  test('updateHealthSettings confirms the database is connected', async () => {
    const req = {
      user: { telegramId: '123456789' },
    };
    const res = createRes();

    prisma.user.findUnique.mockResolvedValueOnce({
      telegramId: BigInt('123456789'),
      name: 'Alice',
      showPhone: true,
    });

    await userController.updateHealthSettings(req, res);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { telegramId: BigInt('123456789') },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      db: 'connected',
      user: {
        telegramId: '123456789',
        name: 'Alice',
        showPhone: true,
      },
    });
  });
});
