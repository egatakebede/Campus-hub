require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("node:crypto");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const FILE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(supabaseUrl, supabaseKey);
}

async function ensurePrivateBucket(supabase, bucketName) {
  const { data: bucket, error } = await supabase.storage.getBucket(bucketName);
  if (error) {
    throw new Error(`Verification storage bucket "${bucketName}" is unavailable: ${error.message}`);
  }
  if (bucket.public) {
    throw new Error(`Verification storage bucket "${bucketName}" must be private`);
  }
}

async function uploadImage(file, bucketName) {
  if (!file || !file.buffer) {
    throw new Error("No file provided");
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

async function uploadPrivateImage(file, bucketName, ownerId) {
  if (!file || !file.buffer) {
    throw new Error("No file provided");
  }

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error("Invalid file type");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("File too large");
  }

  const supabase = getSupabaseClient();
  await ensurePrivateBucket(supabase, bucketName);
  const filePath = `${ownerId}/${randomUUID()}.${FILE_EXTENSIONS[file.mimetype]}`;
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Private image upload failed: ${error.message}`);
  }

  return filePath;
}

async function createPrivateImageSignedUrl(filePath, bucketName) {
  const supabase = getSupabaseClient();
  await ensurePrivateBucket(supabase, bucketName);
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, 60 * 60);

  if (error) {
    throw new Error(`Private image link creation failed: ${error.message}`);
  }

  return data.signedUrl;
}

async function removePrivateImage(filePath, bucketName) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.from(bucketName).remove([filePath]);

  if (error) {
    throw new Error(`Private image removal failed: ${error.message}`);
  }
}

module.exports = {
  uploadImage,
  uploadPrivateImage,
  createPrivateImageSignedUrl,
  removePrivateImage,
};