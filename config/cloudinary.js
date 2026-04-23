const cloudinary = require("cloudinary").v2;
const multer     = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage — buffer is uploaded directly to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(new Error("Only image files are allowed"), false),
});

/**
 * Upload a buffer to Cloudinary.
 * Returns { url, public_id } or throws.
 */
async function uploadToCloudinary(buffer, folder = "studxchange") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, transformation: [{ width: 900, height: 700, crop: "limit", quality: "auto" }] },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by public_id.
 * Silent — never throws.
 */
async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  try { await cloudinary.uploader.destroy(publicId); } catch {}
}

module.exports = { cloudinary, upload, uploadToCloudinary, deleteFromCloudinary };
