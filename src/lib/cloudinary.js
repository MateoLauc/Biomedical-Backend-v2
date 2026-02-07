import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";
const cloudName = env.CLOUDINARY_CLOUD_NAME;
const apiKey = env.CLOUDINARY_API_KEY;
const apiSecret = env.CLOUDINARY_API_SECRET;
if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
    });
}
export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);
/**
 * Upload an image buffer to Cloudinary.
 * @param buffer - Image file buffer (e.g. from multer)
 * @param folder - Optional folder in Cloudinary (e.g. "blog")
 * @param publicId - Optional public id; if omitted Cloudinary generates one
 */
export async function uploadImage(buffer, options) {
    if (!isCloudinaryConfigured) {
        throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
    }
    return new Promise((resolve, reject) => {
        const uploadOptions = {};
        if (options?.folder)
            uploadOptions.folder = options.folder;
        if (options?.publicId)
            uploadOptions.public_id = options.publicId;
        const uploadStream = cloudinary.uploader.upload_stream({ ...uploadOptions, resource_type: "image" }, (err, result) => {
            if (err) {
                const message = err instanceof Error ? err.message : typeof err === "string" ? err : "Image upload failed.";
                reject(new Error(message));
                return;
            }
            const res = result;
            if (!res?.secure_url) {
                reject(new Error("Cloudinary did not return a URL."));
                return;
            }
            resolve({
                url: res.secure_url,
                publicId: res.public_id ?? ""
            });
        });
        uploadStream.end(buffer);
    });
}
/**
 * Delete an image from Cloudinary by public_id.
 */
export async function deleteImage(publicId) {
    if (!isCloudinaryConfigured) {
        throw new Error("Cloudinary is not configured.");
    }
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
