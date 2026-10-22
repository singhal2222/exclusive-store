import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import WishlistModel from "@/models/Wishlist.model";
import Product from "@/models/Product.model";

// ============================================================
// GET WISHLIST
// ============================================================

export async function GET() {
  try {
    // --------------------------------------------------------
    // CHECK AUTHENTICATION
    // --------------------------------------------------------

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------------
    // CONNECT DATABASE
    // --------------------------------------------------------

    await connectDB();

    // --------------------------------------------------------
    // FIND USER WISHLIST
    // --------------------------------------------------------

    const wishlist = await WishlistModel.findOne({
      user: currentUser.id,
    }).populate({
      path: "products",
      match: { isActive: true },
    });

    // --------------------------------------------------------
    // WISHLIST DOES NOT EXIST
    // --------------------------------------------------------

    if (!wishlist) {
      return NextResponse.json(
        {
          success: true,
          message: "Wishlist is empty.",
          wishlist: {
            user: currentUser.id,
            products: [],
          },
        },
        { status: 200 }
      );
    }

    // --------------------------------------------------------
    // RETURN WISHLIST
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        wishlist,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get wishlist error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while fetching the wishlist.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// ADD PRODUCT TO WISHLIST
// ============================================================

export async function POST(request) {
  try {
    // --------------------------------------------------------
    // CHECK AUTHENTICATION
    // --------------------------------------------------------

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------------
    // READ REQUEST BODY
    // --------------------------------------------------------

    const body = await request.json();
    const productId = body?.productId;

    // --------------------------------------------------------
    // VALIDATE PRODUCT ID
    // --------------------------------------------------------

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // CONNECT DATABASE
    // --------------------------------------------------------

    await connectDB();

    // --------------------------------------------------------
    // FIND ACTIVE PRODUCT
    // --------------------------------------------------------

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found or unavailable.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // FIND OR CREATE WISHLIST
    // --------------------------------------------------------

    let wishlist = await WishlistModel.findOne({
      user: currentUser.id,
    });

    // --------------------------------------------------------
    // CREATE WISHLIST
    // --------------------------------------------------------

    if (!wishlist) {
      wishlist = await WishlistModel.create({
        user: currentUser.id,
        products: [product._id],
      });
    } else {
      // ------------------------------------------------------
      // CHECK WHETHER PRODUCT ALREADY EXISTS
      // ------------------------------------------------------

      const alreadyExists = wishlist.products.some(
        (wishlistProductId) =>
          wishlistProductId.toString() === productId.toString()
      );

      if (alreadyExists) {
        return NextResponse.json(
          {
            success: false,
            message: "Product is already in your wishlist.",
          },
          { status: 409 }
        );
      }

      // ------------------------------------------------------
      // ADD PRODUCT
      // ------------------------------------------------------

      wishlist.products.push(product._id);

      await wishlist.save();
    }

    // --------------------------------------------------------
    // GET UPDATED WISHLIST
    // --------------------------------------------------------

    const updatedWishlist =
      await WishlistModel.findOne({
        user: currentUser.id,
      }).populate({
        path: "products",
        match: { isActive: true },
      });

    // --------------------------------------------------------
    // RETURN RESPONSE
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Product added to wishlist successfully.",
        wishlist: updatedWishlist,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Add to wishlist error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while adding the product to wishlist.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// REMOVE PRODUCT FROM WISHLIST
// ============================================================

export async function DELETE(request) {
  try {
    // --------------------------------------------------------
    // CHECK AUTHENTICATION
    // --------------------------------------------------------

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------------
    // READ REQUEST BODY
    // --------------------------------------------------------

    const body = await request.json();
    const productId = body?.productId;

    // --------------------------------------------------------
    // VALIDATE PRODUCT ID
    // --------------------------------------------------------

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // CONNECT DATABASE
    // --------------------------------------------------------

    await connectDB();

    // --------------------------------------------------------
    // FIND WISHLIST
    // --------------------------------------------------------

    const wishlist = await WishlistModel.findOne({
      user: currentUser.id,
    });

    if (!wishlist) {
      return NextResponse.json(
        {
          success: false,
          message: "Wishlist not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // CHECK PRODUCT EXISTS IN WISHLIST
    // --------------------------------------------------------

    const productExists = wishlist.products.some(
      (wishlistProductId) =>
        wishlistProductId.toString() === productId.toString()
    );

    if (!productExists) {
      return NextResponse.json(
        {
          success: false,
          message: "Product is not in your wishlist.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // REMOVE PRODUCT
    // --------------------------------------------------------

    wishlist.products = wishlist.products.filter(
      (wishlistProductId) =>
        wishlistProductId.toString() !== productId.toString()
    );

    await wishlist.save();

    // --------------------------------------------------------
    // GET UPDATED WISHLIST
    // --------------------------------------------------------

    const updatedWishlist =
      await WishlistModel.findOne({
        user: currentUser.id,
      }).populate({
        path: "products",
        match: { isActive: true },
      });

    // --------------------------------------------------------
    // RETURN RESPONSE
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Product removed from wishlist successfully.",
        wishlist: updatedWishlist,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Remove wishlist item error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while removing the product from wishlist.",
      },
      { status: 500 }
    );
  }
}