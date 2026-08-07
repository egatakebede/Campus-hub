const express = require("express");
const {
  searchListings,
  searchServices,
} = require("../controllers/searchController");

const router = express.Router();

router.get("/listings", searchListings);
router.get("/services", searchServices);

module.exports = router;