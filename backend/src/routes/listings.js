const express = require("express");
const multer = require("multer");
const {
  createListing,
  uploadListingImage,
  getListings,
  searchListings,
  getListingDetail,
  updateListing,
  deleteListing,
  markAsSold,
} = require("../controllers/listingController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/search", searchListings);
router.get("/", getListings);
router.get("/:id", getListingDetail);
router.post("/", createListing);
router.post("/upload-image", upload.single("image"), uploadListingImage);
router.patch("/:id", updateListing);
router.patch("/:id/sold", markAsSold);
router.delete("/:id", deleteListing);

module.exports = router;
