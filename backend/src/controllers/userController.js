const prisma = require("../lib/prisma");
const { uploadImage } = require("../services/uploadService");

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(req.user.telegramId) },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({ ...user, telegramId: user.telegramId.toString() });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateMe = async (req, res, next) => {
  try {
    const {
      name,
      username,
      studentIdNumber,
      phone,
      department,
      yearOfStudy,
      bio,
      profilePictureUrl,
    } = req.body;

    const telegramId = BigInt(req.user.telegramId);
    const currentUser = await prisma.user.findUnique({
      where: { telegramId },
      select: { status: true, verificationSubmittedAt: true },
    });
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    const identityLocked = currentUser.status === "ACTIVE" ||
      (currentUser.status === "PENDING" && currentUser.verificationSubmittedAt);
    if (identityLocked && [name, studentIdNumber, department, yearOfStudy].some((field) => field !== undefined)) {
      return res.status(403).json({ error: "Verified identity fields cannot be changed" });
    }

    // Required fields cannot be nulled
    if (name !== undefined && !String(name).trim())
      return res.status(400).json({ error: "name cannot be empty" });
    if (phone !== undefined && !String(phone).trim())
      return res.status(400).json({ error: "phone cannot be empty" });
    if (department !== undefined && !String(department).trim())
      return res.status(400).json({ error: "department cannot be empty" });
    if (studentIdNumber !== undefined && !/^\d{1,6}\/\d{2}$/.test(String(studentIdNumber).trim()))
      return res.status(400).json({ error: "Invalid student ID format" });

    let parsedYear;
    if (yearOfStudy !== undefined) {
      parsedYear = Number(yearOfStudy);
      if (!Number.isInteger(parsedYear) || parsedYear < 0) {
        return res.status(400).json({ error: "yearOfStudy must be a non-negative integer" });
      }
    }

    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (username !== undefined) data.username = String(username).trim() || null;
    if (studentIdNumber !== undefined) data.studentIdNumber = String(studentIdNumber).trim();
    if (phone !== undefined) data.phone = String(phone).trim();
    if (department !== undefined) data.department = String(department).trim();
    if (parsedYear !== undefined) data.yearOfStudy = parsedYear;
    if (bio !== undefined) data.bio = bio;
    if (profilePictureUrl !== undefined) data.profilePictureUrl = profilePictureUrl;

    const user = await prisma.user.update({
      where: { telegramId },
      data,
    });
    return res.status(200).json({ ...user, telegramId: user.telegramId.toString() });
  } catch (error) {
    if (error.code === "P2002" && error.meta?.target?.includes("username")) {
      return res.status(409).json({ error: "Telegram username is already in use" });
    }
    return next(error);
  }
};

const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "A profile photo is required" });

    const profilePictureUrl = await uploadImage(req.file, "listing-images");
    return res.status(200).json({ profilePictureUrl });
  } catch (error) {
    return next(error);
  }
};

const updateSettings = async (req, res) => {
  try {
    const { show_phone } = req.body;
    if (typeof show_phone !== "boolean")
      return res.status(400).json({ error: "show_phone must be a boolean" });

    const user = await prisma.user.update({
      where: { telegramId: BigInt(req.user.telegramId) },
      data: { showPhone: show_phone },
    });
    return res.status(200).json({ showPhone: user.showPhone });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateHealthSettings = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(req.user.telegramId) },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      db: "connected",
      user: {
        telegramId: user.telegramId.toString(),
        name: user.name,
        showPhone: user.showPhone,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getPublicProfile = async (req, res) => {
  try {
    const { telegramId } = req.params;

    // Validate if telegramId is a valid numeric string before converting to BigInt
    if (!/^\d+$/.test(telegramId)) {
      return res.status(400).json({ message: "Invalid telegram ID format" });
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const publicProfile = {
      name: user.name,
      username: user.username,
      bio: user.bio,
      profilePictureUrl: user.profilePictureUrl,
      department: user.department,
      yearOfStudy: user.yearOfStudy,
    };

    return res.status(200).json(publicProfile);
  } catch (error) {
    console.error("Error fetching public profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getMe,
  updateMe,
  uploadProfilePhoto,
  updateSettings,
  updateHealthSettings,
  getPublicProfile,
};
