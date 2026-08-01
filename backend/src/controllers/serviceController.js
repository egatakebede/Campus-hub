const { uploadImage } = require("../services/uploadService");

async function uploadServiceImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const url = await uploadImage(req.file, "service-images");
    return res.status(200).json({ url });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
}

module.exports = { uploadServiceImage };