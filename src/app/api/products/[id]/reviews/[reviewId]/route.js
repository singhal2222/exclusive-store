// FILE LOCATION: src/app/api/products/[id]/reviews/[reviewId]/route.js

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

/**
 * Public review shape. Same as the list endpoint.
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
 * Determine whether a user is a verified purchaser of a product.
 * Identical logic to the create endpoint.
 */
async function findVerifiedOrder(userId, productId) {
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

    const item = await OrderItemModel.findOne({
        order: { $in: orderIds },
        product: productId,
    })
        .select("order")
        .lean();

    if (!item) return null;

    return item.order;
}

/**
 * Recalculate and update the product's aggregate rating
 * AND review count.
 *
 * Called after edit/delete operations so the product's
 * rating and reviewCount stay in sync with the approved
 * reviews for that product.
 *
 * Only approved reviews count toward both values.
 *
 * Never throws — errors are logged so the main operation
 * always succeeds.
 */
async function recalculateProductRating(productId) {
    try {
        const objectId = new mongoose.Types.ObjectId(productId);

        const aggregate = await ReviewModel.aggregate([
            {
                $match: {
                    product: objectId,
                    status: "approved",
                },
            },
            {
                $group: {
                    _id: null,
                    average: { $avg: "$rating" },
                    count: { $sum: 1 },
                },
            },
        ]);

        const average = aggregate[0]?.average || 0;
        const count = aggregate[0]?.count || 0;

        const rounded = Number(average.toFixed(1));

        await ProductModel.findByIdAndUpdate(productId, {
            $set: {
                rating: rounded,
                reviewCount: count,
            },
        });
    } catch (error) {
        // Never let rating recalculation fail the main operation.
        console.error("Recalculate product rating error:", error);
    }
}

// ============================================================
// PUT — UPDATE OWN REVIEW
// ============================================================

