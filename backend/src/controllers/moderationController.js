const prisma = require("../lib/prisma");

const getPendingUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { status: "PENDING" },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: { status: "PENDING" } }),
    ]);

    const formattedUsers = users.map((u) => ({
      ...u,
      telegramId: u.telegramId.toString(),
    }));

    return res.status(200).json({
      data: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const approveUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^[0-9]+$/.test(id)) {
      return res.status(400).json({ error: "Invalid telegram ID format" });
    }

    const user = await prisma.user.update({
      where: { telegramId: BigInt(id) },
      data: { status: "ACTIVE" },
    });

    return res.status(200).json({
      message: "User approved successfully",
      user: {
        ...user,
        telegramId: user.telegramId.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const rejectUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^[0-9]+$/.test(id)) {
      return res.status(400).json({ error: "Invalid telegram ID format" });
    }

    const user = await prisma.user.update({
      where: { telegramId: BigInt(id) },
      data: { status: "BANNED" },
    });

    return res.status(200).json({
      message: "User rejected successfully",
      user: {
        ...user,
        telegramId: user.telegramId.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingUsers,
  approveUser,
  rejectUser,
};
