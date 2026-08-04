const express = require("express");
const upload = require("../middleware/upload.js");
const { getServices, getServiceDetail, uploadServiceImage } = require("../controllers/serviceController");

const router = express.Router();

router.get("/", getServices);
router.get("/:id", getServiceDetail);
router.post("/upload-image", upload.single("image"), uploadServiceImage);

module.exports = router;
