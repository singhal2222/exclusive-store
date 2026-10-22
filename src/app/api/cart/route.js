import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import CartModel from "@/models/Cart.model";
import Product from "@/models/Product.model";

// ============================================================
// GET CART
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
    // FIND USER CART
    // --------------------------------------------------------

    const cart = await CartModel.findOne({
      user: currentUser.id,
    }).populate("items.product");

    // --------------------------------------------------------
    // CART DOES NOT EXIST
    // --------------------------------------------------------

    if (!cart) {
      return NextResponse.json(
        {
          success: true,
          message: "Cart is empty.",
          cart: {
            user: currentUser.id,
            items: [],
          },
        },
        { status: 200 }
      );
    }

    // --------------------------------------------------------
    // RETURN CART
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        cart,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get cart error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching the cart.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// ADD PRODUCT TO CART
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
    const requestedQuantity = Number(body?.quantity ?? 1);

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
    // VALIDATE QUANTITY
    // --------------------------------------------------------

    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be a positive whole number.",
        },
        { status: 400 }
      );
    }

    if (requestedQuantity > 99) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity cannot exceed 99.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // CONNECT DATABASE
    // --------------------------------------------------------

    await connectDB();

    // --------------------------------------------------------
    // FIND PRODUCT
    // --------------------------------------------------------

    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // VALIDATE PRODUCT PRICE
    // --------------------------------------------------------

    if (
      typeof product.price !== "number" ||
      product.price < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Product price is invalid.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // FIND EXISTING CART
    // --------------------------------------------------------

    let cart = await CartModel.findOne({
      user: currentUser.id,
    });

    // --------------------------------------------------------
    // CREATE CART
    // --------------------------------------------------------

    if (!cart) {
      cart = await CartModel.create({
        user: currentUser.id,
        items: [
          {
            product: product._id,
            quantity: requestedQuantity,
            price: product.price,
          },
        ],
      });
    } else {
      // ------------------------------------------------------
      // CHECK EXISTING PRODUCT
      // ------------------------------------------------------

      const existingItem = cart.items.find(
        (item) =>
          item.product.toString() ===
          product._id.toString()
      );

      // ------------------------------------------------------
      // PRODUCT ALREADY EXISTS
      // ------------------------------------------------------

      if (existingItem) {
        const newQuantity =
          existingItem.quantity + requestedQuantity;

        if (newQuantity > 99) {
          return NextResponse.json(
            {
              success: false,
              message: "Total quantity cannot exceed 99.",
            },
            { status: 400 }
          );
        }

        existingItem.quantity = newQuantity;

        // Always use the current server-side price
        existingItem.price = product.price;
      }

      // ------------------------------------------------------
      // NEW PRODUCT
      // ------------------------------------------------------

      else {
        cart.items.push({
          product: product._id,
          quantity: requestedQuantity,
          price: product.price,
        });
      }

      await cart.save();
    }

    // --------------------------------------------------------
    // GET UPDATED CART
    // --------------------------------------------------------

    const updatedCart = await CartModel.findOne({
      user: currentUser.id,
    }).populate("items.product");

    // --------------------------------------------------------
    // RETURN RESPONSE
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Product added to cart successfully.",
        cart: updatedCart,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Add to cart error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while adding the product to cart.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// UPDATE CART QUANTITY
// ============================================================

export async function PATCH(request) {
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
    const quantity = Number(body?.quantity);

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
    // VALIDATE QUANTITY
    // --------------------------------------------------------

    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be at least 1.",
        },
        { status: 400 }
      );
    }

    if (quantity > 99) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity cannot exceed 99.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // CONNECT DATABASE
    // --------------------------------------------------------

    await connectDB();

    // --------------------------------------------------------
    // FIND CART
    // --------------------------------------------------------

    const cart = await CartModel.findOne({
      user: currentUser.id,
    });

    if (!cart) {
      return NextResponse.json(
        {
          success: false,
          message: "Cart not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // FIND CART ITEM
    // --------------------------------------------------------

    const cartItem = cart.items.find(
      (item) =>
        item.product.toString() === productId.toString()
    );

    if (!cartItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Product is not in your cart.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // UPDATE QUANTITY
    // --------------------------------------------------------

    cartItem.quantity = quantity;

    await cart.save();

    // --------------------------------------------------------
    // GET UPDATED CART
    // --------------------------------------------------------

    const updatedCart = await CartModel.findOne({
      user: currentUser.id,
    }).populate("items.product");

    // --------------------------------------------------------
    // RETURN RESPONSE
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Cart quantity updated successfully.",
        cart: updatedCart,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update cart error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while updating the cart.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// REMOVE PRODUCT FROM CART
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
    // FIND CART
    // --------------------------------------------------------

    const cart = await CartModel.findOne({
      user: currentUser.id,
    });

    if (!cart) {
      return NextResponse.json(
        {
          success: false,
          message: "Cart not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // CHECK PRODUCT EXISTS IN CART
    // --------------------------------------------------------

    const itemExists = cart.items.some(
      (item) =>
        item.product.toString() === productId.toString()
    );

    if (!itemExists) {
      return NextResponse.json(
        {
          success: false,
          message: "Product is not in your cart.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // REMOVE PRODUCT
    // --------------------------------------------------------

    cart.items = cart.items.filter(
      (item) =>
        item.product.toString() !== productId.toString()
    );

    await cart.save();

    // --------------------------------------------------------
    // GET UPDATED CART
    // --------------------------------------------------------

    const updatedCart = await CartModel.findOne({
      user: currentUser.id,
    }).populate("items.product");

    // --------------------------------------------------------
    // RETURN RESPONSE
    // --------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Product removed from cart successfully.",
        cart: updatedCart,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Remove cart item error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while removing the product from cart.",
      },
      { status: 500 }
    );
  }
}