import mongoose from "mongoose";

// ============================================================
// CART ITEM SCHEMA
// ============================================================

const cartItemSchema = new mongoose.Schema(
  {
    // Product reference
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },

    // Product quantity
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },

    // Product price
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
  },
  {
    _id: true,
  }
);

// ============================================================
// CART SCHEMA
// ============================================================

const cartSchema = new mongoose.Schema(
  {
    // ========================================================
    // USER
    // ========================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      unique: true,
      index: true,
    },

    // ========================================================
    // CART ITEMS
    // ========================================================

    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// CART MODEL
// ============================================================

const CartModel =
  mongoose.models.Cart ||
  mongoose.model("Cart", cartSchema, "carts");

// ============================================================
// EXPORT
// ============================================================

export default CartModel;