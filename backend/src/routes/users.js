const express = require("express");
const multer = require("multer");

const {
  getMyProfile,
  updateMyProfile,
} = require("../controllers/userController");

const uploadImage = require("../services/uploadService");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.get("/me", getMyProfile);

router.patch("/me", updateMyProfile);

router.post("/upload-profile-pic", upload.single("image"), async (req, res) => {
  try {
    const url = await uploadImage(
      req.file,
      "profile-pictures"
    );

    return res.status(200).json({
      url,
    });

  } catch (error) {
    console.error(error);

    return res.status(400).json({
      message: error.message,
    });
  }
});

module.exports = router;