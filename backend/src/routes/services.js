const express = require("express");
const upload = require("../middleware/upload");
const { uploadServiceImage } = require("../controllers/serviceController");

const router = express.Router();

router.post("/upload-image", upload.single("image"), uploadServiceImage);

module.exports = router;