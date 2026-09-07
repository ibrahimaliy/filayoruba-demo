import { NextResponse } from "next/server";
import { uploadImage, deleteStoredImage } from "@/server/services/storage.service";
import { logAuditEvent } from "@/server/services/audit.service";
import { getAdminSession } from "@/server/auth";

/**
 * Validates image buffer magic bytes against trusted image signatures
 * Protects against disguised scripts, polyglot payloads, and fake extensions.
 */
function isValidImageMagicBytes(buffer: Buffer): { valid: boolean; format?: string } {
  if (buffer.length < 12) return { valid: false };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, format: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, format: "image/png" };
  }

  // WebP: RIFF .... WEBP (bytes 0-3 = "RIFF", bytes 8-11 = "WEBP")
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, format: "image/webp" };
  }

  // GIF: GIF87a or GIF89a (47 49 46 38)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { valid: true, format: "image/gif" };
  }

  return { valid: false };
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    // Support single file named "file" as well
    const singleFile = formData.get("file") as File | null;
    const allFiles = files.length > 0 ? files : singleFile ? [singleFile] : [];

    if (allFiles.length === 0) {
      return NextResponse.json(
        { message: "No files uploaded" },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];
    let usedProvider = "local";

    const requestedFolder = formData.get("folder") as string | null;
    const folder = requestedFolder ? requestedFolder.replace(/[^a-zA-Z0-9_-]/g, "") : "products";

    for (const file of allFiles) {
      // 1. Explicitly ban SVG to prevent Stored Cross-Site Scripting (XSS)
      const fileNameLower = file.name.toLowerCase();
      if (fileNameLower.endsWith(".svg") || file.type.includes("svg")) {
        return NextResponse.json(
          { message: "SVG uploads are disabled for security reasons. Please upload JPG, PNG, or WebP images." },
          { status: 400 }
        );
      }

      // 2. Strict 5MB size limit
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { message: `File "${file.name}" exceeds maximum allowed size of 5MB.` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 3. Deep Magic-Byte Inspection
      const magicCheck = isValidImageMagicBytes(buffer);
      if (!magicCheck.valid) {
        return NextResponse.json(
          { message: `File "${file.name}" is not a valid image format. Magic byte inspection failed.` },
          { status: 400 }
        );
      }

      const result = await uploadImage({
        buffer,
        fileName: file.name,
        mimeType: magicCheck.format || file.type,
        folder,
      });

      uploadedUrls.push(result.url);
      usedProvider = result.provider;
    }

    await logAuditEvent({
      action: "ADMIN_IMAGE_UPLOAD",
      entity: "ProductMedia",
      details: { count: uploadedUrls.length, urls: uploadedUrls },
    });

    return NextResponse.json({
      success: true,
      provider: usedProvider,
      urls: uploadedUrls,
      url: uploadedUrls[0],
    });
  } catch (error) {
    console.error("Admin image upload error:", error);
    return NextResponse.json(
      { message: "Image upload failed. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { message: "Image URL is required for deletion." },
        { status: 400 }
      );
    }

    const deleted = await deleteStoredImage(url);

    await logAuditEvent({
      action: "ADMIN_IMAGE_DELETE",
      entity: "MediaStorage",
      details: { url, success: deleted },
    });

    return NextResponse.json({
      success: true,
      deleted,
      message: deleted
        ? "Image successfully removed from storage."
        : "Image record removed (external or not found on storage).",
    });
  } catch (error) {
    console.error("Admin image delete error:", error);
    return NextResponse.json(
      { message: "Failed to delete image from storage." },
      { status: 500 }
    );
  }
}

