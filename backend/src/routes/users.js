const express = require("express");
const router = express.Router();
const jwtVerify = require("../middleware/jwtVerify");
const {
  getMe,
  updateMe,
  updateSettings,
  updateHealthSettings,
  getPublicProfile,
} = require("../controllers/userController");

router.get("/me", jwtVerify, getMe);
router.patch("/me", jwtVerify, updateMe);
router.patch("/me/settings", jwtVerify, updateSettings);
router.patch("/me/settings/health", jwtVerify, updateHealthSettings);
router.get("/:telegramId", getPublicProfile);

module.exports = router;
