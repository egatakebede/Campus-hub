const express = require("express");
const {
  searchListings,
  searchServices,
} = require("../controllers/searchController");
const savedSearchesRouter = require("./savedSearches");

const router = express.Router();

router.use("/saved", savedSearchesRouter);
router.get("/listings", searchListings);
router.get("/services", searchServices);

module.exports = router;