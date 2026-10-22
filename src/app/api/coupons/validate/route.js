import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import CouponModel from "@/models/Coupon.model";
import CartModel from "@/models/Cart.model";
import OrderModel from "@/models/Order.model";

export async function POST(request) {
  try {
    // ============================================================
    // AUTHENTICATION
    // ============================================================
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in to apply a coupon.",
        },
        { status: 401 }
      );
    }

    // ============================================================
    // REQUEST BODY
    // ============================================================
    const body = await request.json();
    const code = body?.code?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a coupon code.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // DATABASE
    // ============================================================
    await connectDB();

    // ============================================================
    // FIND COUPON
    // ============================================================
    const coupon = await CouponModel.findOne({
      code,
      isActive: true,
    });

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or inactive coupon code.",
        },
        { status: 404 }
      );
    }

    // ============================================================
    // CHECK EXPIRY
    // ============================================================
    const now = new Date();

    if (
      coupon.expiryDate &&
      new Date(coupon.expiryDate) < now
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This coupon has expired.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // CHECK USAGE LIMIT
    // ============================================================
    if (
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This coupon usage limit has been reached.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // CHECK IF COUPON IS ALREADY REDEEMED
    // ============================================================
    if (coupon.redeemed) {
      return NextResponse.json(
        {
          success: false,
          message: "This coupon has already been used.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // WELCOME COUPON VALIDATION
    // ============================================================
    if (coupon.couponType === "welcome") {
      const userEmail = user.email?.trim().toLowerCase();
      const couponOwnerEmail = coupon.ownerEmail
        ?.trim()
        .toLowerCase();

      // ----------------------------------------------------------
      // CHECK COUPON EMAIL OWNERSHIP
      // ----------------------------------------------------------
      if (
        !couponOwnerEmail ||
        !userEmail ||
        couponOwnerEmail !== userEmail
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This welcome coupon is not valid for your account.",
          },
          { status: 403 }
        );
      }

      // ----------------------------------------------------------
      // CHECK ASSIGNED USER
      // ----------------------------------------------------------
      if (
        coupon.assignedUser &&
        coupon.assignedUser.toString() !== user.id.toString()
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This welcome coupon is not assigned to your account.",
          },
          { status: 403 }
        );
      }

      // ----------------------------------------------------------
      // CHECK IF USER ALREADY COMPLETED AN ORDER
      // ----------------------------------------------------------
      const existingOrder = await OrderModel.findOne({
        user: user.id,
        $or: [
          {
            paymentStatus: "paid",
          },
          {
            paymentMethod: "cod",
            orderStatus: {
              $nin: ["cancelled"],
            },
          },
        ],
      }).select("_id");

      if (existingOrder) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Welcome coupons are available only for your first order.",
          },
          { status: 400 }
        );
      }
    }

    // ============================================================
    // GET USER CART
    // ============================================================
    const cart = await CartModel.findOne({
      user: user.id,
    }).select("items");

    if (
      !cart ||
      !Array.isArray(cart.items) ||
      cart.items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Your cart is empty.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // CALCULATE SUBTOTAL FROM SERVER-SIDE CART
    // ============================================================
    const subtotal = cart.items.reduce(
      (total, item) => {
        const price = Number(item?.price || 0);
        const quantity = Number(item?.quantity || 0);

        return total + price * quantity;
      },
      0
    );

    const roundedSubtotal = Number(
      subtotal.toFixed(2)
    );

    // ============================================================
    // CHECK MINIMUM ORDER AMOUNT
    // ============================================================
    if (
      roundedSubtotal <
      Number(coupon.minimumOrderAmount || 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum order amount for this coupon is ₹${Number(
            coupon.minimumOrderAmount || 0
          ).toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    // ============================================================
    // CALCULATE DISCOUNT
    // ============================================================
    let discount = 0;

    if (coupon.discountType === "percentage") {
      discount =
        (roundedSubtotal *
          Number(coupon.discountValue || 0)) /
        100;
    }

    if (coupon.discountType === "fixed") {
      discount = Number(
        coupon.discountValue || 0
      );
    }

    // ============================================================
    // APPLY MAXIMUM DISCOUNT LIMIT
    // ============================================================
    if (
      coupon.maximumDiscount !== null &&
      Number(coupon.maximumDiscount) > 0 &&
      discount > Number(coupon.maximumDiscount)
    ) {
      discount = Number(
        coupon.maximumDiscount
      );
    }

    // ============================================================
    // DISCOUNT CANNOT EXCEED SUBTOTAL
    // ============================================================
    if (discount > roundedSubtotal) {
      discount = roundedSubtotal;
    }

    discount = Number(
      discount.toFixed(2)
    );

    // ============================================================
    // FINAL AMOUNT
    // ============================================================
    const finalAmount = Number(
      (
        roundedSubtotal - discount
      ).toFixed(2)
    );

    // ============================================================
    // RESPONSE
    // ============================================================
    return NextResponse.json(
      {
        success: true,
        message: "Coupon applied successfully.",
        coupon: {
          id: coupon._id.toString(),
          code: coupon.code,
          couponType: coupon.couponType,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maximumDiscount: coupon.maximumDiscount,
        },
        pricing: {
          subtotal: roundedSubtotal,
          discount,
          shipping: 0,
          total: finalAmount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Coupon validation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while validating the coupon.",
      },
      { status: 500 }
    );
  }
}