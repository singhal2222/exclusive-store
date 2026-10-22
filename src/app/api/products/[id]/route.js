// FILE LOCATION: src/app/api/products/[id]/route.js

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product.model";
import Category from "@/models/Category.model";
import { getCurrentUser } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

const CLOUDINARY_PRODUCT_FOLDER = "ecommerce/products/";

const isValidId = (id) =>
  typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

const isProductCloudinaryId = (publicId) =>
  typeof publicId === "string" &&
  publicId.startsWith(CLOUDINARY_PRODUCT_FOLDER) &&
  publicId.length > CLOUDINARY_PRODUCT_FOLDER.length;

const isValidProductImageUrl = (imageUrl) => {
  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    return false;
  }

  try {
    const url = new URL(imageUrl);

    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com"
    );
  } catch {
    return false;
  }
};

const errorResponse = (message, status) =>
  NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );

const getErrorMessage = (error, fallback) =>
  process.env.NODE_ENV === "development"
    ? error?.message || fallback
    : fallback;

// ============================================================
// GET /api/products/[id]
// Public users: active products only
// Admins: active and inactive products
// ============================================================

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!isValidId(id)) {
      return errorResponse("Invalid product ID", 400);
    }

    // Authentication is optional for this public endpoint.
    const user = await getCurrentUser().catch(() => null);
    const isAdmin = user?.role === "admin";

    await connectDB();

    const query = { _id: id };

    if (!isAdmin) {
      query.isActive = true;
    }

    const product = await Product.findOne(query)
      .populate({
        path: "category",
        select: "name slug icon",
      })
      .lean();

    if (!product) {
      return errorResponse("Product not found", 404);
    }

    return NextResponse.json(
      {
        success: true,
        product,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get product error:", error);

    return errorResponse(
      getErrorMessage(
        error,
        "Something went wrong while fetching the product"
      ),
      500
    );
  }
}

// ============================================================
// PUT /api/products/[id]
// Update a product - Admin only
// Uses document.save() so Mongoose validation hooks run.
//
// NOTE ON RATING:
// The `rating` field is COMPUTED from approved reviews and
// updated automatically by the review APIs. Even if an admin
// sends a `rating` value in the request body, it is IGNORED
// here. The product keeps whatever rating the review system
// has calculated.
// ============================================================

