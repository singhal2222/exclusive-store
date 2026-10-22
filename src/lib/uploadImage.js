// FILE LOCATION: lib/uploadImage.js

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const UPLOAD_TIMEOUT_MS = 30_000; // 30s
const DELETE_TIMEOUT_MS = 10_000; // 10s

// ============================================================
// Helpers
// ============================================================

/**
 * Create an error with a stable code so callers can branch on it.
 */
function createError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Fetch with an AbortController-based timeout.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createError(
        "The request timed out. Please try again.",
        "TIMEOUT"
      );
    }

    throw createError(
      "Network error. Please check your connection and try again.",
      "NETWORK"
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Safely parse a JSON response. Falls back to an empty object
 * if the server returned non-JSON (e.g., an HTML error page).
 */
async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/**
 * Validate a File before uploading.
 * Throws a coded error on failure.
 */
function validateImageFile(file) {
  if (!(file instanceof File) && !(file instanceof Blob)) {
    throw createError(
      "No valid image file provided.",
      "VALIDATION"
    );
  }

  if (file.size === 0) {
    throw createError("The selected image is empty.", "VALIDATION");
  }

  if (file.size > MAX_SIZE) {
    throw createError(
      "Image size should not exceed 5MB.",
      "VALIDATION"
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw createError(
      "Only JPG, PNG, WEBP or GIF images are allowed.",
      "VALIDATION"
    );
  }
}

// ============================================================
// uploadImage
// POST /api/upload with FormData.
// Returns { url, publicId } on success.
// Throws a coded Error on failure.
// ============================================================

export async function uploadImage(file) {
  validateImageFile(file);

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetchWithTimeout(
    "/api/upload",
    {
      method: "POST",
      credentials: "include",
      body: formData,
      // Do NOT set Content-Type — the browser must set the
      // multipart boundary automatically.
    },
    UPLOAD_TIMEOUT_MS
  );

  const data = await safeJson(response);

  if (!response.ok) {
    throw createError(
      data?.message || "Image upload failed.",
      response.status === 401 || response.status === 403
        ? "AUTH"
        : "SERVER"
    );
  }

  if (data?.success === false) {
    throw createError(
      data?.message || "Image upload failed.",
      "SERVER"
    );
  }

  const url =
    typeof data?.url === "string" ? data.url.trim() : "";
  const publicId =
    typeof data?.publicId === "string"
      ? data.publicId.trim()
      : "";

  if (!url || !publicId) {
    throw createError(
      "The server did not return a valid image URL and public ID.",
      "SERVER"
    );
  }

  return { url, publicId };
}

// ============================================================
// deleteImage
// DELETE /api/upload with { publicId }.
// Returns true if deletion was confirmed (or already absent),
// false if the server responded with an error.
// Never throws — cleanup failures should not break the caller.
// ============================================================

export async function deleteImage(publicId) {
  if (typeof publicId !== "string" || !publicId.trim()) {
    console.warn("deleteImage: missing or invalid publicId");
    return false;
  }

  const cleanPublicId = publicId.trim();

  // Guard: only product images may be deleted through this helper.
  // Mirrors the server-side check in app/api/upload/route.js.
  if (!cleanPublicId.startsWith("ecommerce/products/")) {
    console.warn(
      "deleteImage: publicId is outside the product folder:",
      cleanPublicId
    );
    return false;
  }

  try {
    const response = await fetchWithTimeout(
      "/api/upload",
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicId: cleanPublicId }),
      },
      DELETE_TIMEOUT_MS
    );

    const data = await safeJson(response);

    if (!response.ok || data?.success === false) {
      console.error(
        "deleteImage failed:",
        data?.message || response.statusText
      );
      return false;
    }

    return true;
  } catch (error) {
    // Cleanup must never throw — log and continue.
    console.error("deleteImage error:", error);
    return false;
  }
}