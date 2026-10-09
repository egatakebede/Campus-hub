const express = require("express");
const router = express.Router();
const jwtVerify = require("../../middleware/jwtVerify");
const requireModerator = require("../../middleware/requireModerator");
const { deleteListingByModerator, deleteServiceByModerator } = require("../../controllers/adminContentController");
const {
  getPendingListings,
  approveListing,
  rejectListing,
} = require("../../controllers/listingModerationController");

router.use(jwtVerify, requireModerator);

router.get("/listings", getPendingListings);
router.patch("/listings/:id/approve", approveListing);
router.patch("/listings/:id/reject", rejectListing);
router.delete("/listings/:id", deleteListingByModerator);
router.delete("/services/:id", deleteServiceByModerator);

module.exports = router;
