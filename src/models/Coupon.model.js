import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------
    // COUPON CODE
    // ------------------------------------------------------------

    code: {
      type: String,
      required: [true, "Coupon code is required"],
      trim: true,
      uppercase: true,
      unique: true,
      minlength: [3, "Coupon code must be at least 3 characters"],
      maxlength: [30, "Coupon code must not exceed 30 characters"],
    },

    // ------------------------------------------------------------
    // COUPON TYPE
    // ------------------------------------------------------------

    couponType: {
      type: String,
      enum: ["general", "welcome"],
      default: "general",
      index: true,
    },

    // ------------------------------------------------------------
    // DISCOUNT TYPE
    // ------------------------------------------------------------

    discountType: {
      type: String,
      required: [true, "Discount type is required"],
      enum: ["percentage", "fixed"],
    },

    // ------------------------------------------------------------
    // DISCOUNT VALUE
    // ------------------------------------------------------------

    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },

    // ------------------------------------------------------------
    // MINIMUM ORDER AMOUNT
    // ------------------------------------------------------------

    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be negative"],
    },

    // ------------------------------------------------------------
    // MAXIMUM DISCOUNT
    // ------------------------------------------------------------

    maximumDiscount: {
      type: Number,
      default: null,
      min: [0, "Maximum discount cannot be negative"],
    },

    // ------------------------------------------------------------
    // EXPIRY DATE
    // ------------------------------------------------------------

    expiryDate: {
      type: Date,
      default: null,
    },

    // ------------------------------------------------------------
    // USAGE LIMIT
    // ------------------------------------------------------------

    usageLimit: {
      type: Number,
      default: null,
      min: [1, "Usage limit must be at least 1"],
    },

    // ------------------------------------------------------------
    // USED COUNT
    // ------------------------------------------------------------

    usedCount: {
      type: Number,
      default: 0,
      min: [0, "Used count cannot be negative"],
    },

    // ------------------------------------------------------------
    // COUPON ACTIVE STATUS
    // ------------------------------------------------------------

    isActive: {
      type: Boolean,
      default: true,
    },

    // ------------------------------------------------------------
    // OWNER EMAIL
    // ------------------------------------------------------------
    // Used especially for welcome coupons.
    // Stored in lowercase so email comparisons are consistent.

    ownerEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
      maxlength: [100, "Owner email must not exceed 100 characters"],
      index: true,
    },

    // ------------------------------------------------------------
    // ASSIGNED USER
    // ------------------------------------------------------------
    // Once the subscriber creates/logs into an account,
    // the welcome coupon can be associated with that user.

    assignedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // ------------------------------------------------------------
    // REDEEMED STATUS
    // ------------------------------------------------------------

    redeemed: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ------------------------------------------------------------
    // REDEEMED AT
    // ------------------------------------------------------------

    redeemedAt: {
      type: Date,
      default: null,
    },

    // ------------------------------------------------------------
    // REDEEMED BY
    // ------------------------------------------------------------

    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ------------------------------------------------------------
    // REDEEMED ORDER
    // ------------------------------------------------------------

    redeemedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ------------------------------------------------------------
// VALIDATION
// ------------------------------------------------------------

couponSchema.pre("validate", function () {
  // Percentage discount should be between 0 and 100
  if (
    this.discountType === "percentage" &&
    this.discountValue > 100
  ) {
    this.invalidate(
      "discountValue",
      "Percentage discount cannot exceed 100"
    );
  }

  // Fixed discount should not be negative
  if (
    this.discountType === "fixed" &&
    this.discountValue < 0
  ) {
    this.invalidate(
      "discountValue",
      "Fixed discount cannot be negative"
    );
  }

  // Usage limit cannot be smaller than used count
  if (
    this.usageLimit !== null &&
    this.usageLimit !== undefined &&
    this.usedCount > this.usageLimit
  ) {
    this.invalidate(
      "usedCount",
      "Used count cannot exceed usage limit"
    );
  }

  // Redeemed coupon should have redemption information
  if (this.redeemed) {
    if (!this.redeemedAt) {
      this.invalidate(
        "redeemedAt",
        "Redeemed coupon must have a redemption date"
      );
    }

    if (!this.redeemedBy) {
      this.invalidate(
        "redeemedBy",
        "Redeemed coupon must have a redeeming user"
      );
    }

    if (!this.redeemedOrder) {
      this.invalidate(
        "redeemedOrder",
        "Redeemed coupon must have a redeeming order"
      );
    }
  }

  // Welcome coupons must belong to an email
  if (
    this.couponType === "welcome" &&
    !this.ownerEmail
  ) {
    this.invalidate(
      "ownerEmail",
      "Welcome coupon must have an owner email"
    );
  }
});

// ------------------------------------------------------------
// INDEX
// ------------------------------------------------------------

couponSchema.index(
  { code: 1 },
  { unique: true }
);

couponSchema.index({
  couponType: 1,
  ownerEmail: 1,
});

couponSchema.index({
  assignedUser: 1,
  couponType: 1,
});

const CouponModel =
  mongoose.models.Coupon ||
  mongoose.model(
    "Coupon",
    couponSchema,
    "coupons"
  );

export default CouponModel;