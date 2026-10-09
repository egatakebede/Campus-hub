const express = require("express");
const multer = require("multer");
const {
  createListing,
  uploadListingImage,
  getListings,
  getMyListings,
  searchListings,
  getListingDetail,
  updateListing,
  deleteListing,
  markAsSold,
} = require("../controllers/listingController");

const jwtVerify = require("../middleware/jwtVerify");
const requireActive = require("../middleware/requireActive");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/search", searchListings);
router.get("/mine", jwtVerify, requireActive, getMyListings);
router.get("/", getListings);
router.get("/:id", getListingDetail);
router.post("/", jwtVerify, requireActive, createListing);
router.post("/upload-image", jwtVerify, requireActive, upload.single("image"), uploadListingImage);
router.patch("/:id", jwtVerify, requireActive, updateListing);
router.patch("/:id/sold", jwtVerify, requireActive, markAsSold);
router.delete("/:id", jwtVerify, requireActive, deleteListing);

module.exports = router;
