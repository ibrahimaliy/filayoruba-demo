import "server-only";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export interface UploadOptions {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  folder?: string;
}

export interface StorageProviderResult {
  url: string;
  provider: "cloudinary" | "s3" | "local";
}

/**
 * Uploads an image to Cloudinary using their REST API
 */
async function uploadToCloudinary(options: UploadOptions): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = options.folder || "filayoruba/products";
    
    // Cloudinary signature: sorted parameters hashed with api_secret using SHA-1
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

    const base64Data = `data:${options.mimeType};base64,${options.buffer.toString("base64")}`;

    const formData = new URLSearchParams();
    formData.append("file", base64Data);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok || !data.secure_url) {
      console.error("Cloudinary upload failed:", data);
      return null;
    }

    const rawUrl = data.secure_url as string;
    // Inject automatic edge CDN optimization (f_auto, q_auto)
    const optimizedUrl = rawUrl.includes("/upload/")
      ? rawUrl.replace("/upload/", "/upload/f_auto,q_auto/")
      : rawUrl;

    return optimizedUrl;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }
}

/**
 * Saves image to local filesystem under public/uploads/
 */
async function uploadToLocal(options: UploadOptions): Promise<string> {
  const safeFolder = (options.folder || "products").replace(/[^a-zA-Z0-9_-]/g, "");
  const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder);
  await mkdir(uploadDir, { recursive: true });

  // Map verified MIME type to strict allowed extension (prevents polyglot script injection)
  const mimeToExt: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  const safeExt = mimeToExt[options.mimeType.toLowerCase()] || ".jpg";

  const sanitizedBase = path
    .basename(options.fileName, path.extname(options.fileName))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 50);

  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  const filename = `fila_${sanitizedBase || "img"}_${timestamp}_${random}${safeExt}`;

  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, options.buffer);

  return `/uploads/${safeFolder}/${filename}`;
}

/**
 * Unified image storage service.
 * Automatically uses Cloudinary if configured in environment variables,
 * otherwise falls back to local disk storage for local development.
 */
export async function uploadImage(options: UploadOptions): Promise<StorageProviderResult> {
  // 1. Try Cloudinary first if configured
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    const cloudUrl = await uploadToCloudinary(options);
    if (cloudUrl) {
      return { url: cloudUrl, provider: "cloudinary" };
    }
  }

  // 2. Fall back to local disk storage
  const localUrl = await uploadToLocal(options);
  return { url: localUrl, provider: "local" };
}

/**
 * Deletes a stored image from either local disk or Cloudinary.
 * Safely guards against directory traversal attacks for local files.
 */
export async function deleteStoredImage(imageUrl: string): Promise<boolean> {
  if (!imageUrl || typeof imageUrl !== "string") return false;

  const normalizedUrl = imageUrl.trim();

  // 1. If stored locally in /uploads/
  if (normalizedUrl.startsWith("/uploads/")) {
    const uploadRootDir = path.join(process.cwd(), "public", "uploads");
    const relativePath = normalizedUrl.replace(/^\/uploads\//, "");
    const absolutePath = path.resolve(uploadRootDir, relativePath);

    // Guard against directory traversal
    if (!absolutePath.startsWith(uploadRootDir)) {
      console.warn("Path traversal attempt prevented in deleteStoredImage:", normalizedUrl);
      return false;
    }

    try {
      await unlink(absolutePath);
      return true;
    } catch (err: any) {
      if (err.code === "ENOENT") {
        // File already removed or doesn't exist
        return true;
      }
      console.error("Error deleting local file from storage:", err);
      return false;
    }
  }

  // 2. If stored in Cloudinary
  if (
    normalizedUrl.includes("res.cloudinary.com") ||
    (process.env.CLOUDINARY_CLOUD_NAME && normalizedUrl.includes(process.env.CLOUDINARY_CLOUD_NAME))
  ) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      try {
        const match = normalizedUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
        const publicId = match ? match[1] : null;
        if (publicId) {
          const timestamp = Math.round(Date.now() / 1000);
          const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
          const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

          const formData = new URLSearchParams();
          formData.append("public_id", publicId);
          formData.append("api_key", apiKey);
          formData.append("timestamp", timestamp.toString());
          formData.append("signature", signature);

          await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
            method: "POST",
            body: formData,
          });
          return true;
        }
      } catch (err) {
        console.error("Error deleting image from Cloudinary:", err);
      }
    }
  }

  return false;
}
