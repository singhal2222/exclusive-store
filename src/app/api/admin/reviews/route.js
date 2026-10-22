// FILE LOCATION: src/app/api/admin/reviews/route.js

import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import ReviewModel from "@/models/Review.model";
import ProductModel from "@/models/Product.model";

// ============================================================
// HELPERS
// ============================================================

function jsonError(message, status) {
    return NextResponse.json({ success: false, message }, { status });
}

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePage(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback;

    const number = Number(value);

    if (!Number.isSafeInteger(number) || number < 1) return null;

    return number;
}

function parseLimit(value, fallback, max = 100) {
    if (value === null || value === undefined || value === "") return fallback;

    const number = Number(value);

    if (!Number.isSafeInteger(number) || number < 1 || number > max) {
        return null;
    }

    return number;
}

/**
 * Admin review shape. Includes all admin-only fields.
 */
function formatReviewForAdmin(review) {
    const user = review.user || {};
    const product = review.product || {};

    return {
        _id: review._id.toString(),
        rating: review.rating,
        title: review.title || "",
        comment: review.comment,
        verifiedPurchase: Boolean(review.verifiedPurchase),
        status: review.status,
        adminNote: review.adminNote || "",
        editedAt: review.editedAt || null,
        approvedAt: review.approvedAt || null,
        approvedBy: review.approvedBy?.toString() || null,
        rejectedAt: review.rejectedAt || null,
        rejectedBy: review.rejectedBy?.toString() || null,
        helpfulCount: Number(review.helpfulCount || 0),
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        user: {
            _id: user._id?.toString() || null,
            name: user.name || "Anonymous",
            email: user.email || "",
        },
        product: {
            _id: product._id?.toString() || null,
            name: product.name || "Unknown Product",
            image: product.image || "",
            slug: product.slug || "",
        },
    };
}

// ============================================================
// GET — LIST REVIEWS (ADMIN ONLY)
// ============================================================

export async function GET(request) {
    try {
        // ----------------------------------------
        // Auth
        // ----------------------------------------

        const user = await getCurrentUser();

        if (!user) {
            return jsonError("Authentication required", 401);
        }

        if (user.role !== "admin") {
            return jsonError("Admin access required", 403);
        }

        await connectDB();

        // ----------------------------------------
        // Parse query params
        // ----------------------------------------

        const { searchParams } = new URL(request.url);

        const status = searchParams.get("status")?.trim() || "";
        const rating = searchParams.get("rating")?.trim() || "";
        const verified = searchParams.get("verified")?.trim() || "";
        const productId = searchParams.get("productId")?.trim() || "";
        const search = searchParams.get("search")?.trim() || "";

        const page = parsePage(searchParams.get("page"), 1);
        const limit = parseLimit(searchParams.get("limit"), 20, 100);

        if (page === null) {
            return jsonError("Page must be a positive integer", 400);
        }

        if (limit === null) {
            return jsonError("Limit must be between 1 and 100", 400);
        }

        // ----------------------------------------
        // Build query
        // ----------------------------------------

        const query = {};

        // Status filter
        if (status && ["pending", "approved", "rejected"].includes(status)) {
            query.status = status;
        }

        // Rating filter (1-5)
        if (rating) {
            const numericRating = Number(rating);

            if (
                !Number.isInteger(numericRating) ||
                numericRating < 1 ||
                numericRating > 5
            ) {
                return jsonError("Rating must be between 1 and 5", 400);
            }

            query.rating = numericRating;
        }

        // Verified purchase filter
        if (verified === "true") {
            query.verifiedPurchase = true;
        } else if (verified === "false") {
            query.verifiedPurchase = false;
        }

        // Product filter
        if (productId) {
            if (!isValidObjectId(productId)) {
                return jsonError("Invalid product ID", 400);
            }

            query.product = productId;
        }

        // Search — matches title, comment, or user name
        if (search) {
            const escaped = escapeRegex(search);

            // Find matching users first
            const matchingUsers = await mongoose
                .model("User")
                .find({
                    name: { $regex: escaped, $options: "i" },
                    deletedAt: null,
                })
                .select("_id")
                .limit(100)
                .lean();

            const userIds = matchingUsers.map((u) => u._id);

            const searchConditions = [
                { title: { $regex: escaped, $options: "i" } },
                { comment: { $regex: escaped, $options: "i" } },
            ];

            if (userIds.length > 0) {
                searchConditions.push({ user: { $in: userIds } });
            }

            query.$or = searchConditions;
        }

        // ----------------------------------------
        // Pagination
        // ----------------------------------------

        const skip = (page - 1) * limit;

        // ----------------------------------------
        // Fetch reviews + global stats
        // ----------------------------------------

        const [reviews, total, statsAggregate] = await Promise.all([
            ReviewModel.find(query)
                .populate({
                    path: "user",
                    select: "name email",
                })
                .populate({
                    path: "product",
                    select: "name image slug",
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            ReviewModel.countDocuments(query),

            // Global counts (not affected by current filter)
            ReviewModel.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        // ----------------------------------------
        // Shape stats
        // ----------------------------------------

        const statsMap = {
            pending: 0,
            approved: 0,
            rejected: 0,
        };

        for (const row of statsAggregate) {
            if (statsMap[row._id] !== undefined) {
                statsMap[row._id] = row.count;
            }
        }

        const statsTotal =
            statsMap.pending + statsMap.approved + statsMap.rejected;

        // ----------------------------------------
        // Shape reviews
        // ----------------------------------------

        const shapedReviews = reviews.map(formatReviewForAdmin);

        const totalPages = Math.ceil(total / limit);

        // ----------------------------------------
        // Response
        // ----------------------------------------

        return NextResponse.json(
            {
                success: true,
                reviews: shapedReviews,
                stats: {
                    total: statsTotal,
                    pending: statsMap.pending,
                    approved: statsMap.approved,
                    rejected: statsMap.rejected,
                },
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Admin list reviews error:", error);

        return jsonError(
            process.env.NODE_ENV === "development"
                ? error?.message || "Internal server error"
                : "Something went wrong while fetching reviews",
            500
        );
    }
}