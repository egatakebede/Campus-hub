const prisma = require("../../src/lib/prisma");
const { getRecentActions } = require("../../src/controllers/adminActivityController");

jest.mock("../../src/lib/prisma", () => ({
  adminAuditLog: { findMany: jest.fn() },
}));

describe("admin activity controller", () => {
  it("returns recent actions with moderator names", async () => {
    const createdAt = new Date("2026-10-10T10:00:00.000Z");
    prisma.adminAuditLog.findMany.mockResolvedValue([{
      id: "activity-1",
      action: "Banned user",
      targetType: "USER",
      targetId: "123456789",
      details: "Student",
      createdAt,
      actor: { name: "Moderator" },
    }]);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getRecentActions({}, res, jest.fn());

    expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { name: true } } },
    });
    expect(res.json).toHaveBeenCalledWith([expect.objectContaining({
      action: "Banned user",
      actorName: "Moderator",
      targetId: "123456789",
    })]);
  });
});