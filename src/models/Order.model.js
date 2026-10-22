import mongoose from "mongoose";

// ============================================================
// SHIPPING ADDRESS SNAPSHOT
// ============================================================

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: 50,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    addressLine1: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      maxlength: 150,
    },

    addressLine2: {
      type: String,
      trim: true,
      default: "",
      maxlength: 150,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: 100,
    },

    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxlength: 100,
    },

    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
      trim: true,
    },

    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      default: "India",
    },
  },
  {
    _id: false,
  }
);

// ============================================================
// SHIPPING DETAILS
// ============================================================

const shippingDetailsSchema = new mongoose.Schema(
  {
    carrier: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    trackingNumber: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    trackingUrl: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    estimatedDeliveryDate: {
      type: Date,
      default: null,
    },

    shippedAt: {
      type: Date,
      default: null,
    },

    outForDeliveryAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

// ============================================================
// TRACKING EVENT
// ============================================================

const trackingEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: [true, "Tracking event status is required"],
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
    },

    title: {
      type: String,
      required: [true, "Tracking event title is required"],
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },

    location: {
      type: String,
      trim: true,
      default: "",
      maxlength: 150,
    },

    timestamp: {
      type: Date,
      required: [true, "Tracking event timestamp is required"],
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

// ============================================================
// POS METADATA (only used when source === "pos")
// ============================================================

const posMetadataSchema = new mongoose.Schema(
  {
    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cashierName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    walkInCustomer: {
      type: Boolean,
      default: false,
    },

    customerName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    customerPhone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", null],
      default: null,
    },

    totalWholesaleDiscount: {
      type: Number,
      default: 0,
      min: [0, "Wholesale discount cannot be negative"],
    },

    billNumber: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

// ============================================================
// ORDER SCHEMA
// ============================================================

const orderSchema = new mongoose.Schema(
  {
    // ========================================================
    // USER (nullable for POS walk-in sales)
    // ========================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // ========================================================
    // ORDER SOURCE
    // ========================================================

    source: {
      type: String,
      enum: ["online", "pos"],
      default: "online",
      index: true,
    },

    // ========================================================
    // CUSTOMER TYPE (POS only)
    // ========================================================

    customerType: {
      type: String,
      enum: ["retail", "wholesale", null],
      default: null,
    },

    // ========================================================
    // ORDER NUMBER
    // ========================================================

    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      trim: true,
      index: true,
    },

    // ========================================================
    // SHIPPING ADDRESS (optional for POS)
    // ========================================================

    shippingAddress: {
      type: shippingAddressSchema,
      required: function () {
        return this.source === "online";
      },
    },

    // ========================================================
    // PRICING
    // ========================================================

    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },

    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },

    shipping: {
      type: Number,
      default: 0,
      min: [0, "Shipping charge cannot be negative"],
    },

    total: {
      type: Number,
      required: [true, "Total is required"],
      min: [0, "Total cannot be negative"],
    },

    // ========================================================
    // COUPON
    // ========================================================

    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },

    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    // ========================================================
    // PAYMENT METHOD
    // ========================================================

    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["razorpay", "cod", "cash", "card", "upi"],
    },

    // ========================================================
    // PAYMENT STATUS
    // ========================================================

    paymentStatus: {
      type: String,
      required: true,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    // ========================================================
    // ORDER STATUS
    // ========================================================

    orderStatus: {
      type: String,
      required: true,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    // ========================================================
    // SHIPPING DETAILS
    // ========================================================

    shippingDetails: {
      type: shippingDetailsSchema,
      default: () => ({}),
    },

    // ========================================================
    // TRACKING TIMELINE
    // ========================================================

    trackingEvents: {
      type: [trackingEventSchema],
      default: [],
    },

    // ========================================================
    // RAZORPAY DETAILS
    // ========================================================

    razorpayOrderId: {
      type: String,
      trim: true,
      default: "",
    },

    razorpayPaymentId: {
      type: String,
      trim: true,
      default: "",
    },

    razorpaySignature: {
      type: String,
      trim: true,
      default: "",
    },

    // ========================================================
    // PAYMENT DATE
    // ========================================================

    paidAt: {
      type: Date,
      default: null,
    },

    // ========================================================
    // ORDER CANCELLATION
    // ========================================================

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },

    // ========================================================
    // POS METADATA
    // ========================================================

    posMetadata: {
      type: posMetadataSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// INDEXES
// ============================================================

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ paymentMethod: 1 });
orderSchema.index({ source: 1, createdAt: -1 });
orderSchema.index({ "shippingDetails.trackingNumber": 1 });

// ============================================================
// MODEL
// ============================================================

const OrderModel =
  mongoose.models.Order || mongoose.model("Order", orderSchema, "orders");

export default OrderModel;