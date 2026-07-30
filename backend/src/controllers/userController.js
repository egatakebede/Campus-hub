const prisma = require("../lib/prisma");
async function getMyProfile(req, res) {
  try {
    // TODO: Replace with req.user.telegramId after authentication is merged
    const telegramId = BigInt(123456789);

    const user = await prisma.user.findUnique({
      where: {
        telegramId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
async function updateMyProfile(req, res) {
  try {
    // TODO: Replace with req.user.telegramId after authentication is merged
    const telegramId = BigInt(123456789);

    const {
      name,
      phone,
      department,
      bio,
      yearOfStudy,
      profilePictureUrl,
    } = req.body;

    if (!name || !phone || !department) {
      return res.status(400).json({
        message: "Name, phone and department are required",
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        telegramId,
      },
      data: {
        name,
        phone,
        department,
        bio,
        yearOfStudy,
        profilePictureUrl,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
module.exports = {
  getMyProfile,
  updateMyProfile,
};
