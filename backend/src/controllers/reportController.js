const prisma = require("../lib/prisma");
const { recordAdminAction } = require("../services/adminAuditService");

const REPORT_REASONS = new Set(["SCAM", "MISLEADING", "PROHIBITED", "HARASSMENT", "OTHER"]);
const REPORT_STATUSES = new Set(["PENDING", "REVIEWED", "RESOLVED", "ALL"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createReport = async (req, res) => {
  try {
    const { target_id, target_type, reason } = req.body;
    const details = String(req.body?.details ?? "").trim();
    const telegramId = req.user?.telegramId;

    if (!telegramId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const normalizedTargetType = String(target_type ?? "").toUpperCase();
    const normalizedReason = String(reason ?? "").toUpperCase();
    if (!UUID_PATTERN.test(String(target_id ?? ""))) {
      return res.status(400).json({
        error: "A valid target ID is required",
      });
    }
    if (!["LISTING", "SERVICE"].includes(normalizedTargetType)) {
      return res.status(400).json({ error: "Invalid report target type" });
    }
    if (!REPORT_REASONS.has(normalizedReason)) {
      return res.status(400).json({ error: "Choose a valid report reason" });
    }
    if (details.length > 500) {
      return res.status(400).json({ error: "Report details must be 500 characters or fewer" });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: BigInt(telegramId),
        targetId: String(target_id),
        targetType: normalizedTargetType,
        reason: normalizedReason,
        details: details || null,
      },
    });

    return res.status(201).json({
      id: report.id,
      reporterId: report.reporterId.toString(),
      targetId: report.targetId,
      targetType: report.targetType,
      reason: report.reason,
      details: report.details,
      status: report.status,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Already reported" });
    }

    console.error("--- ERROR CREATING REPORT ---");
    console.error(error);
    console.error("-----------------------------");

    return res.status(500).json({ error: "Failed to create report" });
  }
};

const getAllReports = async (req, res) => {
  try {
    const status = String(req.query.status ?? "PENDING").toUpperCase();
    if (!REPORT_STATUSES.has(status)) {
      return res.status(400).json({ error: "Invalid report status filter" });
    }
    const reports = await prisma.report.findMany({
      where: status === "ALL" ? {} : { status },
      orderBy: { createdAt: "desc" },
      include: { reporter: { select: { name: true, username: true } } },
    });

    // Safely format any BigInt fields to String for JSON serialization
    const formattedReports = reports.map((report) => ({
      ...report,
      reporterId: report.reporterId ? report.reporterId.toString() : null,
      reporterName: report.reporter?.name ?? "Unknown student",
      reporterUsername: report.reporter?.username ?? null,
    }));

    return res.status(200).json(formattedReports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return res.status(500).json({ error: "Error fetching reports" });
  }
};

const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actionNotes } = req.body;
    if (!UUID_PATTERN.test(id)) {
      return res.status(400).json({ error: "Invalid report ID" });
    }
    const nextStatus = String(status ?? "RESOLVED").toUpperCase();
    if (!["REVIEWED", "RESOLVED"].includes(nextStatus)) {
      return res.status(400).json({ error: "Status must be REVIEWED or RESOLVED" });
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: nextStatus,
        ...(actionNotes !== undefined && { resolutionNotes: String(actionNotes).trim().slice(0, 500) || null }),
      },
    });

    await recordAdminAction(req, {
      action: nextStatus === "RESOLVED" ? "Resolved scam report" : "Reviewed scam report",
      targetType: "REPORT",
      targetId: id,
      details: updatedReport.reason,
    });

    return res.status(200).json({
      ...updatedReport,
      reporterId: updatedReport.reporterId
        ? updatedReport.reporterId.toString()
        : null,
    });
  } catch (error) {
    console.error("Error resolving report:", error);
    return res.status(500).json({ error: "Error resolving report" });
  }
};

module.exports = {
  createReport,
  getAllReports,
  resolveReport,
};