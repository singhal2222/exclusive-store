// FILE LOCATION: src/app/api/admin/reviews/[id]/route.js

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

/**
 * Full admin shape (same as list endpoint).
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

/**
 * Recalculate the product's aggregate rating AND review count
 * based on approved reviews only, then update the product.
 *
 * Never throws — errors are logged so the main operation
 * always succeeds.
 */
async function recalculateProductRating(productId) {
    if (!productId) return;

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
        console.error("Recalculate product rating error:", error);
    }
}

// ============================================================
// AUTH GUARD
// ============================================================

async function requireAdmin() {
    const user = await getCurrentUser();

    if (!user) {
        return { error: jsonError("Authentication required", 401) };
    }

    if (user.role !== "admin") {
        return { error: jsonError("Admin access required", 403) };
    }

    return { user };
}

// ============================================================
// GET — FETCH ONE REVIEW (ADMIN)
// ============================================================

export async function GET(request, { params }) {
    try {
        const auth = await requireAdmin();
        if (auth.error) return auth.error;

        const { id } = await params;

        if (!isValidObjectId(id)) {
            return jsonError("Invalid review ID", 400);
        }

        await connectDB();

        const review = await ReviewModel.findById(id)
            .populate({ path: "user", select: "name email" })
            .populate({ path: "product", select: "name image slug" })
            .lean();

        if (!review) {
            return jsonError("Review not found", 404);
        }

        return NextResponse.json(
            {
                success: true,
                review: formatReviewForAdmin(review),
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Admin get review error:", error);

        return jsonError(
            process.env.NODE_ENV === "development"
                ? error?.message || "Internal server error"
                : "Something went wrong while fetching the review",
            500
        );
    }
}

// ============================================================
// PATCH — CHANGE STATUS (APPROVE / REJECT / RESET)
// ============================================================
//
// Body: { status: "approved" | "rejected" | "pending" }
//
// Admin-only. Performs the status change, updates audit
// fields, and recalculates the product's rating + review count.
//
// ============================================================

export async function PATCH(request, { params }) {
    try {
        const auth = await requireAdmin();
        if (auth.error) return auth.error;

        const adminId = auth.user.id;

        const { id } = await params;

        if (!isValidObjectId(id)) {
            return jsonError("Invalid review ID", 400);
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

        const status = String(body.status || "").toLowerCase().trim();

        if (!["approved", "rejected", "pending"].includes(status)) {
            return jsonError(
                "Status must be approved, rejected, or pending",
                400
            );
        }

        await connectDB();

        // ----------------------------------------
        // Find review
        // ----------------------------------------

        const review = await ReviewModel.findById(id);

        if (!review) {
            return jsonError("Review not found", 404);
        }

        // ----------------------------------------
        // Skip if already in the target state
        // ----------------------------------------

        if (review.status === status) {
            // Reload with populations for consistent response shape
            await review.populate({ path: "user", select: "name email" });
            await review.populate({ path: "product", select: "name image slug" });

            return NextResponse.json(
                {
                    success: true,
                    message: `Review is already ${status}.`,
                    review: formatReviewForAdmin(review.toObject()),
                },
                { status: 200 }
            );
        }

        // ----------------------------------------
        // Update status + audit fields
        // ----------------------------------------

        const now = new Date();

        if (status === "approved") {
            review.status = "approved";
            review.approvedAt = now;
            review.approvedBy = adminId;

            // Clear rejection data if previously rejected
            review.rejectedAt = null;
            review.rejectedBy = null;
        } else if (status === "rejected") {
            review.status = "rejected";
            review.rejectedAt = now;
            review.rejectedBy = adminId;

            // Clear approval data if previously approved
            review.approvedAt = null;
            review.approvedBy = null;
        } else {
            // Reset to pending — clear both audit trails
            review.status = "pending";
            review.approvedAt = null;
            review.approvedBy = null;
            review.rejectedAt = null;
            review.rejectedBy = null;
        }

        // ----------------------------------------
        // Save
        // ----------------------------------------
        // Note: pre("validate") on the model checks that
        // approvedAt / rejectedAt are set correctly for the
        // corresponding status. We always set them, so this
        // passes.

        await review.save();

        // ----------------------------------------
        // Recalculate product rating + review count
        // ----------------------------------------
        // Any status change affects what counts as "approved"
        // reviews for the product.

        await recalculateProductRating(review.product);

        // ----------------------------------------
        // Populate for response
        // ----------------------------------------

        await review.populate({ path: "user", select: "name email" });
        await review.populate({ path: "product", select: "name image slug" });

        // ----------------------------------------
        // Response
        // ----------------------------------------

        const messageMap = {
            approved: "Review approved successfully.",
            rejected: "Review rejected successfully.",
            pending: "Review moved back to pending.",
        };

        return NextResponse.json(
            {
                success: true,
                message: messageMap[status],
                review: formatReviewForAdmin(review.toObject()),
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Admin update review status error:", error);

        if (error?.name === "ValidationError") {
            const firstMessage = Object.values(error.errors || {})[0]?.message;

            return jsonError(firstMessage || "Review validation failed", 400);
        }

        if (error?.name === "CastError") {
            return jsonError("Invalid review ID", 400);
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
// PUT — UPDATE ADMIN NOTE
// ============================================================
//
// Body: { adminNote: "..." }
//
// Internal note visible only to admins. Never shown to the
// customer or on the storefront.
//
// ============================================================

export async function PUT(request, { params }) {
    try {
        const auth = await requireAdmin();
        if (auth.error) return auth.error;

        const { id } = await params;

        if (!isValidObjectId(id)) {
            return jsonError("Invalid review ID", 400);
        }

        let body;

        try {
            body = await request.json();
        } catch {
            return jsonError("Invalid JSON body", 400);
        }

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return jsonError("Request body must be a JSON object", 400);
        }

        const { adminNote } = body;

        if (adminNote !== undefined && typeof adminNote !== "string") {
            return jsonError("Admin note must be a string", 400);
        }

        const trimmedNote = (adminNote || "").trim();

        if (trimmedNote.length > 500) {
            return jsonError(
                "Admin note must not exceed 500 characters",
                400
            );
        }

        await connectDB();

        const review = await ReviewModel.findById(id);

        if (!review) {
            return jsonError("Review not found", 404);
        }

        review.adminNote = trimmedNote;

        await review.save();

        await review.populate({ path: "user", select: "name email" });
        await review.populate({ path: "product", select: "name image slug" });

        return NextResponse.json(
            {
                success: true,
                message: "Admin note updated.",
                review: formatReviewForAdmin(review.toObject()),
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Admin update review note error:", error);

        if (error?.name === "ValidationError") {
            const firstMessage = Object.values(error.errors || {})[0]?.message;

            return jsonError(firstMessage || "Validation failed", 400);
        }

        if (error?.name === "CastError") {
            return jsonError("Invalid review ID", 400);
        }

        return jsonError(
            process.env.NODE_ENV === "development"
                ? error?.message || "Internal server error"
                : "Something went wrong while updating the admin note",
            500
        );
    }
}

// ============================================================
// DELETE — PERMANENTLY DELETE A REVIEW
// ============================================================

export async function DELETE(request, { params }) {
    try {
        const auth = await requireAdmin();
        if (auth.error) return auth.error;

        const { id } = await params;

        if (!isValidObjectId(id)) {
            return jsonError("Invalid review ID", 400);
        }

        await connectDB();

        const review = await ReviewModel.findById(id);

        if (!review) {
            return jsonError("Review not found", 404);
        }

        // Capture the product id before deletion
        const productId = review.product;

        // ----------------------------------------
        // Delete
        // ----------------------------------------

        await review.deleteOne();

        // ----------------------------------------
        // Recalculate product rating + review count
        // ----------------------------------------
        // A deleted approved review must no longer count toward
        // the product's average rating or review count.

        await recalculateProductRating(productId);

        // ----------------------------------------
        // Response
        // ----------------------------------------

        return NextResponse.json(
            {
                success: true,
                message: "Review deleted successfully.",
                deletedReviewId: id,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Admin delete review error:", error);

        if (error?.name === "CastError") {
            return jsonError("Invalid review ID", 400);
        }

        return jsonError(
            process.env.NODE_ENV === "development"
                ? error?.message || "Internal server error"
                : "Something went wrong while deleting the review",
            500
        );
    }
}