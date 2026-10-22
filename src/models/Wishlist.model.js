import mongoose from "mongoose";

// ============================================================
// WISHLIST SCHEMA
// ============================================================

const wishlistSchema = new mongoose.Schema(
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
    // PRODUCTS
    // ========================================================

    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ============================================================
// WISHLIST MODEL
// ============================================================

const WishlistModel =
  mongoose.models.Wishlist ||
  mongoose.model(
    "Wishlist",
    wishlistSchema,
    "wishlists"
  );

// ============================================================
// EXPORT
// ============================================================

export default WishlistModel;