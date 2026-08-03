const express = require("express");
const router = express.Router();
const {
  createBookmark,
  getMyBookmarks,
  deleteBookmark,
} = require("../controllers/bookmarkController");

// POST /bookmarks - Create a bookmark
router.post("/", createBookmark);

// GET /bookmarks - Fetch user bookmarks
router.get("/", getMyBookmarks);

// DELETE /bookmarks/:id - Delete a bookmark
router.delete("/:id", deleteBookmark);

module.exports = router;
