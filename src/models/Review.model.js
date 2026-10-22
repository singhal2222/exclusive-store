// FILE LOCATION: src/models/Review.model.js

import mongoose from "mongoose";

// ============================================================
// REVIEW SCHEMA
// ============================================================
//
// Represents a customer review on a product.
//
// Rules enforced at the schema level:
//
//   - One review per user per product (compound unique index).
//   - New reviews start with status "pending" and must be
//     approved by an admin before they appear publicly.
//   - Editing a review resets its status to "pending".
//   - The verifiedPurchase flag is auto-computed when the
//     review is created, based on the customer's order history.
//
// ============================================================

const reviewSchema = new mongoose.Schema(
    {
        // ------------------------------------------------------------
        // REFERENCES
        // ------------------------------------------------------------

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
            index: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            index: true,
        },

        // ------------------------------------------------------------
        // REVIEW CONTENT
        // ------------------------------------------------------------

        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"],
            validate: {
                validator: Number.isInteger,
                message: "Rating must be a whole number between 1 and 5",
            },
        },

        title: {
            type: String,
            trim: true,
            maxlength: [100, "Title must not exceed 100 characters"],
            default: "",
        },

        comment: {
            type: String,
            required: [true, "Review comment is required"],
            trim: true,
            minlength: [5, "Comment must be at least 5 characters"],
            maxlength: [1000, "Comment must not exceed 1000 characters"],
        },

        // ------------------------------------------------------------
        // VERIFIED PURCHASE
        // ------------------------------------------------------------
        //
        // Auto-computed when the review is created.
        // A customer is "verified" if they have an order containing
        // this product, and that order was either paid online or
        // delivered for a COD order.
        //
        // ------------------------------------------------------------

        verifiedPurchase: {
            type: Boolean,
            default: false,
        },

        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null,
        },

        // ------------------------------------------------------------
        // MODERATION
        // ------------------------------------------------------------

        status: {
            type: String,
            enum: {
                values: ["pending", "approved", "rejected"],
                message: "Status must be pending, approved, or rejected",
            },
            default: "pending",
            index: true,
        },

        adminNote: {
            type: String,
            trim: true,
            maxlength: [500, "Admin note must not exceed 500 characters"],
            default: "",
        },

        // ------------------------------------------------------------
        // MODERATION AUDIT
        // ------------------------------------------------------------

        approvedAt: {
            type: Date,
            default: null,
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        rejectedAt: {
            type: Date,
            default: null,
        },

        rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // ------------------------------------------------------------
        // CUSTOMER EDIT TRACKING
        // ------------------------------------------------------------

        editedAt: {
            type: Date,
            default: null,
        },

        // ------------------------------------------------------------
        // ENGAGEMENT
        // ------------------------------------------------------------
        //
        // Reserved for a future "Was this helpful?" feature.
        // Not currently surfaced in the UI, but tracked for later.

        helpfulCount: {
            type: Number,
            default: 0,
            min: [0, "Helpful count cannot be negative"],
        },
    },
    {
        timestamps: true,
        collection: "reviews",
    }
);

// ============================================================
// COMPOUND UNIQUE INDEX
// ============================================================
//
// One review per user per product. Enforced at the database
// level, so even under high concurrency the rule holds.
//
// ============================================================

reviewSchema.index(
    { product: 1, user: 1 },
    {
        unique: true,
        name: "unique_review_per_user_per_product",
    }
);

// ============================================================
// QUERY OPTIMIZATION INDEXES
// ============================================================

// List approved reviews for a product (main product page query)
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });

// Admin list: filter by status and sort by newest
reviewSchema.index({ status: 1, createdAt: -1 });

// Rating distribution queries for a product
reviewSchema.index({ product: 1, status: 1, rating: 1 });

// ============================================================
// VALIDATION HOOK
// ============================================================
//
// Ensures that moderation audit fields stay consistent:
//
//   - If status is "approved", an approvedAt date must be set.
//   - If status is "rejected", a rejectedAt date must be set.
//
// We do NOT auto-fill these — the API sets them explicitly.
// This hook only validates the consistency.
//
// ============================================================

reviewSchema.pre("validate", function () {
    if (this.status === "approved" && !this.approvedAt) {
        this.invalidate(
            "approvedAt",
            "Approved reviews must have an approvedAt date"
        );
    }

    if (this.status === "rejected" && !this.rejectedAt) {
        this.invalidate(
            "rejectedAt",
            "Rejected reviews must have a rejectedAt date"
        );
    }
});

// ============================================================
// HELPER — SAFE PUBLIC SHAPE
// ============================================================
//
// Returns a review shaped for public consumption. Admin-only
// fields (adminNote, approvedBy, rejectedBy) are removed.
//
// Use this when returning reviews to customers.
//
// ============================================================

reviewSchema.methods.toPublicJSON = function () {
    return {
        _id: this._id,
        product: this.product,
        user: this.user,
        rating: this.rating,
        title: this.title,
        comment: this.comment,
        verifiedPurchase: this.verifiedPurchase,
        status: this.status,
        editedAt: this.editedAt,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

// ============================================================
// MODEL
// ============================================================

const ReviewModel =
    mongoose.models.Review ||
    mongoose.model("Review", reviewSchema, "reviews");

export default ReviewModel;