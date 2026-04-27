/* =====================================================
   Cloudinary Configuration & Upload Utility
   --------------------------------------------------------
   Uploads base64 / data-URL images to Cloudinary and
   returns the secure URL + public_id.
   ===================================================== */

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * Upload a base64 / data-URL image string to Cloudinary.
 * Images are stored in the "fakeid_profiles" folder.
 */
export async function uploadImage(
  base64OrDataUrl: string,
  username: string
): Promise<CloudinaryUploadResult> {
  // Ensure data-URL prefix for Cloudinary
  const dataUrl = base64OrDataUrl.startsWith("data:")
    ? base64OrDataUrl
    : `data:image/png;base64,${base64OrDataUrl}`;

  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: "fakeid_profiles",
    public_id: `${username}_${Date.now()}`,
    overwrite: true,
    resource_type: "image",
    transformation: [
      { width: 500, height: 500, crop: "limit" }, // limit max dimensions
      { quality: "auto", fetch_format: "auto" },
    ],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

/**
 * Delete an image from Cloudinary by public ID.
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
