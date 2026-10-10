const express = require("express");
const jwtVerify = require("../middleware/jwtVerify");
const requireActive = require("../middleware/requireActive");
const {
  getSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
} = require("../controllers/savedSearchController");

const router = express.Router();

router.use(jwtVerify, requireActive);
router.get("/", getSavedSearches);
router.post("/", createSavedSearch);
router.delete("/:id", deleteSavedSearch);

module.exports = router;