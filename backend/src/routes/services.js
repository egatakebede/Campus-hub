const express = require("express");
const upload = require("../middleware/upload.js");
const jwtVerify = require("../middleware/jwtVerify");
const requireActive = require("../middleware/requireActive");
const { getServices, searchServices, getServiceDetail, uploadServiceImage } = require("../controllers/serviceController");

const router = express.Router();

router.get("/", getServices);
router.get("/search", searchServices);
router.get("/:id", getServiceDetail);
router.post("/upload-image", jwtVerify, requireActive, uploadServiceImage);

module.exports = router;
