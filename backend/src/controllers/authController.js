const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const telegramAuth = async (req, res, next) => {
  try {
    const { id, first_name, last_name, username } = req.telegramUser;

    const telegramId = BigInt(id);

    const name = [first_name, last_name].filter(Boolean).join(" ");

    // 1. Upsert User (Yodit's logic)
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

    // 2. Determine onboarded status
    const isOnboarded = user.status === "ACTIVE";

    // 3. Issue signed JWT (expires in 7 days)
    const token = jwt.sign(
      {
        telegramId: user.telegramId.toString(),
        status: user.status,
        isModerator: user.isModerator || false,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // 4. Return shaped response
    return res.status(200).json({
      token,
      user: {
        telegramId: user.telegramId.toString(),
        status: user.status,
        isModerator: user.isModerator || false,
        isOnboarded,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  telegramAuth,
};
