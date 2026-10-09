const express = require("express");
const router = express.Router();

const validateTelegramAuth = require("../middleware/validateTelegramAuth");
const jwtVerify = require("../middleware/jwtVerify");
const upload = require("../middleware/upload");
const { adminLogin, telegramAuth, verifyStudent } = require("../controllers/authController");

router.post("/admin/login", adminLogin);
router.post("/telegram", validateTelegramAuth, telegramAuth);
router.post("/verify", jwtVerify, upload.single("idPhoto"), verifyStudent);

module.exports = router;