export async function PUT(request, { params }) {
  try {
    // -------------------- Authentication --------------------

    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("Authentication required", 401);
    }

    if (user.role !== "admin") {
      return errorResponse("Admin access required", 403);
    }

    // -------------------- Validate product ID --------------------

    const { id } = await params;

    if (!isValidId(id)) {
      return errorResponse("Invalid product ID", 400);
    }

    await connectDB();

    // -------------------- Parse request body --------------------

    let body;

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return errorResponse("Invalid request body", 400);
    }

    // -------------------- Load existing product --------------------

    const product = await Product.findById(id);

    if (!product) {
      return errorResponse("Product not found", 404);
    }

    // ============================================================
    // Required text fields
    // ============================================================

    const { name, description, category, stock } = body;

    if (
      typeof name !== "string" ||
      typeof description !== "string" ||
      !category ||
      stock === undefined ||
      stock === null ||
      stock === ""
    ) {
      return errorResponse(
        "Name, description, category and stock are required",
        400
      );
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedCategory = String(category).trim();

    if (
      trimmedName.length < 2 ||
      trimmedName.length > 150
    ) {
      return errorResponse(
        "Product name must be between 2 and 150 characters",
        400
      );
    }

    if (
      trimmedDescription.length < 10 ||
      trimmedDescription.length > 2000
    ) {
      return errorResponse(
        "Product description must be between 10 and 2000 characters",
        400
      );
    }

    if (!isValidId(trimmedCategory)) {
      return errorResponse("Invalid category ID", 400);
    }

    // ============================================================
    // Category validation
    // ============================================================

    const existingCategory = await Category.findOne({
      _id: trimmedCategory,
      isActive: true,
    }).lean();

    if (!existingCategory) {
      return errorResponse(
        "Category not found or inactive",
        400
      );
    }

    // ============================================================
    // Stock validation
    // ============================================================

    const productStock = Number(stock);

    if (
      !Number.isFinite(productStock) ||
      !Number.isInteger(productStock) ||
      productStock < 0
    ) {
      return errorResponse(
        "Stock must be a valid non-negative integer",
        400
      );
    }

    // ============================================================
    // Original price and discount validation
    // ============================================================

    const hasOriginalPrice = Object.prototype.hasOwnProperty.call(
      body,
      "originalPrice"
    );

    const hasDiscountPercentage =
      Object.prototype.hasOwnProperty.call(
        body,
        "discountPercentage"
      );

    let productOriginalPrice = hasOriginalPrice
      ? body.originalPrice === null ||
        body.originalPrice === ""
        ? null
        : Number(body.originalPrice)
      : product.originalPrice ?? null;

    let productDiscountPercentage = hasDiscountPercentage
      ? Number(body.discountPercentage)
      : product.discountPercentage ?? 0;

    // Removing the original price without providing a new
    // discount clears the old discount as well.
    if (
      hasOriginalPrice &&
      (body.originalPrice === null ||
        body.originalPrice === "") &&
      !hasDiscountPercentage
    ) {
      productDiscountPercentage = 0;
    }

    if (
      productOriginalPrice !== null &&
      (!Number.isFinite(productOriginalPrice) ||
        productOriginalPrice < 0)
    ) {
      return errorResponse(
        "Original price must be a valid non-negative number",
        400
      );
    }

    if (
      !Number.isFinite(productDiscountPercentage) ||
      productDiscountPercentage < 0 ||
      productDiscountPercentage > 100
    ) {
      return errorResponse(
        "Discount percentage must be between 0 and 100",
        400
      );
    }

    if (
      productDiscountPercentage > 0 &&
      productOriginalPrice === null
    ) {
      return errorResponse(
        "Original price is required when a discount is applied",
        400
      );
    }

    // ============================================================
    // Selling price validation
    // ============================================================

    let productPrice;

    if (productOriginalPrice !== null) {
      // Product.model.js calculates the final selling price
      // in its pre-validate hook.
      productPrice = product.price;

      if (
        productOriginalPrice === 0 &&
        productDiscountPercentage > 0
      ) {
        return errorResponse(
          "A discount cannot be applied to a zero original price",
          400
        );
      }
    } else {
      const rawPrice =
        body.price !== undefined &&
          body.price !== null &&
          body.price !== ""
          ? body.price
          : product.price;

      productPrice = Number(rawPrice);

      if (
        !Number.isFinite(productPrice) ||
        productPrice < 0
      ) {
        return errorResponse(
          "Price must be a valid non-negative number",
          400
        );
      }
    }

    // ============================================================
    // Active status validation
    // ============================================================

    let productIsActive = product.isActive;

    if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
      if (typeof body.isActive !== "boolean") {
        return errorResponse(
          "isActive must be true or false",
          400
        );
      }

      productIsActive = body.isActive;
    }

    // ============================================================
    // Image validation
    // Both image fields must be supplied together.
    // Send both as empty strings to remove an image.
    // ============================================================

    const hasImage = Object.prototype.hasOwnProperty.call(
      body,
      "image"
    );

    const hasImagePublicId =
      Object.prototype.hasOwnProperty.call(
        body,
        "imagePublicId"
      );

    if (hasImage !== hasImagePublicId) {
      return errorResponse(
        "Image URL and image public ID must be provided together",
        400
      );
    }

    let newImage = product.image || "";
    let newImagePublicId = product.imagePublicId || "";

    if (hasImage && hasImagePublicId) {
      if (
        typeof body.image !== "string" ||
        typeof body.imagePublicId !== "string"
      ) {
        return errorResponse(
          "Image URL and public ID must be strings",
          400
        );
      }

      newImage = body.image.trim();
      newImagePublicId = body.imagePublicId.trim();

      // Both empty means the image is being removed.
      if (newImage === "" && newImagePublicId === "") {
        // Valid image removal.
      } else {
        if (!newImage || !newImagePublicId) {
          return errorResponse(
            "Both image URL and public ID are required",
            400
          );
        }

        if (!isValidProductImageUrl(newImage)) {
          return errorResponse(
            "Image URL must be a valid HTTPS Cloudinary URL",
            400
          );
        }

        if (!isProductCloudinaryId(newImagePublicId)) {
          return errorResponse(
            "Invalid Cloudinary product image ID",
            400
          );
        }
      }
    }

    // ============================================================
    // Assign validated values
    // ============================================================
    //
    // NOTE:
    // - `product.rating` is NOT touched. It stays as whatever
    //   the review system last calculated.
    // - `product.reviewCount` is NOT touched either.
    //
    // ============================================================

    const previousPublicId = product.imagePublicId || "";

    product.name = trimmedName;
    product.description = trimmedDescription;
    product.category = trimmedCategory;
    product.stock = productStock;
    product.originalPrice = productOriginalPrice;
    product.discountPercentage = productDiscountPercentage;
    product.price = productPrice;
    product.isActive = productIsActive;

    // saleBadge is managed by Product.model.js based on
    // discountPercentage. Do not trust a client-supplied badge.
    product.image = newImage;
    product.imagePublicId = newImagePublicId;

    // ============================================================
    // Save product
    // Runs schema validation and document middleware.
    // ============================================================

    await product.save();

    // ============================================================
    // Delete old Cloudinary image after a successful save
    // ============================================================

    const imageChanged =
      previousPublicId &&
      previousPublicId !== newImagePublicId;

    if (
      imageChanged &&
      isProductCloudinaryId(previousPublicId)
    ) {
      try {
        await cloudinary.uploader.destroy(previousPublicId, {
          resource_type: "image",
        });
      } catch (error) {
        // The database update has already succeeded.
        // Log cleanup failures without undoing the update.
        console.error(
          "Failed to delete old Cloudinary image:",
          error
        );
      }
    }

    // Fetch the saved product with its populated category.
    const updatedProduct = await Product.findById(product._id)
      .populate({
        path: "category",
        select: "name slug icon",
      })
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Product updated successfully",
        product: updatedProduct,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update product error:", error);

    if (error?.name === "ValidationError") {
      const firstMessage = Object.values(
        error.errors || {}
      )[0]?.message;

      return errorResponse(
        firstMessage || "Product validation failed",
        400
      );
    }

    if (error?.name === "CastError") {
      return errorResponse(
        "Invalid product or category ID",
        400
      );
    }

    return errorResponse(
      getErrorMessage(
        error,
        "Something went wrong while updating the product"
      ),
      500
    );
  }
}

