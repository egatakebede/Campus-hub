const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const adminLogin = async (req, res, next) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });

    if (!user || !user.isModerator) {
      return res.status(403).json({ error: 'Not a moderator' });
    }

    const token = jwt.sign(
      { telegramId: user.telegramId.toString(), status: user.status, isModerator: true },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    return res.status(200).json({
      token,
      user: {
        telegramId: user.telegramId.toString(),
        name: user.name,
        username: user.username,
        isModerator: true,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

const telegramAuth = async (req, res, next) => {
  try {
    const { id, first_name, last_name, username } = req.telegramUser;

    const telegramId = BigInt(id);
    const name = [first_name, last_name].filter(Boolean).join(" ");

    const user = await prisma.user.upsert({
      where: { telegramId },
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

    const isOnboarded = user.status === "ACTIVE";

    const token = jwt.sign(
      {
        telegramId: user.telegramId.toString(),
        status: user.status,
        isModerator: user.isModerator || false,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

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

/**
 * POST /auth/verify
 * Accepts student verification submission (multipart form).
 * Frontend handles the PENDING state locally; this endpoint just
 * acknowledges receipt so the UI doesn't show a failure.
 */
const verifyStudent = async (req, res, next) => {
  try {
    if (!req.user?.telegramId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fullName, studentIdNumber, department } = req.body;

    if (!fullName || !studentIdNumber || !department) {
      return res.status(400).json({
        error: "fullName, studentIdNumber, and department are required",
      });
    }

    if (!/^\d{1,6}\/\d{2}$/.test(String(studentIdNumber).trim())) {
      return res.status(400).json({
        error: "Invalid student ID format (expected e.g. 1938/27)",
      });
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(req.user.telegramId) },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.status === "ACTIVE") {
      return res.status(409).json({ error: "User is already verified" });
    }

    if (user.status === "PENDING") {
      return res.status(200).json({
        status: "PENDING",
        message: "Verification request already submitted",
      });
    }

    if (user.status === "SUSPENDED" || user.status === "BANNED") {
      return res.status(403).json({ error: "This account cannot submit a verification request" });
    }

    const updatedUser = await prisma.user.update({
      where: { telegramId: BigInt(req.user.telegramId) },
      data: { status: "PENDING" },
    });

    return res.status(200).json({
      status: updatedUser.status,
      message: "Verification request received",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminLogin,
  telegramAuth,
  verifyStudent,
};
