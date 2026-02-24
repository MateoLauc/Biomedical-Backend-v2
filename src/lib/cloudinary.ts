import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "../config/env.js";

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
 * Build a CDN delivery URL for a PDF stored as an image-type asset.
 * Cloudinary requires the URL to include the .pdf extension for the asset to be
 * delivered with correct Content-Type and to open in the browser. The upload API
 * may return a URL without the extension when public_id has no extension.
 * On the free plan, enable "Allow delivery of PDF and ZIP files" in
 * Settings > Security in the Cloudinary console.
 */
export function pdfDeliveryUrl(publicId: string): string {
  if (!publicId) return "";
  return cloudinary.url(publicId, {
    resource_type: "image",
    format: "pdf",
    secure: true,
  });
}

/**
 * Upload an image buffer to Cloudinary.
 * @param buffer - Image file buffer (e.g. from multer)
 * @param folder - Optional folder in Cloudinary (e.g. "blog")
 * @param publicId - Optional public id; if omitted Cloudinary generates one
 */
export async function uploadImage(
  buffer: Buffer,
  options?: { folder?: string; publicId?: string }
): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
  }

  return new Promise((resolve, reject) => {
    const uploadOptions: { folder?: string; public_id?: string } = {};
    if (options?.folder) uploadOptions.folder = options.folder;
    if (options?.publicId) uploadOptions.public_id = options.publicId;

    const uploadStream = cloudinary.uploader.upload_stream(
      { ...uploadOptions, resource_type: "image" },
      (err, result) => {
        if (err) {
          const message = err instanceof Error ? err.message : typeof err === "string" ? err : "Image upload failed.";
          reject(new Error(message));
          return;
        }
        const res = result as UploadApiResponse;
        if (!res?.secure_url) {
          reject(new Error("Cloudinary did not return a URL."));
          return;
        }
        resolve({
          url: res.secure_url,
          publicId: res.public_id ?? ""
        });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Upload a raw file (e.g. non-PDF document) to Cloudinary.
 */
export async function uploadRaw(
  buffer: Buffer,
  options?: { folder?: string; publicId?: string }
): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary is not configured.");
  }
  return new Promise((resolve, reject) => {
    const uploadOptions: { folder?: string; public_id?: string } = {};
    if (options?.folder) uploadOptions.folder = options.folder;
    if (options?.publicId) uploadOptions.public_id = options.publicId;
    const uploadStream = cloudinary.uploader.upload_stream(
      { ...uploadOptions, resource_type: "raw" },
      (err, result) => {
        if (err) {
          reject(new Error(err instanceof Error ? err.message : "Upload failed."));
          return;
        }
        const res = result as UploadApiResponse;
        if (!res?.secure_url) {
          reject(new Error("Cloudinary did not return a URL."));
          return;
        }
        resolve({ url: res.secure_url, publicId: res.public_id ?? "" });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Upload a PDF to Cloudinary using the image upload API.
 * Cloudinary treats PDFs as image-type assets so they get a delivery URL like
 * .../image/upload/.../public_id.pdf and can be delivered/inlined correctly.
 * Use this instead of raw for PDFs so the file is stored and served as a proper PDF.
 */
export async function uploadPdf(
  buffer: Buffer,
  options?: { folder?: string; publicId?: string }
): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary is not configured.");
  }
  return new Promise((resolve, reject) => {
    const uploadOptions: { folder?: string; public_id?: string } = {};
    if (options?.folder) uploadOptions.folder = options.folder;
    if (options?.publicId) uploadOptions.public_id = options.publicId;
    const uploadStream = cloudinary.uploader.upload_stream(
      { ...uploadOptions, resource_type: "image" },
      (err, result) => {
        if (err) {
          reject(new Error(err instanceof Error ? err.message : "PDF upload failed."));
          return;
        }
        const res = result as UploadApiResponse;
        if (!res?.public_id) {
          reject(new Error("Cloudinary did not return a public_id."));
          return;
        }
        const id = res.public_id;
        resolve({ url: pdfDeliveryUrl(id), publicId: id });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by public_id.
 */
export async function deleteImage(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary is not configured.");
  }
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