// ============================================================
// DELETE /api/products/[id]
// Hard delete - Admin only
// Deletes the database product and attempts Cloudinary cleanup.
// ============================================================

export async function DELETE(request, { params }) {
  try {
    // -------------------- Authentication --------------------

    const user = await getCurrentUser();

    if (!user) {
      return errorResponse("Authentication required", 401);
    }

    if (user.role !== "admin") {
      return errorResponse("Admin access required", 403);
    }

    // -------------------- Validate product ID --------------------

    const { id } = await params;

    if (!isValidId(id)) {
      return errorResponse("Invalid product ID", 400);
    }

    await connectDB();

    // -------------------- Find product --------------------

    const product = await Product.findById(id);

    if (!product) {
      return errorResponse("Product not found", 404);
    }

    const deletedProductData = product.toObject();
    const publicId = product.imagePublicId || "";

    // -------------------- Delete from MongoDB --------------------

    await product.deleteOne();

    // -------------------- Delete Cloudinary image --------------------

    if (isProductCloudinaryId(publicId)) {
      try {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: "image",
        });
      } catch (error) {
        // The product is already deleted from MongoDB.
        console.error(
          "Failed to delete Cloudinary image after product deletion:",
          error
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Product deleted successfully",
        product: deletedProductData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete product error:", error);

    if (error?.name === "CastError") {
      return errorResponse("Invalid product ID", 400);
    }

    return errorResponse(
      getErrorMessage(
        error,
        "Something went wrong while deleting the product"
      ),
      500
    );
  }
}