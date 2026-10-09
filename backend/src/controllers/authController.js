const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const {
  uploadPrivateImage,
  removePrivateImage,
} = require("../services/uploadService");

const VERIFICATION_BUCKET = process.env.SUPABASE_VERIFICATION_BUCKET || "verification-ids";

function getVerificationStatus(user) {
  if (user.status === "ACTIVE") return "VERIFIED";
  if (user.status === "PENDING" && user.verificationSubmittedAt) return "PENDING";
  return "UNVERIFIED";
}

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
        verificationStatus: getVerificationStatus(user),
        isModerator: user.isModerator || false,
        isOnboarded,
        fullName: user.name,
        username: user.username,
        department: user.department,
        yearOfStudy: user.yearOfStudy,
        studentIdNumber: user.studentIdNumber,
        verificationSubmittedAt: user.verificationSubmittedAt,
        bio: user.bio,
        profilePictureUrl: user.profilePictureUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/verify
 * Accepts and persists a student verification submission (multipart form).
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

    if (user.status === "PENDING" && user.verificationSubmittedAt) {
      return res.status(200).json({
        status: "PENDING",
        message: "Verification request already submitted",
      });
    }

    if (user.status === "SUSPENDED" || user.status === "BANNED") {
      return res.status(403).json({ error: "This account cannot submit a verification request" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "A student ID photo is required" });
    }

    let idPhotoPath;
    try {
      idPhotoPath = await uploadPrivateImage(
        req.file,
        VERIFICATION_BUCKET,
        String(req.user.telegramId),
      );

      const updatedUser = await prisma.user.update({
        where: { telegramId: BigInt(req.user.telegramId) },
        data: {
          name: String(fullName).trim(),
          department: String(department).trim(),
          studentIdNumber: String(studentIdNumber).trim(),
          idPhotoPath,
          verificationSubmittedAt: new Date(),
          status: "PENDING",
        },
      });

      return res.status(200).json({
        status: "PENDING",
        verificationStatus: getVerificationStatus(updatedUser),
        message: "Verification request received",
      });
    } catch (error) {
      if (idPhotoPath) {
        try {
          await removePrivateImage(idPhotoPath, VERIFICATION_BUCKET);
        } catch (cleanupError) {
          console.error("Failed to clean up an unlinked verification photo:", cleanupError);
        }
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminLogin,
  telegramAuth,
  verifyStudent,
  getVerificationStatus,
};
