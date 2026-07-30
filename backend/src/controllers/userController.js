const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
  getPublicProfile,
};
