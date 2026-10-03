const express = require("express");
const router = express.Router();
const jwtVerify = require("../middleware/jwtVerify");
const { getMe, updateMe, getPublicProfile } = require("../controllers/userController");

router.get("/me", jwtVerify, getMe);
router.patch("/me", jwtVerify, updateMe);
router.get("/:telegramId", getPublicProfile);

module.exports = router;
