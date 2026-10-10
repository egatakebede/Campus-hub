const express = require("express");
const jwtVerify = require("../middleware/jwtVerify");
const requireActive = require("../middleware/requireActive");
const { getRating, saveRating } = require("../controllers/ratingController");

const router = express.Router();

router.use(jwtVerify, requireActive);
router.get("/:targetType/:targetId", getRating);
router.put("/:targetType/:targetId", saveRating);

module.exports = router;