export async function PUT(request, { params }) {
    try {
        await connectDB();

        // ----------------------------------------
        // Auth
        // ----------------------------------------

        const user = await getCurrentUser();

        if (!user) {
            return jsonError("You must be logged in to edit a review", 401);
        }

        // ----------------------------------------
        // Validate params
        // ----------------------------------------

        const { id, reviewId } = await params;

        if (!isValidObjectId(id)) {
            return jsonError("Invalid product ID", 400);
        }

        if (!isValidObjectId(reviewId)) {
            return jsonError("Invalid review ID", 400);
        }

        // ----------------------------------------
        // Find the review
        // ----------------------------------------

        const review = await ReviewModel.findOne({
            _id: reviewId,
            product: id,
        });

        if (!review) {
            return jsonError("Review not found", 404);
        }

        // ----------------------------------------
        // Ownership check
        // ----------------------------------------

        if (review.user.toString() !== user.id.toString()) {
            return jsonError("You can only edit your own review", 403);
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

        const { rating, title, comment } = body;

        // ----------------------------------------
        // Validate rating
        // ----------------------------------------

        if (rating !== undefined) {
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

            review.rating = numericRating;
        }

        // ----------------------------------------
        // Validate title
        // ----------------------------------------

        if (title !== undefined) {
            if (typeof title !== "string") {
                return jsonError("Title must be a string", 400);
            }

            const trimmedTitle = title.trim();

            if (trimmedTitle.length > 100) {
                return jsonError("Title must not exceed 100 characters", 400);
            }

            review.title = trimmedTitle;
        }

        // ----------------------------------------
        // Validate comment
        // ----------------------------------------

        if (comment !== undefined) {
            if (typeof comment !== "string") {
                return jsonError("Comment must be a string", 400);
            }

            const trimmedComment = comment.trim();

            if (trimmedComment.length < 5) {
                return jsonError("Comment must be at least 5 characters", 400);
            }

            if (trimmedComment.length > 1000) {
                return jsonError("Comment must not exceed 1000 characters", 400);
            }

            review.comment = trimmedComment;
        }

        // ----------------------------------------
        // Recompute verified purchase
        // ----------------------------------------
        // The user's order history may have changed since the
        // original submission.

        const verifiedOrder = await findVerifiedOrder(user.id, id);

        review.verifiedPurchase = Boolean(verifiedOrder);
        review.order = verifiedOrder || null;

        // ----------------------------------------
        // Reset moderation status
        // ----------------------------------------
        // Editing always resets to pending. This is a deliberate
        // safety rule: customers cannot silently edit an approved
        // review into something else.

        review.status = "pending";
        review.editedAt = new Date();

        // Clear previous moderation audit fields so the admin
        // moderates fresh.
        review.approvedAt = null;
        review.approvedBy = null;
        review.rejectedAt = null;
        review.rejectedBy = null;
        review.adminNote = "";

        // ----------------------------------------
        // Save (runs pre-validate hook)
        // ----------------------------------------

        await review.save();

        // ----------------------------------------
        // Recalculate product rating + review count
        // ----------------------------------------
        // The review was previously approved (possibly) and is now
        // pending. It should no longer count toward the rating or
        // the review count.

        await recalculateProductRating(id);

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
                    "Your review has been updated and is pending approval. It will reappear on the product page once approved.",
                review: formatReviewForPublic(review, user.id),
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Update review error:", error);

        if (error?.name === "ValidationError") {
            const firstMessage = Object.values(error.errors || {})[0]?.message;

            return jsonError(firstMessage || "Review validation failed", 400);
        }

        if (error?.name === "CastError") {
            return jsonError("Invalid product or review ID", 400);
        }

        return jsonError(
            process.env.NODE_ENV === "development"
                ? error?.message || "Internal server error"
                : "Something went wrong while updating the review",
            500
        );
    }
}

// ============================================================
// DELETE — DELETE OWN REVIEW
// ============================================================

export async function DELETE(request, { params }) {
    try {
        await connectDB();

        // ----------------------------------------
        // Auth
        // ----------------------------------------

        const user = await getCurrentUser();

        if (!user) {
            return jsonError("You must be logged in to delete a review", 401);
        }

        // ----------------------------------------
        // Validate params
        // ----------------------------------------

        const { id, reviewId } = await params;

        if (!isValidObjectId(id)) {
            return jsonError("Invalid product ID", 400);
        }

        if (!isValidObjectId(reviewId)) {
            return jsonError("Invalid review ID", 400);
        }

        // ----------------------------------------
        // Find the review
        // ----------------------------------------

        const review = await ReviewModel.findOne({
            _id: reviewId,
            product: id,
        });

        if (!review) {
            return jsonError("Review not found", 404);
        }

        // ----------------------------------------
        // Ownership check
        // ----------------------------------------

        if (review.user.toString() !== user.id.toString()) {
            return jsonError("You can only delete your own review", 403);
        }

        // ----------------------------------------
        // Track whether this review was approved
        // ----------------------------------------
        // Only approved reviews affect the product's average rating
        // and review count, so we only need to recompute if this
        // was approved.

        const wasApproved = review.status === "approved";

        // ----------------------------------------
        // Delete
        // ----------------------------------------

        await review.deleteOne();

        // ----------------------------------------
        // Recalculate product rating + review count if needed
        // ----------------------------------------

        if (wasApproved) {
            await recalculateProductRating(id);
        }

        // ----------------------------------------
        // Response
        // ----------------------------------------

        return NextResponse.json(
            {
                success: true,
                message: "Your review has been deleted.",
                deletedReviewId: reviewId,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Delete review error:", error);

        if (error?.name === "CastError") {
            return jsonError("Invalid product or review ID", 400);
        }

        return jsonError(
            process.env.NODE_ENV === "development"
                ? error?.message || "Internal server error"
                : "Something went wrong while deleting the review",
            500
        );
    }
}