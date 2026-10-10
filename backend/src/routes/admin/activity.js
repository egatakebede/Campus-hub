const express = require("express");
const jwtVerify = require("../../middleware/jwtVerify");
const requireModerator = require("../../middleware/requireModerator");
const { getRecentActions } = require("../../controllers/adminActivityController");

const router = express.Router();

router.use(jwtVerify, requireModerator);
router.get("/", getRecentActions);

module.exports = router;