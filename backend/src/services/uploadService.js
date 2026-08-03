require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

async function uploadImage(file, bucketName) {
<<<<<<< HEAD
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error("Invalid file type");
  }
=======
  if (!file) {
    throw new Error("No file provided");
  }

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error("Invalid file type");
  }

>>>>>>> b2e2e5740def294a8c12f9c2f38f1f2ef27ecc6b
  if (file.size > MAX_SIZE) {
    throw new Error("File too large");
  }

  const fileName = `${Date.now()}-${file.originalname}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

<<<<<<< HEAD
module.exports = { uploadImage };
=======
module.exports = { uploadImage };
>>>>>>> b2e2e5740def294a8c12f9c2f38f1f2ef27ecc6b
