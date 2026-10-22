import crypto from "crypto";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import CartModel from "@/models/Cart.model";
import CouponModel from "@/models/Coupon.model";
import OrderModel from "@/models/Order.model";
import OrderItemModel from "@/models/OrderItem.model";
import ProductModel from "@/models/Product.model";

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const RAZORPAY_KEY_ID =
  process.env.RAZORPAY_KEY_ID;

const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET;

// ============================================================
// RAZORPAY MAXIMUM AMOUNT (IN PAISE)
// ============================================================
//
// Razorpay rejects any single transaction above the merchant
// account's per-transaction limit. The default limit for most
// Indian accounts is ₹5,00,000 (500,000 rupees).
//
// We enforce a conservative ₹5,00,000 cap here so the user
// gets a clear message instead of a mid-checkout
// "Amount exceeds maximum amount allowed" error from Razorpay.
//
// Adjust this constant if Razorpay approves a higher cap for
// your account.
//

const RAZORPAY_MAX_AMOUNT_PAISE = 50000000; // ₹5,00,000

// ============================================================
// HELPERS
// ============================================================

const roundAmount = (value) => {
  return Number(
    Number(value || 0).toFixed(2)
  );
};

// ============================================================
// GENERATE LOCAL ORDER NUMBER
// ============================================================

const generateOrderNumber = () => {
  const timestamp =
    Date.now()
      .toString(36)
      .toUpperCase();

  const randomPart =
    crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase();

  return `ORD-${timestamp}-${randomPart}`;
};

// ============================================================
// GENERATE RAZORPAY RECEIPT
// ============================================================

const generateReceipt = () => {
  const timestamp = Date.now();

  const randomPart =
    crypto
      .randomBytes(5)
      .toString("hex");

  return `RZP-${timestamp}-${randomPart}`;
};

// ============================================================
// CREATE RAZORPAY AUTH HEADER
// ============================================================

