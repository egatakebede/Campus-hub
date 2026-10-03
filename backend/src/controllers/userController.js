const prisma = require("../lib/prisma");

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

const updateMe = async (req, res) => {
  try {
    const { name, phone, department, yearOfStudy, bio, profilePictureUrl } = req.body;

    // Required fields cannot be nulled
    if (name !== undefined && !String(name).trim())
      return res.status(400).json({ error: "name cannot be empty" });
    if (phone !== undefined && !String(phone).trim())
      return res.status(400).json({ error: "phone cannot be empty" });
    if (department !== undefined && !String(department).trim())
      return res.status(400).json({ error: "department cannot be empty" });

    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (phone !== undefined) data.phone = String(phone).trim();
    if (department !== undefined) data.department = String(department).trim();
    if (yearOfStudy !== undefined) data.yearOfStudy = parseInt(yearOfStudy);
    if (bio !== undefined) data.bio = bio;
    if (profilePictureUrl !== undefined) data.profilePictureUrl = profilePictureUrl;

    const user = await prisma.user.update({
      where: { telegramId: BigInt(req.user.telegramId) },
      data,
    });
    return res.status(200).json({ ...user, telegramId: user.telegramId.toString() });
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
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      bio: user.bio,
      profile_pic_url: user.profile_pic_url,
      department: user.department,
      year_of_study: user.year_of_study,
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
  getPublicProfile,
};
