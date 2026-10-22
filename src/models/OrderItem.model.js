import mongoose from "mongoose";

// ============================================================
// ORDER ITEM SCHEMA
// ============================================================

const orderItemSchema = new mongoose.Schema(
  {
    // ========================================================
    // ORDER
    // ========================================================

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
    },

    // ========================================================
    // PRODUCT
    // ========================================================

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },

    // ========================================================
    // PRODUCT SNAPSHOT
    // ========================================================

    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 150,
    },

    productImage: {
      type: String,
      trim: true,
      default: "",
    },

    // ========================================================
    // PRICE SNAPSHOT
    // ========================================================

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Product price cannot be negative"],
    },

    // ========================================================
    // QUANTITY
    // ========================================================

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },

    // ========================================================
    // ITEM SUBTOTAL (after wholesale discount if any)
    // ========================================================

    subtotal: {
      type: Number,
      required: [true, "Item subtotal is required"],
      min: [0, "Item subtotal cannot be negative"],
    },

    // ========================================================
    // POS / WHOLESALE FIELDS
    // ========================================================

    mrp: {
      type: Number,
      default: null,
      min: [0, "MRP cannot be negative"],
    },

    wholesaleDiscountPercentage: {
      type: Number,
      default: 0,
      min: [0, "Wholesale discount % cannot be negative"],
      max: [100, "Wholesale discount % cannot exceed 100"],
    },

    wholesaleDiscountAmount: {
      type: Number,
      default: 0,
      min: [0, "Wholesale discount amount cannot be negative"],
    },

    // Final per-unit price actually charged (after wholesale discount)
    unitPrice: {
      type: Number,
      default: null,
      min: [0, "Unit price cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// INDEXES
// ============================================================

orderItemSchema.index({ order: 1 });
orderItemSchema.index({ product: 1 });

// ============================================================
// MODEL
// ============================================================

const OrderItemModel =
  mongoose.models.OrderItem ||
  mongoose.model("OrderItem", orderItemSchema, "orderItems");

export default OrderItemModel;