const createRazorpayAuthHeader = () => {
  const credentials =
    Buffer.from(
      `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
    ).toString("base64");

  return `Basic ${credentials}`;
};

// ============================================================
// GET RAZORPAY ERROR MESSAGE
// ============================================================

const getRazorpayErrorMessage = (
  data
) => {
  return (
    data?.error?.description ||
    data?.error?.reason ||
    "Unable to create Razorpay order."
  );
};

// ============================================================
// POST - CREATE RAZORPAY ORDER
// ============================================================

export async function POST(request) {
  let pendingOrderId = null;

  try {
    // ========================================================
    // CHECK ENVIRONMENT VARIABLES
    // ========================================================

    if (
      !RAZORPAY_KEY_ID ||
      !RAZORPAY_KEY_SECRET
    ) {
      console.error(
        "Razorpay environment variables are missing."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Online payment is not configured on the server.",
        },
        { status: 500 }
      );
    }

    // ========================================================
    // AUTHENTICATION
    // ========================================================

    const user =
      await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You must be logged in to make an online payment.",
        },
        { status: 401 }
      );
    }

    // ========================================================
    // REQUEST BODY
    // ========================================================

    let body;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const shippingAddress =
      body?.shippingAddress || {};

    const couponCode =
      body?.couponCode
        ?.toString()
        .trim()
        .toUpperCase() || "";

    // ========================================================
    // SHIPPING ADDRESS
    // ========================================================

    const fullName =
      shippingAddress?.fullName
        ?.toString()
        .trim() || "";

    const phone =
      shippingAddress?.phone
        ?.toString()
        .trim() || "";

    const addressLine1 =
      shippingAddress?.addressLine1
        ?.toString()
        .trim() || "";

    const addressLine2 =
      shippingAddress?.addressLine2
        ?.toString()
        .trim() || "";

    const city =
      shippingAddress?.city
        ?.toString()
        .trim() || "";

    const state =
      shippingAddress?.state
        ?.toString()
        .trim() || "";

    const postalCode =
      shippingAddress?.postalCode
        ?.toString()
        .trim() || "";

    const country =
      shippingAddress?.country
        ?.toString()
        .trim() || "India";

    // ========================================================
    // REQUIRED ADDRESS VALIDATION
    // ========================================================

    if (
      !fullName ||
      !phone ||
      !addressLine1 ||
      !city ||
      !state ||
      !postalCode
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Complete delivery address is required.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // NAME VALIDATION
    // ========================================================

    if (
      fullName.length < 2 ||
      fullName.length > 50
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Full name must be between 2 and 50 characters.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // PHONE VALIDATION
    // ========================================================

    const phoneRegex =
      /^[6-9][0-9]{9}$/;

    if (
      !phoneRegex.test(phone)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a valid 10-digit Indian phone number.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // POSTAL CODE VALIDATION
    // ========================================================

    const postalCodeRegex =
      /^[1-9][0-9]{5}$/;

    if (
      !postalCodeRegex.test(
        postalCode
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a valid 6-digit postal code.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // GET CART
    // ========================================================

    const cart =
      await CartModel.findOne({
        user: user.id,
      }).lean();

    if (
      !cart ||
      !Array.isArray(cart.items) ||
      cart.items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your cart is empty.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // GET PRODUCT IDS
    // ========================================================

    const productIds =
      cart.items.map(
        (item) => item.product
      );

    // ========================================================
    // FETCH CURRENT PRODUCTS
    // ========================================================

    const products =
      await ProductModel.find({
        _id: {
          $in: productIds,
        },
      }).lean();

    // ========================================================
    // CREATE PRODUCT MAP
    // ========================================================

    const productMap =
      new Map();

    products.forEach(
      (product) => {
        productMap.set(
          product._id.toString(),
          product
        );
      }
    );

    // ========================================================
    // CALCULATE SERVER-SIDE SUBTOTAL
    // ========================================================

    let subtotal = 0;

    for (
      const cartItem of cart.items
    ) {
      const productId =
        cartItem?.product?.toString();

      const quantity =
        Number(
          cartItem?.quantity || 0
        );

      // ------------------------------------------------------
      // PRODUCT ID
      // ------------------------------------------------------

      if (!productId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid product found in your cart.",
          },
          { status: 400 }
        );
      }

      // ------------------------------------------------------
      // QUANTITY
      // ------------------------------------------------------

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity < 1
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid product quantity found in your cart.",
          },
          { status: 400 }
        );
      }

      // ------------------------------------------------------
      // PRODUCT
      // ------------------------------------------------------

      const product =
        productMap.get(
          productId
        );

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One of the products in your cart is no longer available.",
          },
          { status: 409 }
        );
      }

      // ------------------------------------------------------
      // ACTIVE CHECK
      // ------------------------------------------------------

      if (
        product.isActive !==
        true
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `${product.name} is no longer available.`,
          },
          { status: 409 }
        );
      }

      // ------------------------------------------------------
      // STOCK CHECK
      // ------------------------------------------------------

      if (
        Number(
          product.stock || 0
        ) < quantity
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Insufficient stock for ${product.name}.`,
          },
          { status: 409 }
        );
      }

      // ------------------------------------------------------
      // SERVER PRICE
      // ------------------------------------------------------

      const price =
        Number(
          product.price || 0
        );

      subtotal +=
        price * quantity;
    }

    subtotal =
      roundAmount(subtotal);

    // ========================================================
    // COUPON
    // ========================================================

    let coupon = null;
    let discount = 0;
    let appliedCouponCode = "";

    if (couponCode) {
      coupon =
        await CouponModel.findOne({
          code: couponCode,
          isActive: true,
        }).lean();

      if (!coupon) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid or inactive coupon code.",
          },
          { status: 400 }
        );
      }

      // ------------------------------------------------------
      // EXPIRY
      // ------------------------------------------------------

      if (
        coupon.expiryDate &&
        new Date(
          coupon.expiryDate
        ) < new Date()
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This coupon has expired.",
          },
          { status: 400 }
        );
      }

      // ------------------------------------------------------
      // USAGE LIMIT
      // ------------------------------------------------------

      if (
        coupon.usageLimit !=
        null &&
        Number(
          coupon.usedCount || 0
        ) >=
        Number(
          coupon.usageLimit
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This coupon usage limit has been reached.",
          },
          { status: 400 }
        );
      }

      // ------------------------------------------------------
      // MINIMUM ORDER
      // ------------------------------------------------------

      if (
        subtotal <
        Number(
          coupon.minimumOrderAmount ||
          0
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Minimum order amount for this coupon is ₹${Number(
                coupon.minimumOrderAmount || 0
              ).toFixed(2)}.`,
          },
          { status: 400 }
        );
      }

      // ------------------------------------------------------
      // CALCULATE DISCOUNT
      // ------------------------------------------------------

      if (
        coupon.discountType ===
        "percentage"
      ) {
        discount =
          (subtotal *
            Number(
              coupon.discountValue ||
              0
            )) /
          100;
      }

      if (
        coupon.discountType ===
        "fixed"
      ) {
        discount =
          Number(
            coupon.discountValue ||
            0
          );
      }

      // ------------------------------------------------------
      // MAXIMUM DISCOUNT
      // ------------------------------------------------------

      if (
        coupon.maximumDiscount !=
        null &&
        Number(
          coupon.maximumDiscount
        ) > 0 &&
        discount >
        Number(
          coupon.maximumDiscount
        )
      ) {
        discount =
          Number(
            coupon.maximumDiscount
          );
      }

      // ------------------------------------------------------
      // DISCOUNT CANNOT EXCEED SUBTOTAL
      // ------------------------------------------------------

      if (
        discount >
        subtotal
      ) {
        discount =
          subtotal;
      }

      discount =
        roundAmount(discount);

      appliedCouponCode =
        coupon.code;
    }

    // ========================================================
    // SHIPPING
    // ========================================================

    const shipping = 0;

    // ========================================================
    // FINAL TOTAL
    // ========================================================

    const total =
      roundAmount(
        Math.max(
          subtotal -
          discount +
          shipping,
          0
        )
      );

    // ========================================================
    // ZERO TOTAL CHECK
    // ========================================================

    if (total <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Online payment is not required for an order with a zero total.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // RAZORPAY AMOUNT
    // ========================================================

    const razorpayAmount =
      Math.round(
        total * 100
      );

    if (
      !Number.isSafeInteger(
        razorpayAmount
      ) ||
      razorpayAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid payment amount.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // RAZORPAY MAXIMUM AMOUNT CHECK
    // ========================================================
    //
    // Fail fast before creating any pending order or calling
    // Razorpay, so the user sees a clear message instead of
    // Razorpay's raw "Amount exceeds maximum amount allowed"
    // error mid-checkout.
    //

    if (
      razorpayAmount >
      RAZORPAY_MAX_AMOUNT_PAISE
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your order total exceeds the maximum amount allowed for online payment. Please reduce the quantity or remove some items, or choose Cash on Delivery.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // GENERATE LOCAL ORDER NUMBER
    // ========================================================

    let orderNumber =
      generateOrderNumber();

    // ========================================================
    // CREATE LOCAL PENDING ORDER
    // ========================================================

    const session =
      await mongoose.startSession();

    let pendingOrder = null;

    try {
      await session.withTransaction(
        async () => {
          // --------------------------------------------------
          // CHECK ORDER NUMBER COLLISION
          // --------------------------------------------------

          let existingOrderNumber =
            await OrderModel.findOne({
              orderNumber,
            })
              .session(session)
              .lean();

          while (
            existingOrderNumber
          ) {
            orderNumber =
              generateOrderNumber();

            existingOrderNumber =
              await OrderModel.findOne({
                orderNumber,
              })
                .session(session)
                .lean();
          }

          // --------------------------------------------------
          // CREATE PENDING ORDER
          // --------------------------------------------------

          const order =
            new OrderModel({
              user: user.id,

              orderNumber,

              shippingAddress: {
                fullName,

                phone,

                addressLine1,

                addressLine2,

                city,

                state,

                postalCode,

                country,
              },

              subtotal,

              discount,

              shipping,

              total,

              coupon:
                coupon?._id ||
                null,

              couponCode:
                appliedCouponCode,

              paymentMethod:
                "razorpay",

              paymentStatus:
                "pending",

              orderStatus:
                "pending",

              shippingDetails:
                {},

              trackingEvents: [
                {
                  status:
                    "pending",

                  title:
                    "Payment pending",

                  description:
                    "Waiting for Razorpay payment confirmation.",

                  location:
                    city,

                  timestamp:
                    new Date(),
                },
              ],

              razorpayOrderId:
                null,

              razorpayPaymentId:
                null,

              razorpaySignature:
                null,

              paidAt:
                null,

              cancelledAt:
                null,

              cancellationReason:
                "",
            });

          await order.save({
            session,
          });

          // --------------------------------------------------
          // CREATE ORDER ITEMS SNAPSHOT
          // --------------------------------------------------

          const orderItems =
            cart.items.map(
              (cartItem) => {
                const productId =
                  cartItem?.product?.toString();

                const product =
                  productMap.get(
                    productId
                  );

                const quantity =
                  Number(
                    cartItem?.quantity ||
                    0
                  );

                const price =
                  Number(
                    product?.price ||
                    0
                  );

                return {
                  order:
                    order._id,

                  product:
                    product._id,

                  productName:
                    product.name,

                  productImage:
                    product.image ||
                    "",

                  price,

                  quantity,

                  subtotal:
                    roundAmount(
                      price *
                      quantity
                    ),
                };
              }
            );

          await OrderItemModel.insertMany(
            orderItems,
            {
              session,
            }
          );

          pendingOrder =
            order;
        }
      );
    } finally {
      await session.endSession();
    }

    // ========================================================
    // SAFETY CHECK
    // ========================================================

    if (!pendingOrder) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to create the pending local order.",
        },
        { status: 500 }
      );
    }

    pendingOrderId =
      pendingOrder._id.toString();

    // ========================================================
    // RAZORPAY RECEIPT
    // ========================================================

    const receipt =
      generateReceipt();

    // ========================================================
    // RAZORPAY NOTES
    // ========================================================

    // Store enough information to identify
    // the local pending order later.

    const notes = {
      userId:
        user.id.toString(),

      localOrderId:
        pendingOrder._id.toString(),

      orderNumber:
        pendingOrder.orderNumber,

      couponCode:
        appliedCouponCode,
    };

    // ========================================================
    // CREATE RAZORPAY ORDER
    // ========================================================

    let razorpayResponse;

    try {
      razorpayResponse =
        await fetch(
          "https://api.razorpay.com/v1/orders",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                createRazorpayAuthHeader(),
            },

            body:
              JSON.stringify({
                amount:
                  razorpayAmount,

                currency:
                  "INR",

                receipt,

                partial_payment:
                  false,

                notes,
              }),

            cache:
              "no-store",
          }
        );
    } catch (
    razorpayNetworkError
    ) {
      console.error(
        "Razorpay network error:",
        razorpayNetworkError
      );

      // ------------------------------------------------------
      // REMOVE PENDING LOCAL ORDER
      // ------------------------------------------------------

      await OrderItemModel.deleteMany({
        order:
          pendingOrder._id,
      });

      await OrderModel.deleteOne({
        _id:
          pendingOrder._id,
      });

      pendingOrderId =
        null;

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to connect to the payment gateway. Please try again.",
        },
        { status: 502 }
      );
    }

    // ========================================================
    // RAZORPAY RESPONSE
    // ========================================================

    let razorpayData =
      null;

    try {
      razorpayData =
        await razorpayResponse.json();
    } catch {
      razorpayData = null;
    }

    // ========================================================
    // RAZORPAY ERROR
    // ========================================================

    if (
      !razorpayResponse.ok
    ) {
      console.error(
        "Razorpay create order failed:",
        razorpayData
      );

      // ------------------------------------------------------
      // REMOVE PENDING LOCAL ORDER
      // ------------------------------------------------------

      await OrderItemModel.deleteMany({
        order:
          pendingOrder._id,
      });

      await OrderModel.deleteOne({
        _id:
          pendingOrder._id,
      });

      pendingOrderId =
        null;

      return NextResponse.json(
        {
          success: false,
          message:
            getRazorpayErrorMessage(
              razorpayData
            ),
        },
        {
          status:
            razorpayResponse.status >=
              400 &&
              razorpayResponse.status < 500
              ? 400
              : 502,
        }
      );
    }

    // ========================================================
    // VALIDATE RAZORPAY RESPONSE
    // ========================================================

    if (
      !razorpayData?.id ||
      razorpayData?.amount !==
      razorpayAmount ||
      razorpayData?.currency !==
      "INR"
    ) {
      console.error(
        "Invalid Razorpay order response:",
        razorpayData
      );

      // ------------------------------------------------------
      // REMOVE PENDING LOCAL ORDER
      // ------------------------------------------------------

      await OrderItemModel.deleteMany({
        order:
          pendingOrder._id,
      });

      await OrderModel.deleteOne({
        _id:
          pendingOrder._id,
      });

      pendingOrderId =
        null;

      return NextResponse.json(
        {
          success: false,
          message:
            "The payment gateway returned an invalid order response.",
        },
        { status: 502 }
      );
    }

    // ========================================================
    // SAVE RAZORPAY ORDER ID TO LOCAL PENDING ORDER
    // ========================================================

    const updatedPendingOrder =
      await OrderModel.findOneAndUpdate(
        {
          _id:
            pendingOrder._id,

          user:
            user.id,

          paymentStatus:
            "pending",

          orderStatus:
            "pending",
        },
        {
          $set: {
            razorpayOrderId:
              razorpayData.id,
          },
        },
        {
          returnDocument:
            "after",
        }
      );

    if (!updatedPendingOrder) {
      console.error(
        "Unable to attach Razorpay order ID to local pending order."
      );

      // ------------------------------------------------------
      // REMOVE LOCAL PENDING ORDER
      // ------------------------------------------------------

      await OrderItemModel.deleteMany({
        order:
          pendingOrder._id,
      });

      await OrderModel.deleteOne({
        _id:
          pendingOrder._id,
      });

      pendingOrderId =
        null;

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to prepare the local payment order. Please try again.",
        },
        { status: 500 }
      );
    }

    // ========================================================
    // SUCCESS RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Razorpay order created successfully.",

        razorpay: {
          keyId:
            RAZORPAY_KEY_ID,

          orderId:
            razorpayData.id,

          amount:
            razorpayData.amount,

          currency:
            razorpayData.currency,

          receipt:
            razorpayData.receipt,
        },

        order: {
          id:
            updatedPendingOrder._id.toString(),

          orderNumber:
            updatedPendingOrder.orderNumber,

          subtotal,

          discount,

          shipping,

          total,

          couponCode:
            appliedCouponCode,

          paymentMethod:
            "razorpay",

          paymentStatus:
            "pending",

          orderStatus:
            "pending",
        },

        customer: {
          name:
            fullName,

          email:
            user.email || "",

          phone,
        },

        shippingAddress: {
          fullName,

          phone,

          addressLine1,

          addressLine2,

          city,

          state,

          postalCode,

          country,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create Razorpay order error:",
      error
    );

    // ========================================================
    // BEST-EFFORT CLEANUP
    // ========================================================

    if (pendingOrderId) {
      try {
        await OrderItemModel.deleteMany({
          order:
            pendingOrderId,
        });

        await OrderModel.deleteOne({
          _id:
            pendingOrderId,
        });
      } catch (cleanupError) {
        console.error(
          "Pending order cleanup error:",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Something went wrong while creating the payment order.",
      },
      { status: 500 }
    );
  }
}