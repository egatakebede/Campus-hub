const express = require("express");
const multer = require("multer");
const { createListing, uploadListingImage } = require("../controllers/listingController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", createListing);
router.post("/upload-image", upload.single("image"), uploadListingImage);

module.exports = router;
