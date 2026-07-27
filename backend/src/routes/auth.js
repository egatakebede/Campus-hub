const express = require("express");
const router = express.Router();

// Import controller functions
const { registerUser, loginUser } = require("../controllers/authController");

// Define API Endpoints
router.post("/register", registerUser);
router.post("/login", loginUser);

// Export router to be attached in main server app
module.exports = router;
