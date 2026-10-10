const prisma = require("../lib/prisma");
const {
  createPrivateImageSignedUrl,
  removePrivateImage,
} = require("../services/uploadService");
const { recordAdminAction } = require("../services/adminAuditService");

const VERIFICATION_BUCKET = process.env.SUPABASE_VERIFICATION_BUCKET || "verification-ids";
const USER_STATUSES = new Set(["ACTIVE", "SUSPENDED", "BANNED"]);

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

const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const query = String(req.query.q ?? "").trim();
    const status = String(req.query.status ?? "ALL").toUpperCase();
    if (status !== "ALL" && !Object.hasOwn({ PENDING: true, ACTIVE: true, SUSPENDED: true, BANNED: true }, status)) {
      return res.status(400).json({ error: "Invalid user status filter" });
    }

    const where = { isModerator: false };
    if (status !== "ALL") where.status = status;
    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { username: { contains: query.replace(/^@/, ""), mode: "insensitive" } },
      ];
      if (/^\d{1,20}$/.test(query)) where.OR.push({ telegramId: BigInt(query) });
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          telegramId: true,
          name: true,
          username: true,
          department: true,
          yearOfStudy: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      data: users.map((user) => ({ ...user, telegramId: user.telegramId.toString() })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
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
    await recordAdminAction(req, {
      action: "Approved student verification",
      targetType: "USER",
      targetId: id,
      details: user?.name ?? null,
    });
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
    await recordAdminAction(req, {
      action: "Rejected student verification",
      targetType: "USER",
      targetId: id,
      details: user?.name ?? null,
    });
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

const setUserStatus = async (req, res, next, forcedStatus = null) => {
  try {
    const { id } = req.params;
    if (!/^[0-9]+$/.test(id))
      return res.status(400).json({ error: "Invalid telegram ID format" });

    const status = forcedStatus ?? String(req.body?.status ?? "").toUpperCase();
    if (!USER_STATUSES.has(status)) {
      return res.status(400).json({ error: "Status must be ACTIVE, SUSPENDED, or BANNED" });
    }
    if (String(req.user?.telegramId) === id) {
      return res.status(403).json({ error: "Moderators cannot change their own access" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { telegramId: BigInt(id) },
      select: { telegramId: true, name: true, status: true, isModerator: true },
    });
    if (!existingUser) return res.status(404).json({ error: "User not found" });
    if (existingUser.isModerator) {
      return res.status(403).json({ error: "Moderator accounts cannot be changed here" });
    }
    if (existingUser.status === status) {
      return res.status(409).json({ error: `User is already ${status.toLowerCase()}` });
    }

    const result = await prisma.user.updateMany({
      where: { telegramId: BigInt(id), isModerator: false, status: existingUser.status },
      data: { status },
    });
    if (!result.count) return res.status(409).json({ error: "User status changed; refresh and try again" });

    await recordAdminAction(req, {
      action: status === "ACTIVE" ? "Restored user access" : status === "SUSPENDED" ? "Restricted user" : "Banned user",
      targetType: "USER",
      targetId: id,
      details: existingUser.name,
    });

    return res.status(200).json({
      message: `User ${status.toLowerCase()} successfully`,
      user: {
        telegramId: id,
        name: existingUser.name,
        status,
      },
    });
  } catch (error) {
    next(error);
  }
};

const suspendUser = (req, res, next) => setUserStatus(req, res, next, "SUSPENDED");

const banUser = (req, res, next) => setUserStatus(req, res, next, "BANNED");

module.exports = {
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  suspendUser,
  banUser,
  setUserStatus,
};
