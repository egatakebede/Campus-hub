const express = require("express");
const router = express.Router();
const {
  toggleBookmark,
  getMyBookmarks,
  removeBookmark,
} = require("../controllers/bookmarkController");

// POST /bookmarks - Create a bookmark
router.post("/", toggleBookmark);

// GET /bookmarks - Fetch user bookmarks
router.get("/", getMyBookmarks);

// DELETE /bookmarks/:id - Delete a bookmark
router.delete("/:id", removeBookmark);

module.exports = router;
