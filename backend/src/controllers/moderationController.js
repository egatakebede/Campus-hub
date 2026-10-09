const prisma = require("../lib/prisma");
const {
  createPrivateImageSignedUrl,
  removePrivateImage,
} = require("../services/uploadService");

const VERIFICATION_BUCKET = process.env.SUPABASE_VERIFICATION_BUCKET || "verification-ids";

const getPendingUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          status: "PENDING",
          verificationSubmittedAt: { not: null },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          telegramId: true,
          name: true,
          studentIdNumber: true,
          department: true,
          yearOfStudy: true,
          idPhotoPath: true,
          verificationSubmittedAt: true,
          createdAt: true,
        },
      }),
      prisma.user.count({
        where: {
          status: "PENDING",
          verificationSubmittedAt: { not: null },
        },
      }),
    ]);

    const formattedUsers = await Promise.all(users.map(async (u) => {
      const { idPhotoPath, ...user } = u;
      return {
        ...user,
        telegramId: u.telegramId.toString(),
        idPhoto: idPhotoPath
          ? await createPrivateImageSignedUrl(idPhotoPath, VERIFICATION_BUCKET)
          : null,
      };
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

    const result = await prisma.user.updateMany({
      where: {
        telegramId: BigInt(id),
        status: "PENDING",
        verificationSubmittedAt: { not: null },
      },
      data: { status: "ACTIVE" },
    });

    if (!result.count) {
      return res.status(409).json({ error: "No pending verification request found" });
    }

    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(id) } });
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

    const existingUser = await prisma.user.findUnique({
      where: { telegramId: BigInt(id) },
      select: {
        telegramId: true,
        status: true,
        verificationSubmittedAt: true,
        idPhotoPath: true,
      },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (existingUser.status !== "PENDING" || !existingUser.verificationSubmittedAt) {
      return res.status(409).json({ error: "No pending verification request found" });
    }

    const result = await prisma.user.updateMany({
      where: {
        telegramId: BigInt(id),
        status: "PENDING",
        verificationSubmittedAt: { not: null },
      },
      data: {
        verificationSubmittedAt: null,
        studentIdNumber: null,
        idPhotoPath: null,
      },
    });

    if (!result.count) {
      return res.status(409).json({ error: "No pending verification request found" });
    }

    if (existingUser.idPhotoPath) {
      try {
        await removePrivateImage(existingUser.idPhotoPath, VERIFICATION_BUCKET);
      } catch (error) {
        console.error("Failed to remove rejected verification photo:", error);
      }
    }

    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(id) } });
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

const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^[0-9]+$/.test(id))
      return res.status(400).json({ error: "Invalid telegram ID format" });

    const user = await prisma.user.update({
      where: { telegramId: BigInt(id) },
      data: { status: "SUSPENDED" },
    });
    return res.status(200).json({
      message: "User suspended successfully",
      user: { ...user, telegramId: user.telegramId.toString() },
    });
  } catch (error) {
    next(error);
  }
};

const banUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^[0-9]+$/.test(id))
      return res.status(400).json({ error: "Invalid telegram ID format" });

    const user = await prisma.user.update({
      where: { telegramId: BigInt(id) },
      data: { status: "BANNED" },
    });
    return res.status(200).json({
      message: "User banned successfully",
      user: { ...user, telegramId: user.telegramId.toString() },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingUsers,
  approveUser,
  rejectUser,
  suspendUser,
  banUser,
};
