const express = require("express");
const router = express.Router();
const jwtVerify = require("../middleware/jwtVerify");
const upload = require("../middleware/upload");
const {
  getMe,
  updateMe,
  uploadProfilePhoto,
  updateSettings,
  updateHealthSettings,
  getPublicProfile,
} = require("../controllers/userController");

router.get("/me", jwtVerify, getMe);
router.patch("/me", jwtVerify, updateMe);
router.post("/me/profile-photo", jwtVerify, upload.single("photo"), uploadProfilePhoto);
router.patch("/me/settings", jwtVerify, updateSettings);
router.patch("/me/settings/health", jwtVerify, updateHealthSettings);
router.get("/:telegramId", getPublicProfile);

module.exports = router;
