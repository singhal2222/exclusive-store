// FILE LOCATION: src/app/api/products/[id]/reviews/route.js

import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import ReviewModel from "@/models/Review.model";
import ProductModel from "@/models/Product.model";
import OrderModel from "@/models/Order.model";
import OrderItemModel from "@/models/OrderItem.model";

// ============================================================
// HELPERS
// ============================================================

function jsonError(message, status) {
    return NextResponse.json({ success: false, message }, { status });
}

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function parsePage(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback;

    const number = Number(value);

    if (!Number.isSafeInteger(number) || number < 1) return null;

    return number;
}

function parseLimit(value, fallback, max = 50) {
    if (value === null || value === undefined || value === "") return fallback;

    const number = Number(value);

    if (!Number.isSafeInteger(number) || number < 1 || number > max) {
        return null;
    }

    return number;
}

/**
 * Public review shape. Strips admin-only fields and shapes the
 * user reference into safe display data.
 */
function formatReviewForPublic(review, currentUserId = null) {
    const user = review.user;

    const isOwnReview =
        currentUserId &&
        user?._id &&
        user._id.toString() === currentUserId.toString();

    return {
        _id: review._id.toString(),
        rating: review.rating,
        title: review.title || "",
        comment: review.comment,
        verifiedPurchase: Boolean(review.verifiedPurchase),
        status: review.status,
        editedAt: review.editedAt || null,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        isOwnReview: Boolean(isOwnReview),
        user: {
            _id: user?._id?.toString() || null,
            name: user?.name || "Anonymous",
        },
    };
}

/**
 * Compute the rating distribution for a product based on
 * approved reviews only.
 */
function buildRatingDistribution(reviews) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    let total = 0;
    let sum = 0;

    for (const review of reviews) {
        const rating = Number(review.rating);

        if (rating >= 1 && rating <= 5) {
            distribution[rating] += 1;
            sum += rating;
            total += 1;
        }
    }

    const average = total > 0 ? Number((sum / total).toFixed(2)) : 0;

    return { distribution, total, average };
}

/**
 * Determine whether a user is a verified purchaser of a product.
 *
 * "Verified" means the user has an order that includes this
 * product and the order was either:
 *   - paid online (paymentStatus: "paid"), OR
 *   - a COD order that has not been cancelled.
 *
 * Returns the matching order's _id, or null.
 */
async function findVerifiedOrder(userId, productId) {
    // Find the user's eligible orders
    const eligibleOrders = await OrderModel.find({
        user: userId,
        $or: [
            { paymentStatus: "paid" },
            {
                paymentMethod: "cod",
                orderStatus: { $nin: ["cancelled"] },
            },
        ],
    })
        .select("_id")
        .lean();

    if (eligibleOrders.length === 0) return null;

    const orderIds = eligibleOrders.map((order) => order._id);

    // Find an order item that links the product to one of those orders
    const item = await OrderItemModel.findOne({
        order: { $in: orderIds },
        product: productId,
    })
        .select("order")
        .lean();

    if (!item) return null;

    return item.order;
}

// ============================================================
// GET — LIST REVIEWS FOR A PRODUCT
// ============================================================

