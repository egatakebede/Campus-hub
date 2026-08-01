require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(supabaseUrl, supabaseKey);
}

async function uploadImage(file, bucketName) {
  if (!file || !file.buffer) {
    throw new Error("No file buffer provided");
  }

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error("Invalid file type");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("File too large");
  }

  const supabase = getSupabaseClient();
  const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

module.exports = { uploadImage };
