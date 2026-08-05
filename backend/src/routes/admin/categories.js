const express = require("express");
const router = express.Router();
const jwtVerify = require("../../middleware/jwtVerify");
const requireModerator = require("../../middleware/requireModerator");
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../../controllers/categoryController");

// Protect all category admin endpoints
router.use(jwtVerify, requireModerator);

router.get("/", getAllCategories);
router.post("/", createCategory);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
