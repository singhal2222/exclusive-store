// FILE LOCATION: app/api/upload/route.js

import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

// ============================================================
// Constants
// ============================================================

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// All product images live under this Cloudinary folder.
// The trailing slash is intentional — it prevents matching
// sibling folders like "ecommerce/products-backup".
const CLOUDINARY_PRODUCT_FOLDER = "ecommerce/products/";

// ============================================================
// Helpers
// ============================================================

function jsonError(message, status) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

function isProductCloudinaryId(publicId) {
  return (
    typeof publicId === "string" &&
    publicId.startsWith(CLOUDINARY_PRODUCT_FOLDER) &&
    publicId.length > CLOUDINARY_PRODUCT_FOLDER.length
  );
}

// ============================================================
// POST /api/upload
// Upload a product image to Cloudinary. Admin only.
// ============================================================

export async function POST(request) {
  try {
    // -------------------- Authentication --------------------

    const user = await getCurrentUser();

    if (!user) {
      return jsonError("Authentication required", 401);
    }

    if (user.role !== "admin") {
      return jsonError("Admin access required", 403);
    }

    // -------------------- Parse form data --------------------

    let formData;

    try {
      formData = await request.formData();
    } catch {
      return jsonError("Invalid form data", 400);
    }

    const file = formData.get("image");

    if (!file || typeof file === "string") {
      return jsonError("No image file received", 400);
    }

    // -------------------- Validate file --------------------

    if (!ALLOWED_TYPES.includes(file.type)) {
      return jsonError(
        "Only JPG, PNG, WEBP or GIF images are allowed",
        400
      );
    }

    if (file.size > MAX_SIZE) {
      return jsonError(
        "Image size should not exceed 5MB",
        400
      );
    }

    if (file.size === 0) {
      return jsonError("Uploaded image is empty", 400);
    }

    // -------------------- Upload to Cloudinary --------------------

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "ecommerce/products",
          resource_type: "image",
          // Strip metadata that could leak EXIF GPS data.
          transformation: [{ flags: "strip_profile" }],
        },
        (error, uploadResult) => {
          if (error) return reject(error);
          resolve(uploadResult);
        }
      );

      stream.end(buffer);
    });

    // Guard against a malformed Cloudinary response.
    if (
      !result ||
      typeof result.secure_url !== "string" ||
      typeof result.public_id !== "string"
    ) {
      console.error(
        "Unexpected Cloudinary upload result:",
        result
      );

      return jsonError(
        "Image upload did not return a valid result",
        500
      );
    }

    // -------------------- Success --------------------

    return NextResponse.json(
      {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload image error:", error);

    return jsonError(
      process.env.NODE_ENV === "development"
        ? error?.message || "Internal server error"
        : "Something went wrong while uploading the image",
      500
    );
  }
}

// ============================================================
// DELETE /api/upload
// Delete a Cloudinary product image by publicId. Admin only.
// Restricted to the ecommerce/products/ folder.
// ============================================================

export async function DELETE(request) {
  try {
    // -------------------- Authentication --------------------

    const user = await getCurrentUser();

    if (!user) {
      return jsonError("Authentication required", 401);
    }

    if (user.role !== "admin") {
      return jsonError("Admin access required", 403);
    }

    // -------------------- Parse body --------------------

    let body;

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return jsonError("Invalid request body", 400);
    }

    const { publicId } = body;

    if (
      typeof publicId !== "string" ||
      !publicId.trim()
    ) {
      return jsonError(
        "publicId is required and must be a string",
        400
      );
    }

    const cleanPublicId = publicId.trim();

    // -------------------- Folder restriction --------------------

    // Only allow deletion of assets inside the product folder.
    // This prevents an admin session from being used to delete
    // unrelated Cloudinary assets.
    if (!isProductCloudinaryId(cleanPublicId)) {
      return jsonError(
        "Only product images can be deleted via this endpoint",
        403
      );
    }

    // -------------------- Delete --------------------

    const result = await cloudinary.uploader.destroy(
      cleanPublicId,
      { resource_type: "image" }
    );

    // Cloudinary returns result.result:
    //   "ok"        — deleted
    //   "not found" — nothing to delete (still a success for cleanup)
    const wasDeleted = result?.result === "ok";
    const wasNotFound = result?.result === "not found";

    if (!wasDeleted && !wasNotFound) {
      console.error(
        "Unexpected Cloudinary delete result:",
        result
      );

      return jsonError(
        "Cloudinary did not confirm deletion",
        500
      );
    }

    return NextResponse.json(
      {
        success: true,
        deleted: wasDeleted,
        result: result?.result || "unknown",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete image error:", error);

    return jsonError(
      process.env.NODE_ENV === "development"
        ? error?.message || "Internal server error"
        : "Something went wrong while deleting the image",
      500
    );
  }
}