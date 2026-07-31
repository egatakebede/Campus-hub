const express = require("express");
const router = express.Router();
const { getPublicProfile } = require("../controllers/userController");

// This creates GET /users/:telegramId
router.get("/:telegramId", getPublicProfile);

module.exports = router;
