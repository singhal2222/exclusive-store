// FILE LOCATION: app/api/categories/route.js

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category.model";
import { getCurrentUser } from "@/lib/auth";

const ICON_MAX_LENGTH = 60;
const DEFAULT_ICON = "";

// ============================================================
// Helpers
// ============================================================

function jsonError(message, status) {
    return NextResponse.json(
        { success: false, message },
        { status }
    );
}

function getErrorMessage(error, fallback) {
    return process.env.NODE_ENV === "development"
        ? error?.message || fallback
        : fallback;
}

/**
 * Generate a URL-safe slug from a category name.
 * Must stay in sync with any slug logic in Category.model.js.
 *
 * If your Category model already generates slugs in a
 * pre("validate") hook, you can delete this helper and stop
 * passing `slug` to Category.create() below.
 */
function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// ============================================================
// GET /api/categories
// Public — returns active categories.
// ============================================================

export async function GET() {
    try {
        await connectDB();

        const categories = await Category.find({
            isActive: true,
        })
            .select("-__v")
            .sort({ createdAt: 1 })
            .lean();

        return NextResponse.json(
            {
                success: true,
                categories,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get categories error:", error);

        return jsonError(
            getErrorMessage(
                error,
                "Something went wrong while fetching categories"
            ),
            500
        );
    }
}

// ============================================================
// POST /api/categories
// Admin only — create a new category.
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

        // -------------------- Database --------------------

        await connectDB();

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
            return jsonError("Request body must be a JSON object", 400);
        }

        const { name, icon } = body;

        // -------------------- Validate name --------------------

        if (typeof name !== "string" || !name.trim()) {
            return jsonError("Category name is required", 400);
        }

        const trimmedName = name.trim();

        if (trimmedName.length < 2 || trimmedName.length > 100) {
            return jsonError(
                "Category name must be between 2 and 100 characters",
                400
            );
        }

        // -------------------- Validate icon --------------------

        let trimmedIcon = DEFAULT_ICON;

        if (icon !== undefined && icon !== null && icon !== "") {
            if (typeof icon !== "string") {
                return jsonError("Icon must be a string", 400);
            }

            trimmedIcon = icon.trim();

            if (trimmedIcon.length > ICON_MAX_LENGTH) {
                return jsonError(
                    `Icon must not exceed ${ICON_MAX_LENGTH} characters`,
                    400
                );
            }
        }

        // -------------------- Duplicate name check --------------------
        // Case- and accent-insensitive lookup. NOTE: this check alone
        // is not race-proof. For full protection, the unique index on
        // `name` in Category.model.js should also use collation:
        //   { locale: "en", strength: 2 }

        const existingCategory = await Category.findOne({
            name: trimmedName,
        })
            .collation({ locale: "en", strength: 2 })
            .select("_id")
            .lean();

        if (existingCategory) {
            return jsonError("Category already exists", 409);
        }

        // -------------------- Generate and check slug --------------------

        const slug = generateSlug(trimmedName);

        if (!slug) {
            return jsonError(
                "Category name must contain at least one letter or number",
                400
            );
        }

        const existingSlug = await Category.findOne({ slug })
            .select("_id")
            .lean();

        if (existingSlug) {
            return jsonError(
                "A category with this URL already exists",
                409
            );
        }

        // -------------------- Create category --------------------

        // If Category.model.js generates the slug in a
        // pre("validate") hook, remove `slug` from this object.
        const category = await Category.create({
            name: trimmedName,
            slug,
            icon: trimmedIcon,
        });

        // -------------------- Return clean object --------------------

        const createdCategory = await Category.findById(category._id)
            .select("-__v")
            .lean();

        return NextResponse.json(
            {
                success: true,
                message: "Category created successfully",
                category: createdCategory,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create category error:", error);

        // -------------------- Mongoose validation --------------------

        if (error?.name === "ValidationError") {
            const firstMessage = Object.values(
                error.errors || {}
            )[0]?.message;

            return jsonError(
                firstMessage || "Category validation failed",
                400
            );
        }

        // -------------------- Duplicate key (race condition) --------------------

        if (error?.code === 11000) {
            const keyPattern = error?.keyPattern || {};
            const keyValue = error?.keyValue || {};

            // Distinguish which field collided.
            if (keyPattern.slug || keyValue.slug) {
                return jsonError(
                    "A category with this URL already exists",
                    409
                );
            }

            if (keyPattern.name || keyValue.name) {
                return jsonError("Category already exists", 409);
            }

            return jsonError(
                "A category with the same details already exists",
                409
            );
        }

        return jsonError(
            getErrorMessage(
                error,
                "Something went wrong while creating the category"
            ),
            500
        );
    }
}