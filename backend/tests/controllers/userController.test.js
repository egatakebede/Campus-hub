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

  test('updateMe rejects identity changes for verified users', async () => {
    const req = {
      user: { telegramId: '123456789' },
      body: { name: 'Different Name' },
    };
    const res = createRes();
    const next = jest.fn();
    prisma.user.findUnique.mockResolvedValueOnce({
      status: 'ACTIVE',
      verificationSubmittedAt: new Date(),
    });

    await userController.updateMe(req, res, next);

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Verified identity fields cannot be changed',
    });
  });

  test('updateMe persists editable profile fields using backend column names', async () => {
    const req = {
      user: { telegramId: '123456789' },
      body: {
        name: 'Student Name',
        username: 'student_name',
        studentIdNumber: '1938/27',
        department: 'Computer Science',
        yearOfStudy: '3',
        bio: 'Hello campus',
      },
    };
    const res = createRes();
    const next = jest.fn();
    prisma.user.findUnique.mockResolvedValueOnce({
      status: 'PENDING',
      verificationSubmittedAt: null,
    });
    prisma.user.update.mockResolvedValueOnce({
      telegramId: BigInt('123456789'),
      name: 'Student Name',
      username: 'student_name',
      studentIdNumber: '1938/27',
      department: 'Computer Science',
      yearOfStudy: 3,
      bio: 'Hello campus',
    });

    await userController.updateMe(req, res, next);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { telegramId: BigInt('123456789') },
      data: {
        name: 'Student Name',
        username: 'student_name',
        studentIdNumber: '1938/27',
        department: 'Computer Science',
        yearOfStudy: 3,
        bio: 'Hello campus',
      },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });
});
