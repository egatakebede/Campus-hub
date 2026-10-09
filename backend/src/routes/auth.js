const express = require("express");
const router = express.Router();

const validateTelegramAuth = require("../middleware/validateTelegramAuth");
const jwtVerify = require("../middleware/jwtVerify");
const upload = require("../middleware/upload");
const { adminLogin, telegramAuth, verifyStudent } = require("../controllers/authController");

function uploadVerificationPhoto(req, res, next) {
  upload.single("idPhoto")(req, res, (error) => {
    if (!error) return next();

    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Student ID photo must be 5 MB or smaller"
      : error.message;
    return res.status(status).json({ error: message });
  });
}

router.post("/admin/login", adminLogin);
router.post("/telegram", validateTelegramAuth, telegramAuth);
router.post("/verify", jwtVerify, uploadVerificationPhoto, verifyStudent);

module.exports = router;
