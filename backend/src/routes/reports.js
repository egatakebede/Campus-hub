const express = require("express");
const router = express.Router();
const jwtVerify = require("../middleware/jwtVerify");
const requireActive = require("../middleware/requireActive");
const { createReport } = require("../controllers/reportController");

router.post("/", jwtVerify, requireActive, createReport);

module.exports = router;
