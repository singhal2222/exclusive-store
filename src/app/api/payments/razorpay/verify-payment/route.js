import crypto from "crypto";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import { isNotificationEnabled } from "@/lib/notificationSettings";

import CartModel from "@/models/Cart.model";
import CouponModel from "@/models/Coupon.model";
import OrderModel from "@/models/Order.model";
import OrderItemModel from "@/models/OrderItem.model";
import ProductModel from "@/models/Product.model";
import NotificationModel from "@/models/Notification.model";
import RazorpayWebhookEventModel from "@/models/RazorpayWebhookEvent.model";

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// ============================================================
// CREATE RAZORPAY AUTH HEADER
// ============================================================

const createRazorpayAuthHeader = () => {
  const credentials = Buffer.from(
    `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  return `Basic ${credentials}`;
};

// ============================================================
// GET RAZORPAY ERROR MESSAGE
// ============================================================

const getRazorpayErrorMessage = (data) => {
  return (
    data?.error?.description ||
    data?.error?.reason ||
    "Unable to verify the Razorpay payment."
  );
};

// ============================================================
// VERIFY RAZORPAY SIGNATURE
// ============================================================

const verifyRazorpaySignature = ({
  orderId,
  paymentId,
  signature,
}) => {
  if (
    !orderId ||
    !paymentId ||
    !signature ||
    !RAZORPAY_KEY_SECRET
  ) {
    return false;
  }

  const payload = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest("hex");

  const expectedBuffer = Buffer.from(
    expectedSignature,
    "utf8"
  );

  const actualBuffer = Buffer.from(
    signature,
    "utf8"
  );

  if (
    expectedBuffer.length !==
    actualBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    actualBuffer
  );
};

// ============================================================
// POST - VERIFY RAZORPAY PAYMENT
// ============================================================

export async function POST(request) {
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

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You must be logged in to verify the payment.",
        },
        { status: 401 }
      );
    }

    // ========================================================
    // REQUEST BODY
    // ========================================================

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const razorpayPaymentId =
      body?.razorpay_payment_id
        ?.toString()
        .trim() || "";

    const razorpayOrderId =
      body?.razorpay_order_id
        ?.toString()
        .trim() || "";

    const razorpaySignature =
      body?.razorpay_signature
        ?.toString()
        .trim() || "";

    // ========================================================
    // BASIC PAYMENT DATA VALIDATION
    // ========================================================

    if (
      !razorpayPaymentId ||
      !razorpayOrderId ||
      !razorpaySignature
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Incomplete Razorpay payment details.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // CONNECT DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // VERIFY RAZORPAY PAYMENT SIGNATURE
    // ========================================================

    const signatureValid =
      verifyRazorpaySignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });

    if (!signatureValid) {
      console.error(
        "Invalid Razorpay payment signature."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment verification failed. Invalid payment signature.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // FETCH RAZORPAY ORDER FROM SERVER
    // ========================================================

    let razorpayOrderResponse;

    try {
      razorpayOrderResponse = await fetch(
        `https://api.razorpay.com/v1/orders/${encodeURIComponent(
          razorpayOrderId
        )}`,
        {
          method: "GET",
          headers: {
            Authorization:
              createRazorpayAuthHeader(),
          },
          cache: "no-store",
        }
      );
    } catch (networkError) {
      console.error(
        "Razorpay order fetch network error:",
        networkError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to verify the payment with Razorpay. Please try again.",
        },
        { status: 502 }
      );
    }

    let razorpayOrderData = null;

    try {
      razorpayOrderData =
        await razorpayOrderResponse.json();
    } catch {
      razorpayOrderData = null;
    }

    // ========================================================
    // RAZORPAY API ERROR
    // ========================================================

    if (!razorpayOrderResponse.ok) {
      console.error(
        "Razorpay order fetch failed:",
        razorpayOrderData
      );

      return NextResponse.json(
        {
          success: false,
          message:
            getRazorpayErrorMessage(
              razorpayOrderData
            ),
        },
        {
          status:
            razorpayOrderResponse.status >= 400 &&
              razorpayOrderResponse.status < 500
              ? 400
              : 502,
        }
      );
    }

    // ========================================================
    // VERIFY RAZORPAY ORDER ID
    // ========================================================

    if (
      razorpayOrderData?.id !==
      razorpayOrderId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The Razorpay order could not be verified.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // VERIFY USER OWNERSHIP
    // ========================================================

    const razorpayUserId =
      razorpayOrderData?.notes?.userId
        ?.toString() || "";

    if (
      !razorpayUserId ||
      razorpayUserId !==
      user.id.toString()
    ) {
      console.error(
        "Razorpay order ownership mismatch."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "This payment does not belong to the current user.",
        },
        { status: 403 }
      );
    }

    // ========================================================
    // LOCAL ORDER ID FROM RAZORPAY NOTES
    // ========================================================

    const localOrderId =
      razorpayOrderData?.notes?.localOrderId
        ?.toString()
        .trim() || "";

    // ========================================================
    // VERIFY CURRENCY
    // ========================================================

    if (
      razorpayOrderData?.currency !==
      "INR"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid payment currency.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // VERIFY RAZORPAY PAYMENT AMOUNT
    // ========================================================

    const razorpayOrderAmount = Number(
      razorpayOrderData?.amount || 0
    );

    const razorpayAmountPaid = Number(
      razorpayOrderData?.amount_paid || 0
    );

    if (
      !Number.isSafeInteger(
        razorpayOrderAmount
      ) ||
      razorpayOrderAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid Razorpay order amount.",
        },
        { status: 400 }
      );
    }

    if (
      razorpayAmountPaid !==
      razorpayOrderAmount
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The payment has not been fully captured yet. Please try again shortly.",
        },
        { status: 409 }
      );
    }

    // ========================================================
    // FIND LOCAL ORDER
    // ========================================================

    let localOrder;

    if (localOrderId) {
      localOrder =
        await OrderModel.findOne({
          _id: localOrderId,
          user: user.id,
          razorpayOrderId:
            razorpayOrderId,
        });
    }

    // --------------------------------------------------------
    // FALLBACK FOR OLDER ORDERS
    // --------------------------------------------------------

    if (!localOrder) {
      localOrder =
        await OrderModel.findOne({
          user: user.id,
          razorpayOrderId:
            razorpayOrderId,
        });
    }

    if (!localOrder) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The local payment order could not be found. Please restart checkout.",
        },
        { status: 404 }
      );
    }

    // ========================================================
    // VERIFY LOCAL ORDER AMOUNT
    // ========================================================

    const expectedAmount = Math.round(
      Number(localOrder.total || 0) * 100
    );

    if (
      !Number.isSafeInteger(
        expectedAmount
      ) ||
      expectedAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid local order amount.",
        },
        { status: 400 }
      );
    }

    if (
      expectedAmount !==
      razorpayOrderAmount
    ) {
      console.error(
        "Razorpay/local order amount mismatch:",
        {
          razorpayOrderAmount,
          expectedAmount,
          razorpayOrderId,
          localOrderId:
            localOrder._id.toString(),
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "The payment amount does not match the local order amount.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // START DATABASE TRANSACTION
    // ========================================================

    const session =
      await mongoose.startSession();

    let createdOrder = null;

    try {
      await session.withTransaction(
        async () => {
          // ==================================================
          // GET LOCAL ORDER AGAIN INSIDE TRANSACTION
          // ==================================================

          const order =
            await OrderModel.findOne({
              _id: localOrder._id,
              user: user.id,
              razorpayOrderId:
                razorpayOrderId,
            }).session(session);

          if (!order) {
            throw new Error(
              "Local payment order could not be found."
            );
          }

          // ==================================================
          // IDEMPOTENCY
          // ==================================================

          if (
            order.paymentStatus ===
            "paid" &&
            order.orderStatus !==
            "cancelled"
          ) {
            createdOrder = order;
            return;
          }

          // ==================================================
          // ORDER MUST BE PENDING
          // ==================================================

          if (
            order.paymentStatus !==
            "pending"
          ) {
            throw new Error(
              `This payment order is already ${order.paymentStatus}.`
            );
          }

          // ==================================================
          // VERIFY PAYMENT METHOD
          // ==================================================

          if (
            order.paymentMethod !==
            "razorpay"
          ) {
            throw new Error(
              "Invalid payment method for this order."
            );
          }

          // ==================================================
          // VERIFY ORDER ITEMS SNAPSHOT
          // ==================================================

          const orderItems =
            await OrderItemModel.find({
              order: order._id,
            })
              .session(session)
              .lean();

          if (!orderItems.length) {
            throw new Error(
              "Order items are missing for this payment."
            );
          }

          // ==================================================
          // VERIFY ORDER ITEMS TOTAL
          // ==================================================

          let itemTotal = 0;

          for (
            const orderItem of orderItems
          ) {
            const quantity = Number(
              orderItem.quantity || 0
            );

            const price = Number(
              orderItem.price || 0
            );

            if (
              !Number.isInteger(
                quantity
              ) ||
              quantity < 1
            ) {
              throw new Error(
                "Invalid order item quantity."
              );
            }

            if (
              !Number.isFinite(price) ||
              price < 0
            ) {
              throw new Error(
                "Invalid order item price."
              );
            }

            itemTotal +=
              price * quantity;
          }

          itemTotal = Number(
            itemTotal.toFixed(2)
          );

          const expectedOrderTotal =
            Number(order.total || 0);

          const expectedSubtotal =
            Number(order.subtotal || 0);

          const expectedDiscount =
            Number(order.discount || 0);

          const expectedShipping =
            Number(order.shipping || 0);

          const calculatedTotal =
            Number(
              (
                expectedSubtotal -
                expectedDiscount +
                expectedShipping
              ).toFixed(2)
            );

          if (
            calculatedTotal !==
            expectedOrderTotal
          ) {
            throw new Error(
              "The local order totals are inconsistent."
            );
          }

          if (
            itemTotal <= 0 ||
            expectedSubtotal <
            itemTotal
          ) {
            throw new Error(
              "The local order item totals are invalid."
            );
          }

          // ==================================================
          // VERIFY COUPON
          // ==================================================

          let coupon = null;

          if (order.coupon) {
            coupon =
              await CouponModel.findById(
                order.coupon
              ).session(session);

            if (!coupon) {
              throw new Error(
                "The coupon attached to this order could not be found."
              );
            }

            // ----------------------------------------------
            // COUPON MUST BE ACTIVE
            // ----------------------------------------------

            if (
              coupon.isActive !== true
            ) {
              throw new Error(
                "This coupon is no longer active."
              );
            }

            // ----------------------------------------------
            // COUPON MUST NOT ALREADY BE REDEEMED
            // ----------------------------------------------

            if (coupon.redeemed) {
              throw new Error(
                "This coupon has already been used."
              );
            }

            // ----------------------------------------------
            // USAGE LIMIT
            // ----------------------------------------------

            if (
              coupon.usageLimit != null &&
              Number(
                coupon.usedCount || 0
              ) >=
              Number(
                coupon.usageLimit
              )
            ) {
              throw new Error(
                "This coupon usage limit has been reached."
              );
            }

            // ----------------------------------------------
            // EXPIRY
            // ----------------------------------------------

            if (
              coupon.expiryDate &&
              new Date(
                coupon.expiryDate
              ) < new Date()
            ) {
              throw new Error(
                "This coupon has expired."
              );
            }

            // ----------------------------------------------
            // VERIFY COUPON CODE STORED ON ORDER
            // ----------------------------------------------

            if (
              order.couponCode &&
              coupon.code !==
              order.couponCode
            ) {
              throw new Error(
                "The coupon attached to this order is invalid."
              );
            }

            // ----------------------------------------------
            // WELCOME COUPON
            // ----------------------------------------------

            if (
              coupon.couponType ===
              "welcome"
            ) {
              const userEmail =
                user.email
                  ?.trim()
                  .toLowerCase();

              const couponOwnerEmail =
                coupon.ownerEmail
                  ?.trim()
                  .toLowerCase();

              // --------------------------------------------
              // OWNER EMAIL
              // --------------------------------------------

              if (
                !couponOwnerEmail ||
                !userEmail ||
                couponOwnerEmail !==
                userEmail
              ) {
                throw new Error(
                  "This welcome coupon is not valid for your account."
                );
              }

              // --------------------------------------------
              // ASSIGNED USER
              // --------------------------------------------

              if (
                coupon.assignedUser &&
                coupon.assignedUser.toString() !==
                user.id.toString()
              ) {
                throw new Error(
                  "This welcome coupon is not assigned to your account."
                );
              }

              // --------------------------------------------
              // FIRST ORDER CHECK
              // --------------------------------------------

              const existingOrder =
                await OrderModel.findOne({
                  user: user.id,
                  _id: {
                    $ne: order._id,
                  },
                  $or: [
                    {
                      paymentStatus:
                        "paid",
                    },
                    {
                      paymentMethod:
                        "cod",
                      orderStatus: {
                        $nin: [
                          "cancelled",
                        ],
                      },
                    },
                  ],
                })
                  .session(session)
                  .select("_id")
                  .lean();

              if (existingOrder) {
                throw new Error(
                  "Welcome coupons are available only for your first order."
                );
              }
            }
          }

          // ==================================================
          // REDUCE STOCK
          // ==================================================

          for (
            const orderItem of orderItems
          ) {
            const productId =
              orderItem?.product;

            const quantity = Number(
              orderItem?.quantity || 0
            );

            if (
              !productId ||
              !Number.isInteger(
                quantity
              ) ||
              quantity < 1
            ) {
              throw new Error(
                "Invalid order item found during payment finalization."
              );
            }

            const updatedProduct =
              await ProductModel.findOneAndUpdate(
                {
                  _id: productId,
                  isActive: true,
                  stock: {
                    $gte: quantity,
                  },
                },
                {
                  $inc: {
                    stock: -quantity,
                  },
                },
                {
                  returnDocument: "after",
                  session,
                }
              );

            if (!updatedProduct) {
              throw new Error(
                `Insufficient stock while completing ${orderItem.productName}.`
              );
            }
          }

          // ==================================================
          // REDEEM COUPON
          // ==================================================

          if (coupon) {
            const couponFilter = {
              _id: coupon._id,
              isActive: true,
              redeemed: false,
            };

            if (
              coupon.usageLimit !=
              null
            ) {
              couponFilter.usedCount = {
                $lt: Number(
                  coupon.usageLimit
                ),
              };
            }

            const updatedCoupon =
              await CouponModel.findOneAndUpdate(
                couponFilter,
                {
                  $inc: {
                    usedCount: 1,
                  },
                  $set: {
                    redeemed: true,
                    redeemedAt:
                      new Date(),
                    redeemedBy:
                      user.id,
                    redeemedOrder:
                      order._id,
                  },
                },
                {
                  returnDocument:
                    "after",
                  session,
                }
              );

            if (!updatedCoupon) {
              throw new Error(
                "This coupon is no longer available."
              );
            }
          }

          // ==================================================
          // CLEAR CART
          // ==================================================

          await CartModel.deleteOne(
            {
              user: user.id,
            },
            {
              session,
            }
          );

          // ==================================================
          // UPDATE ORDER
          // ==================================================

          order.paymentStatus = "paid";

          order.paymentMethod = "razorpay";

          order.orderStatus = "confirmed";

          order.razorpayPaymentId =
            razorpayPaymentId;

          order.razorpaySignature =
            razorpaySignature;

          order.paidAt = new Date();

          order.cancelledAt = null;

          order.cancellationReason = "";

          if (
            !Array.isArray(
              order.trackingEvents
            )
          ) {
            order.trackingEvents = [];
          }

          // --------------------------------------------------
          // PREVENT DUPLICATE CONFIRMATION EVENTS
          // --------------------------------------------------

          const hasConfirmedEvent =
            order.trackingEvents.some(
              (event) =>
                event?.status ===
                "confirmed" &&
                event?.title ===
                "Order confirmed"
            );

          if (!hasConfirmedEvent) {
            order.trackingEvents.push({
              status: "confirmed",

              title: "Order confirmed",

              description:
                "Your payment was received and your order has been confirmed.",

              location:
                order.shippingAddress
                  ?.city || "",

              timestamp: new Date(),
            });
          }

          await order.save({
            session,
          });

          createdOrder = order;
        }
      );
    } finally {
      await session.endSession();
    }

    // ========================================================
    // SAFETY CHECK
    // ========================================================

    if (!createdOrder) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment was verified, but the order could not be finalized.",
        },
        { status: 500 }
      );
    }

    // ========================================================
    // PAYMENT RECEIVED NOTIFICATION
    //
    // Controlled by:
    // Settings → Notifications → Payment Received
    //
    // If disabled:
    // Payment succeeds but no admin notification is created.
    //
    // If notification creation fails:
    // Payment/order completion is NOT affected.
    // ========================================================

    try {
      const paymentReceivedEnabled =
        await isNotificationEnabled(
          "payment_received"
        );

      if (paymentReceivedEnabled) {
        const existingPaymentNotification =
          await NotificationModel.findOne({
            type: "payment_received",
            relatedId:
              createdOrder._id,
          }).lean();

        if (
          !existingPaymentNotification
        ) {
          const paymentAmount =
            Number(
              createdOrder.total || 0
            );

          await NotificationModel.create({
            type: "payment_received",

            title: "Payment Received",

            message:
              `Payment of ₹${paymentAmount.toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )} has been received for order #${createdOrder.orderNumber}.`,

            relatedId:
              createdOrder._id,

            link: "/admin/orders",

            isRead: false,

            readAt: null,
          });
        }
      }
    } catch (notificationError) {
      console.error(
        "Create payment received notification error:",
        notificationError
      );
    }

    // ========================================================
    // MARK PENDING WEBHOOK AS PROCESSED
    // ========================================================

    const pendingWebhookEvent =
      await RazorpayWebhookEventModel.findOneAndUpdate(
        {
          event: "payment.captured",

          razorpayOrderId:
            razorpayOrderId,

          status: "pending",
        },
        {
          $set: {
            status: "processed",

            razorpayPaymentId:
              razorpayPaymentId,

            processedAt: new Date(),
          },
        },
        {
          returnDocument: "after",
        }
      );

    if (pendingWebhookEvent) {
      console.log(
        "Pending Razorpay webhook marked as processed:",
        pendingWebhookEvent.eventId
      );
    }

    // ========================================================
    // SUCCESS RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Payment verified and order finalized successfully.",

        order: {
          id: createdOrder._id.toString(),

          orderNumber:
            createdOrder.orderNumber,

          subtotal:
            createdOrder.subtotal,

          discount:
            createdOrder.discount,

          shipping:
            createdOrder.shipping,

          total:
            createdOrder.total,

          couponCode:
            createdOrder.couponCode || "",

          paymentMethod:
            createdOrder.paymentMethod,

          paymentStatus:
            createdOrder.paymentStatus,

          orderStatus:
            createdOrder.orderStatus,

          paidAt:
            createdOrder.paidAt,

          razorpayOrderId:
            createdOrder.razorpayOrderId,

          razorpayPaymentId:
            createdOrder.razorpayPaymentId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Verify Razorpay payment error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Something went wrong while verifying the payment.",
      },
      { status: 500 }
    );
  }
}