export async function GET(request, { params }) {
    try {
        await connectDB();

        // ----------------------------------------
        // Validate product id
        // ----------------------------------------

        const { id } = await params;

        if (!isValidObjectId(id)) {
            return jsonError("Invalid product ID", 400);
        }

        // ----------------------------------------
        // Ensure product exists
        // ----------------------------------------

        const product = await ProductModel.findById(id).select("_id").lean();

        if (!product) {
            return jsonError("Product not found", 404);
        }

        // ----------------------------------------
        // Parse query params
        // ----------------------------------------

        const { searchParams } = new URL(request.url);

        const page = parsePage(searchParams.get("page"), 1);
        const limit = parseLimit(searchParams.get("limit"), 10, 50);

        if (page === null) {
            return jsonError("Page must be a positive integer", 400);
        }

        if (limit === null) {
            return jsonError("Limit must be between 1 and 50", 400);
        }

        // ----------------------------------------
        // Optional: current user (for "own review" detection)
        // ----------------------------------------

        const currentUser = await getCurrentUser().catch(() => null);

        // ----------------------------------------
        // Fetch approved reviews (paginated)
        // ----------------------------------------

        const query = {
            product: id,
            status: "approved",
        };

        const skip = (page - 1) * limit;

        const [reviews, totalApproved] = await Promise.all([
            ReviewModel.find(query)
                .populate({ path: "user", select: "name" })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            ReviewModel.countDocuments(query),
        ]);

        // ----------------------------------------
        // Rating distribution (all approved reviews, not just this page)
        // ----------------------------------------

        const allApprovedForStats = await ReviewModel.find({
            product: id,
            status: "approved",
        })
            .select("rating")
            .lean();

        const { distribution, total, average } = buildRatingDistribution(
            allApprovedForStats
        );

        // ----------------------------------------
        // Fetch current user's own review (if logged in)
        // ----------------------------------------
        // Even if it's pending or rejected, we return it so the
        // customer can see the state of their own submission.

        let ownReview = null;

        if (currentUser) {
            const found = await ReviewModel.findOne({
                product: id,
                user: currentUser.id,
            })
                .populate({ path: "user", select: "name" })
                .lean();

            if (found) {
                ownReview = formatReviewForPublic(found, currentUser.id);
            }
        }

        // ----------------------------------------
        // Shape reviews for response
        // ----------------------------------------

        const shapedReviews = reviews.map((review) =>
            formatReviewForPublic(review, currentUser?.id)
        );

        const totalPages = Math.ceil(totalApproved / limit);

        // ----------------------------------------
        // Response
        // ----------------------------------------

        return NextResponse.json(
            {
                success: true,
                reviews: shapedReviews,
                ownReview,
                stats: {
                    average,
                    total,
                    distribution,
                },
                pagination: {
                    page,
                    limit,
                    total: totalApproved,
                    totalPages,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get reviews error:", error);

        return jsonError(
            process.env.NODE_ENV === "development"
                ? error?.message || "Internal server error"
                : "Something went wrong while fetching reviews",
            500
        );
    }
}

// ============================================================
// POST — CREATE REVIEW
// ============================================================

export async function POST(request, { params }) {
    try {
        await connectDB();

        // ----------------------------------------
        // Auth
        // ----------------------------------------

        const user = await getCurrentUser();

        if (!user) {
            return jsonError("You must be logged in to write a review", 401);
        }

        // ----------------------------------------
        // Validate product id
        // ----------------------------------------

        const { id } = await params;

        if (!isValidObjectId(id)) {
            return jsonError("Invalid product ID", 400);
        }

        // ----------------------------------------
        // Ensure product exists
        // ----------------------------------------

        const product = await ProductModel.findById(id).select("_id").lean();

        if (!product) {
            return jsonError("Product not found", 404);
        }

        // ----------------------------------------
        // Parse body
        // ----------------------------------------

        let body;

        try {
            body = await request.json();
        } catch {
            return jsonError("Invalid JSON body", 400);
        }

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return jsonError("Request body must be a JSON object", 400);
        }

        const { rating, title = "", comment } = body;

        // ----------------------------------------
        // Validate rating
        // ----------------------------------------

        const numericRating = Number(rating);

        if (
            !Number.isInteger(numericRating) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return jsonError(
                "Rating must be a whole number between 1 and 5",
                400
            );
        }

        // ----------------------------------------
        // Validate title
        // ----------------------------------------

        let trimmedTitle = "";

        if (title !== undefined && title !== null) {
            if (typeof title !== "string") {
                return jsonError("Title must be a string", 400);
            }

            trimmedTitle = title.trim();

            if (trimmedTitle.length > 100) {
                return jsonError("Title must not exceed 100 characters", 400);
            }
        }

        // ----------------------------------------
        // Validate comment
        // ----------------------------------------

        if (typeof comment !== "string") {
            return jsonError("Comment is required", 400);
        }

        const trimmedComment = comment.trim();

        if (trimmedComment.length < 5) {
            return jsonError("Comment must be at least 5 characters", 400);
        }

        if (trimmedComment.length > 1000) {
            return jsonError("Comment must not exceed 1000 characters", 400);
        }

        // ----------------------------------------
        // Check for existing review
        // ----------------------------------------

        const existing = await ReviewModel.findOne({
            product: id,
            user: user.id,
        })
            .select("_id")
            .lean();

        if (existing) {
            return jsonError(
                "You have already reviewed this product. You can edit your review instead.",
                409
            );
        }

        // ----------------------------------------
        // Auto-compute verified purchase
        // ----------------------------------------

        const verifiedOrder = await findVerifiedOrder(user.id, id);

        // ----------------------------------------
        // Create review
        // ----------------------------------------

        const review = await ReviewModel.create({
            product: id,
            user: user.id,
            rating: numericRating,
            title: trimmedTitle,
            comment: trimmedComment,
            verifiedPurchase: Boolean(verifiedOrder),
            order: verifiedOrder || null,
            status: "pending",
        });

        // ----------------------------------------
        // Populate user for response
        // ----------------------------------------

        await review.populate({ path: "user", select: "name" });

        // ----------------------------------------
        // Response
        // ----------------------------------------

        return NextResponse.json(
            {
                success: true,
                message:
                    "Your review has been submitted and is pending approval. It will appear on the product page once approved.",
                review: formatReviewForPublic(review, user.id),
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create review error:", error);

        // Duplicate key — user already reviewed (race condition)
        if (error?.code === 11000) {
            return jsonError(
                "You have already reviewed this product.",
                409
            );
        }

        if (error?.name === "ValidationError") {
            const firstMessage = Object.values(error.errors || {})[0]?.message;

            return jsonError(
                firstMessage || "Review validation failed",
                400
            );
        }

        if (error?.name === "CastError") {
            return jsonError("Invalid product or user ID", 400);
        }

        return jsonError(
            process.env.NODE_ENV === "development"
                ? error?.message || "Internal server error"
                : "Something went wrong while creating the review",
            500
        );
    }
}