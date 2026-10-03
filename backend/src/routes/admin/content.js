const express = require("express");
const router = express.Router();
const jwtVerify = require("../../middleware/jwtVerify");
const requireModerator = require("../../middleware/requireModerator");
const { deleteListingByModerator, deleteServiceByModerator } = require("../../controllers/adminContentController");

router.use(jwtVerify, requireModerator);

router.delete("/listings/:id", deleteListingByModerator);
router.delete("/services/:id", deleteServiceByModerator);

module.exports = router;
