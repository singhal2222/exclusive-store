import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Category from "@/models/Category.model";
import Product from "@/models/Product.model";
import { getCurrentUser } from "@/lib/auth";

// Create URL-friendly slug from category name
function createSlug(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// GET /api/categories/:id
export async function GET(request, { params }) {
  try {
    // 1. Get category ID
    const { id } = await params;

    // 2. Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID",
        },
        { status: 400 }
      );
    }

    // 3. Connect to MongoDB
    await connectDB();

    // 4. Find active category
    const category = await Category.findOne({
      _id: id,
      isActive: true,
    }).lean();

    // 5. Category not found
    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    // 6. Return category
    return NextResponse.json(
      {
        success: true,
        category,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get category error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? error?.message
            : "Something went wrong while fetching the category",
      },
      { status: 500 }
    );
  }
}

// PUT /api/categories/:id
export async function PUT(request, { params }) {
  try {
    // 1. Check logged-in user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // 2. Only admin can edit categories
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        { status: 403 }
      );
    }

    // 3. Get category ID
    const { id } = await params;

    // 4. Validate category ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID",
        },
        { status: 400 }
      );
    }

    // 5. Connect to MongoDB
    await connectDB();

    // 6. Read request body
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON body",
        },
        { status: 400 }
      );
    }

    const { name, icon } = body || {};

    // 7. Check category name
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name is required",
        },
        { status: 400 }
      );
    }

    // 8. Clean category name
    const trimmedName = String(name).trim();

    // 9. Validate category name
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category name must be between 2 and 100 characters",
        },
        { status: 400 }
      );
    }

    // 10. Clean icon
    const trimmedIcon =
      icon === undefined || icon === null || icon === ""
        ? "phone"
        : String(icon).trim();

    // 11. Generate new slug
    const slug = createSlug(trimmedName);

    // 12. Check if another category has the same name
    const existingCategory = await Category.findOne({
      _id: { $ne: id },
      name: trimmedName,
    }).collation({
      locale: "en",
      strength: 2,
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another category with this name already exists",
        },
        { status: 409 }
      );
    }

    // 13. Check if another category has the same slug
    const existingSlug = await Category.findOne({
      _id: { $ne: id },
      slug,
    });

    if (existingSlug) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another category with this URL already exists",
        },
        { status: 409 }
      );
    }

    // 14. Find category
    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    // 15. Update category
    category.name = trimmedName;
    category.slug = slug;
    category.icon = trimmedIcon;

    await category.save();

    // 16. Return updated category
    return NextResponse.json(
      {
        success: true,
        message: "Category updated successfully",
        category,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update category error:", error);

    // Handle Mongoose validation errors
    if (error?.name === "ValidationError") {
      const firstMessage =
        Object.values(error?.errors || {})[0]?.message;

      return NextResponse.json(
        {
          success: false,
          message:
            firstMessage || "Category validation failed",
        },
        { status: 400 }
      );
    }

    // Handle duplicate key error
    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another category with this name or URL already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? error?.message
            : "Something went wrong while updating the category",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/:id
export async function DELETE(request, { params }) {
  try {
    // 1. Check logged-in user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    // 2. Only admin can delete categories
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        { status: 403 }
      );
    }

    // 3. Get category ID
    const { id } = await params;

    // 4. Validate category ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category ID",
        },
        { status: 400 }
      );
    }

    // 5. Connect to MongoDB
    await connectDB();

    // 6. Find category
    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    // 7. Check whether any products use this category
    const productCount = await Product.countDocuments({
      category: id,
    });

    // 8. Do not delete category if products are using it
    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete this category because ${productCount} product${
            productCount === 1 ? " is" : "s are"
          } using it. Please move or delete those products first.`,
          productCount,
        },
        { status: 409 }
      );
    }

    // 9. Permanently delete category
    await Category.findByIdAndDelete(id);

    // 10. Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Category permanently deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete category error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? error?.message
            : "Something went wrong while deleting the category",
      },
      { status: 500 }
    );
  }
}
