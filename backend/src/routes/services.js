const express = require("express");
const upload = require("../middleware/upload.js");
const { getServices, getServiceDetail, searchServices, uploadServiceImage } = require("../controllers/serviceController");

const router = express.Router();

router.get("/search", searchServices);
router.get("/", getServices);
router.get("/:id", getServiceDetail);
router.post("/upload-image", upload.single("image"), uploadServiceImage);

module.exports = router;
