const express = require("express");
const router = express.Router();

const validateTelegramAuth = require("../middleware/validateTelegramAuth");
const upload = require("../middleware/upload");
const { adminLogin, telegramAuth, verifyStudent } = require("../controllers/authController");

router.post("/admin/login", adminLogin);
router.post("/telegram", validateTelegramAuth, telegramAuth);
router.post("/verify", upload.single("idPhoto"), verifyStudent);

module.exports = router;
