/* =====================================================
   Cloudinary — Upload from external URL
   --------------------------------------------------------
   Downloads an image from a URL and uploads it to
   Cloudinary, returning the secure URL.
   ===================================================== */

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUrlUploadResult {
  url: string;
  publicId: string;
}

/**
 * Upload an image from an external URL to Cloudinary.
 * Cloudinary handles the download internally.
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  username: string
): Promise<CloudinaryUrlUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: "fakeid_profiles",
      public_id: `${username}_${Date.now()}`,
      overwrite: true,
      resource_type: "image",
      transformation: [
        { width: 500, height: 500, crop: "limit" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (err) {
    console.warn("⚠️ Cloudinary upload from URL failed:", err);
    // Fallback: return original URL
    return {
      url: imageUrl,
      publicId: "",
    };
  }
}
