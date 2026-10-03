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

    // Note: ID photo arrives as req.file (multer memory storage).
    // Not persisted yet — frontend tracks PENDING in localStorage.
    // TODO: persist VerificationRequest + Supabase upload when backend
    // moderation queue is implemented.

    return res.status(200).json({
      status: "PENDING",
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
