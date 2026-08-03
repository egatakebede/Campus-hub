const multer = require("multer");

const storage = multer.memoryStorage();

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];

function fileFilter(req, file, cb) {
  if (!file || !allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only image files are allowed"), false);
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;
module.exports.fileFilter = fileFilter;
