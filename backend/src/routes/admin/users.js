const express = require("express");
const router = express.Router();
const jwtVerify = require("../../middleware/jwtVerify");
const requireModerator = require("../../middleware/requireModerator");
const {
  getPendingUsers,
  approveUser,
  rejectUser,
  suspendUser,
  banUser,
} = require("../../controllers/moderationController");

router.use(jwtVerify, requireModerator);

router.get("/", getPendingUsers);
router.patch("/:id/approve", approveUser);
router.patch("/:id/reject", rejectUser);
router.patch("/:id/suspend", suspendUser);
router.patch("/:id/ban", banUser);

module.exports = router;
