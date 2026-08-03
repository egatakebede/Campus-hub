const prisma = require("../lib/prisma");

const telegramAuth = async (req, res, next) => {
  try {
    const {
      id,
      first_name,
      last_name,
      username,
    } = req.telegramUser;

    const telegramId = BigInt(id);

    const name = [first_name, last_name]
      .filter(Boolean)
      .join(" ");

    const user = await prisma.user.upsert({
      where: {
        telegramId,
      },
      update: {},
      create: {
        telegramId,
        name,
        username,
        department: "",
        yearOfStudy: 0,
        status: "PENDING",
      },
    });

    const isOnboarded =
      Boolean(user.name) &&
      Boolean(user.department);

    req.user = user;
    req.isOnboarded = isOnboarded;

    return next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  telegramAuth,
};