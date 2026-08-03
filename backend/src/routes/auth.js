const express = require("express");
const router = express.Router();

const validateTelegramAuth = require("../middleware/validateTelegramAuth");
const { telegramAuth } = require("../controllers/authController");

router.post("/telegram", validateTelegramAuth, telegramAuth);

module.exports = router;