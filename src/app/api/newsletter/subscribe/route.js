import { NextResponse } from "next/server";
import crypto from "crypto";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import User from "@/models/User.model";
import Order from "@/models/Order.model";
import Coupon from "@/models/Coupon.model";
import NewsletterSubscription from "@/models/NewsletterSubscription.model";


const generateCouponCode = () => {
  const randomPart = crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase();

  return `WELCOME10-${randomPart}`;
};


export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const email = body?.email?.trim().toLowerCase();

    // Validate email
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required.",
        },
        { status: 400 }
      );
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    // Get logged-in user if available
    const currentUser = await getCurrentUser();

    let user = null;

    if (currentUser?.id) {
      user = await User.findOne({
        _id: currentUser.id,
        deletedAt: null,
      });
    }

    // If logged-in user's email matches subscription email,
    // use that user.
    if (user && user.email !== email) {
      user = null;
    }

    // Also check whether this email already belongs to an account.
    if (!user) {
      user = await User.findOne({
        email,
        deletedAt: null,
      });
    }

    // Check existing newsletter subscription
    let subscription =
      await NewsletterSubscription.findOne({
        email,
      });

    // If subscription already exists
    if (subscription) {
      // Associate user if we now know the account
      if (
        user &&
        (!subscription.user ||
          subscription.user.toString() !==
            user._id.toString())
      ) {
        subscription.user = user._id;
        await subscription.save();
      }

      // If already subscribed and coupon exists,
      // don't create another coupon.
      if (
        subscription.isSubscribed &&
        subscription.welcomeCoupon
      ) {
        const existingCoupon =
          await Coupon.findById(
            subscription.welcomeCoupon
          );

        return NextResponse.json(
          {
            success: true,
            alreadySubscribed: true,
            message:
              "This email is already subscribed to the newsletter.",
            couponCode:
              existingCoupon?.code || null,
          },
          { status: 200 }
        );
      }

      subscription.isSubscribed = true;
      subscription.unsubscribedAt = null;

      if (user) {
        subscription.user = user._id;
      }
    } else {
      subscription =
        new NewsletterSubscription({
          email,
          user: user?._id || null,
          isSubscribed: true,
        });
    }

    /*
     * Logged-in/existing user:
     * Check whether this email/account has already placed
     * a successful order.
     *
     * Razorpay successful order = paymentStatus "paid"
     * COD order = orderStatus is not cancelled.
     */
    if (user) {
      const existingOrder =
        await Order.findOne({
          user: user._id,
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
        subscription.welcomeCoupon = null;
        subscription.welcomeCouponSent = false;
        subscription.welcomeCouponSentAt = null;

        await subscription.save();

        return NextResponse.json(
          {
            success: true,
            alreadyCustomer: true,
            message:
              "You are already subscribed to the newsletter.",
          },
          { status: 200 }
        );
      }
    }

    // Create the personal 10% welcome coupon
    let coupon = null;

    if (!subscription.welcomeCoupon) {
      let couponCode;
      let couponExists = true;

      // Generate a unique coupon code
      while (couponExists) {
        couponCode = generateCouponCode();

        couponExists = await Coupon.exists({
          code: couponCode,
        });
      }

      coupon = await Coupon.create({
        code: couponCode,

        couponType: "welcome",

        discountType: "percentage",
        discountValue: 10,

        minimumOrderAmount: 0,
        maximumDiscount: null,

        expiryDate: null,

        usageLimit: 1,
        usedCount: 0,

        isActive: true,

        ownerEmail: email,

        assignedUser: user?._id || null,

        redeemed: false,
        redeemedAt: null,
        redeemedBy: null,
        redeemedOrder: null,
      });

      subscription.welcomeCoupon =
        coupon._id;

      subscription.welcomeCouponSent = false;
      subscription.welcomeCouponSentAt = null;
    } else {
      coupon = await Coupon.findById(
        subscription.welcomeCoupon
      );
    }

    if (user) {
      subscription.user = user._id;
    }

    await subscription.save();

    /*
     * Email sending will be connected here in the next part.
     *
     * We intentionally save the coupon/subscription first.
     * This prevents multiple coupons from being created
     * if email sending fails and the user tries again.
     */

    return NextResponse.json(
      {
        success: true,
        message:
          "Successfully subscribed to the newsletter.",
        couponCode: coupon?.code || null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Newsletter subscription error:",
      error
    );

    // Handle duplicate email race condition
    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This email is already subscribed.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong. Please try again later.",
      },
      { status: 500 }
    );
  }
}