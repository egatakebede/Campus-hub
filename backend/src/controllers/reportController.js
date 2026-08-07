const prisma = require("../lib/prisma");

const createReport = async (req, res) => {
  try {
    const { target_id, target_type, reason } = req.body;
    const telegramId = req.user?.telegramId;

    if (!telegramId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!target_id || !target_type || !reason) {
      return res.status(400).json({
        error: "target_id, target_type, and reason are required",
      });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: BigInt(telegramId),
        targetId: String(target_id),
        targetType: target_type.toUpperCase(),
        reason,
      },
    });

    return res.status(201).json({
      id: report.id,
      reporterId: report.reporterId.toString(),
      targetId: report.targetId,
      targetType: report.targetType,
      reason: report.reason,
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
    const reports = await prisma.report.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    // Safely format any BigInt fields to String for JSON serialization
    const formattedReports = reports.map((report) => ({
      ...report,
      reporterId: report.reporterId ? report.reporterId.toString() : null,
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

    const updatedReport = await prisma.report.update({
      where: { id: parseInt(id) },
      data: {
        status: status || "RESOLVED",
        ...(actionNotes && { actionNotes }),
      },
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