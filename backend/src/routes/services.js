const express = require("express");
const upload = require("../middleware/upload.js");
const jwtVerify = require("../middleware/jwtVerify");
const requireActive = require("../middleware/requireActive");
const {
  getServices,
  searchServices,
  getServiceDetail,
  uploadServiceImage,
  createService,
  updateService,
  deleteService,
} = require("../controllers/serviceController");

const router = express.Router();

router.get("/", getServices);
router.get("/search", searchServices);
router.get("/:id", getServiceDetail);
router.post("/", jwtVerify, requireActive, createService);
router.post("/upload-image", jwtVerify, requireActive, uploadServiceImage);
router.patch("/:id", jwtVerify, requireActive, updateService);
router.delete("/:id", jwtVerify, deleteService);

module.exports = router;
