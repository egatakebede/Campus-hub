const express = require("express");
const router = express.Router();
const jwtVerify = require("../../middleware/jwtVerify");
const requireModerator = require("../../middleware/requireModerator");
const {
  getAllReports,
  resolveReport,
} = require("../../controllers/reportController");

// Guard all admin report routes
router.use(jwtVerify, requireModerator);

router.get("/", getAllReports);
router.patch("/:id/resolve", resolveReport);

module.exports = router;
