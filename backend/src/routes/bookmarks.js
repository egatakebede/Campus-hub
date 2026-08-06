const express = require("express");
const router = express.Router();
const jwtVerify = require("../middleware/jwtVerify");
const requireActive = require("../middleware/requireActive");
const {
  toggleBookmark,
  getMyBookmarks,
  removeBookmark,
} = require("../controllers/bookmarkController");

// POST /bookmarks - Create a bookmark
router.post("/", jwtVerify, requireActive, toggleBookmark);

// GET /bookmarks - Fetch user bookmarks
router.get("/", jwtVerify, requireActive, getMyBookmarks);

// DELETE /bookmarks/:id - Delete a bookmark
router.delete("/:id", jwtVerify, requireActive, removeBookmark);

module.exports = router;
