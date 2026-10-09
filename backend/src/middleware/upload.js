const multer = require("multer");

const storage = multer.memoryStorage();
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = upload;
module.exports.fileFilter = fileFilter;
module.exports.MAX_FILE_SIZE = MAX_FILE_SIZE;
