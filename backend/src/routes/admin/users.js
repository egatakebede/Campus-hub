const express = require("express");
const router = express.Router();
const {
  getPendingUsers,
  approveUser,
  rejectUser,
} = require("../../controllers/moderationController");

// TODO: Attach jwtVerify + requireModerator middleware here once merged
// router.use(jwtVerify, requireModerator);

router.get("/", getPendingUsers);
router.patch("/:id/approve", approveUser);
router.patch("/:id/reject", rejectUser);

module.exports = router;
