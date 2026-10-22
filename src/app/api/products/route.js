// FILE LOCATION: src/app/api/products/route.js

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product.model";
import Category from "@/models/Category.model";
import { getCurrentUser } from "@/lib/auth";

// ============================================================
// Shared helpers
// ============================================================

function jsonError(message, status) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

function parseOptionalNumber(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return { value: null, error: null };
  }

  // Avoid silently converting whitespace to zero.
  if (typeof value === "string" && value.trim() === "") {
    return {
      value: null,
      error: `${fieldName} must be a valid number`,
    };
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return {
      value: null,
      error: `${fieldName} must be a valid number`,
    };
  }

  return { value: number, error: null };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ============================================================
// POST /api/products
// Create product - Admin only
//
// NOTE ON RATING:
// The `rating` field on a product is COMPUTED AUTOMATICALLY from
// approved reviews. Even if an admin sends a `rating` value in
// the request body, it is ignored and the product is created
// with rating = 0 and reviewCount = 0.
// ============================================================

export async function POST(request) {
  try {
    // 1. Authentication
    const user = await getCurrentUser();

    if (!user) {
      return jsonError("Authentication required", 401);
    }

    if (user.role !== "admin") {
      return jsonError("Admin access required", 403);
    }

    // 2. Database connection
    await connectDB();

    // 3. Parse JSON
    let body;

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonError(
        "Request body must be a JSON object",
        400
      );
    }

    const {
      name,
      description,
      category,
      originalPrice,
      discountPercentage = 0,
      price,
      stock,
      image = "",
      imagePublicId = "",
      // NOTE: `rating` is intentionally NOT destructured.
      // Any value sent by the client is ignored.
    } = body;

    // 4. Required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      !category ||
      stock === undefined ||
      stock === null ||
      stock === ""
    ) {
      return jsonError(
        "Name, description, category and stock are required",
        400
      );
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedCategory = String(category).trim();

    // 5. Validate text
    if (trimmedName.length < 2 || trimmedName.length > 150) {
      return jsonError(
        "Product name must be between 2 and 150 characters",
        400
      );
    }

    if (
      trimmedDescription.length < 10 ||
      trimmedDescription.length > 2000
    ) {
      return jsonError(
        "Description must be between 10 and 2000 characters",
        400
      );
    }

    // 6. Validate category ID
    if (!mongoose.isValidObjectId(trimmedCategory)) {
      return jsonError("Invalid category ID", 400);
    }

    const existingCategory = await Category.findOne({
      _id: trimmedCategory,
      isActive: true,
    })
      .select("_id")
      .lean();

    if (!existingCategory) {
      return jsonError(
        "Category not found or inactive",
        400
      );
    }

    // 7. Validate original price
    const originalPriceResult = parseOptionalNumber(
      originalPrice,
      "Original price"
    );

    if (originalPriceResult.error) {
      return jsonError(originalPriceResult.error, 400);
    }

    const productOriginalPrice = originalPriceResult.value;

    if (
      productOriginalPrice !== null &&
      productOriginalPrice < 0
    ) {
      return jsonError(
        "Original price cannot be negative",
        400
      );
    }

    // 8. Validate discount percentage
    const discountResult = parseOptionalNumber(
      discountPercentage,
      "Discount percentage"
    );

    if (discountResult.error) {
      return jsonError(discountResult.error, 400);
    }

    const productDiscount = discountResult.value ?? 0;

    if (productDiscount < 0 || productDiscount > 100) {
      return jsonError(
        "Discount percentage must be between 0 and 100",
        400
      );
    }

    if (
      productDiscount > 0 &&
      productOriginalPrice === null
    ) {
      return jsonError(
        "Original price is required when a discount is applied",
        400
      );
    }

    // If original price is supplied, the model calculates price.
    // Otherwise, a valid selling price is required.
    let productPrice;

    if (productOriginalPrice !== null) {
      if (price !== undefined && price !== null && price !== "") {
        const suppliedPrice = parseOptionalNumber(
          price,
          "Price"
        );

        if (suppliedPrice.error || suppliedPrice.value < 0) {
          return jsonError(
            suppliedPrice.error || "Price cannot be negative",
            400
          );
        }
      }

      productPrice =
        Math.round(
          (productOriginalPrice *
            (1 - productDiscount / 100) +
            Number.EPSILON) *
          100
        ) / 100;
    } else {
      const priceResult = parseOptionalNumber(price, "Price");

      if (priceResult.error || priceResult.value === null) {
        return jsonError(
          priceResult.error || "Price is required",
          400
        );
      }

      productPrice = priceResult.value;
    }

    if (!Number.isFinite(productPrice) || productPrice < 0) {
      return jsonError(
        "Price must be a valid non-negative number",
        400
      );
    }

    // 9. Validate stock
    const stockResult = parseOptionalNumber(stock, "Stock");

    if (
      stockResult.error ||
      stockResult.value === null ||
      !Number.isInteger(stockResult.value) ||
      stockResult.value < 0
    ) {
      return jsonError(
        "Stock must be a non-negative whole number",
        400
      );
    }

    // 10. Validate image fields
    if (
      typeof image !== "string" ||
      typeof imagePublicId !== "string"
    ) {
      return jsonError(
        "Image URL and image public ID must be strings",
        400
      );
    }

    const trimmedImage = image.trim();
    const trimmedImagePublicId = imagePublicId.trim();

    if (
      Boolean(trimmedImage) !== Boolean(trimmedImagePublicId)
    ) {
      return jsonError(
        "Image URL and image public ID must both be provided or both be empty",
        400
      );
    }

    if (trimmedImage) {
      try {
        const parsedImageUrl = new URL(trimmedImage);

        if (
          parsedImageUrl.protocol !== "https:" ||
          parsedImageUrl.hostname !== "res.cloudinary.com"
        ) {
          return jsonError(
            "Product image must be a valid HTTPS Cloudinary URL",
            400
          );
        }
      } catch {
        return jsonError("Invalid product image URL", 400);
      }

      if (!trimmedImagePublicId.startsWith("ecommerce/products/")) {
        return jsonError(
          "Invalid product image public ID",
          400
        );
      }
    }

    // 11. Create product
    //
    // IMPORTANT:
    // - `rating` is NOT passed. The schema defaults it to 0.
    // - `reviewCount` is NOT passed. The schema defaults it to 0.
    //
    // Both values will be recalculated automatically whenever
    // reviews are approved, rejected, or deleted.
    //
    const product = await Product.create({
      name: trimmedName,
      description: trimmedDescription,
      category: trimmedCategory,
      price: productPrice,
      originalPrice: productOriginalPrice,
      discountPercentage: productDiscount,
      stock: stockResult.value,
      image: trimmedImage,
      imagePublicId: trimmedImagePublicId,
    });

    // 12. Populate category details
    await product.populate({
      path: "category",
      select: "name slug icon",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product error:", error);

    if (error?.name === "ValidationError") {
      const firstMessage = Object.values(
        error.errors || {}
      )[0]?.message;

      return jsonError(
        firstMessage || "Product validation failed",
        400
      );
    }

    if (error?.name === "CastError") {
      return jsonError("Invalid product or category data", 400);
    }

    return jsonError(
      process.env.NODE_ENV === "development"
        ? error?.message || "Internal server error"
        : "Something went wrong while creating the product",
      500
    );
  }
}

// ============================================================
// GET /api/products
//
// Public:  returns active products only.
// Admin:   returns active + inactive products when the caller
//          explicitly passes includeInactive=true.
//
// Supports: search, category filtering, pagination.
// ============================================================

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";

    // -------------------- Admin-only includeInactive --------------------
    // Reading the session here is silent: unauthenticated requests
    // fall through to the public behavior automatically.
    const user = await getCurrentUser().catch(() => null);
    const isAdmin = user?.role === "admin";

    const includeInactive =
      isAdmin &&
      searchParams.get("includeInactive") === "true";

    // -------------------- Pagination --------------------
    const rawPage = searchParams.get("page");
    const rawLimit = searchParams.get("limit");

    const page = rawPage === null ? 1 : Number(rawPage);
    const limit = rawLimit === null ? 10 : Number(rawLimit);

    if (!Number.isSafeInteger(page) || page < 1) {
      return jsonError(
        "Page must be a positive integer",
        400
      );
    }

    if (
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return jsonError(
        "Limit must be an integer between 1 and 100",
        400
      );
    }

    // -------------------- Build query --------------------
    // Storefront returns only active products by default.
    // Admin requests with includeInactive=true skip this filter.
    const query = includeInactive ? {} : { isActive: true };

    // Product search
    if (search) {
      const escapedSearch = escapeRegex(search);

      query.$or = [
        {
          name: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          description: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];
    }

    // Category filter
    if (category && category !== "All") {
      if (!mongoose.isValidObjectId(category)) {
        return jsonError("Invalid category ID", 400);
      }

      const existingCategory = await Category.findOne({
        _id: category,
        isActive: true,
      })
        .select("_id")
        .lean();

      if (!existingCategory) {
        return jsonError("Category not found", 404);
      }

      query.category = category;
    }

    const skip = (page - 1) * limit;

    if (!Number.isSafeInteger(skip)) {
      return jsonError("Requested page is too large", 400);
    }

    // -------------------- Fetch --------------------
    const [products, totalProducts] = await Promise.all([
      Product.find(query)
        .populate({
          path: "category",
          select: "name slug icon",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    return NextResponse.json(
      {
        success: true,
        products,
        pagination: {
          page,
          limit,
          total: totalProducts,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get products error:", error);

    return jsonError(
      process.env.NODE_ENV === "development"
        ? error?.message || "Internal server error"
        : "Something went wrong while fetching products",
      500
    );
  }
}