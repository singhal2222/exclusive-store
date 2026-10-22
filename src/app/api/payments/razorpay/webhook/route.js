import crypto from "crypto";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";

import CartModel from "@/models/Cart.model";
import CouponModel from "@/models/Coupon.model";
import OrderModel from "@/models/Order.model";
import OrderItemModel from "@/models/OrderItem.model";
import ProductModel from "@/models/Product.model";
import RazorpayWebhookEventModel from "@/models/RazorpayWebhookEvent.model";

// ============================================================
// RUNTIME
// ============================================================

export const runtime = "nodejs";

// ============================================================
// ENVIRONMENT VARIABLE
// ============================================================

const RAZORPAY_WEBHOOK_SECRET =
  process.env.RAZORPAY_WEBHOOK_SECRET;

// ============================================================
// VERIFY WEBHOOK SIGNATURE
// ============================================================

const verifyWebhookSignature = (
  rawBody,
  signature
) => {
  if (
    !RAZORPAY_WEBHOOK_SECRET ||
    !signature
  ) {
    return false;
  }

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        RAZORPAY_WEBHOOK_SECRET
      )
      .update(rawBody)
      .digest("hex");

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      "utf8"
    );

  const receivedBuffer =
    Buffer.from(
      signature,
      "utf8"
    );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
};

// ============================================================
// CONVERT RAZORPAY TIMESTAMP
// ============================================================

const getEventDate = (createdAt) => {
  if (
    typeof createdAt !== "number" ||
    createdAt <= 0
  ) {
    return new Date();
  }

  return new Date(
    createdAt * 1000
  );
};

// ============================================================
// POST - RAZORPAY WEBHOOK
// ============================================================

export async function POST(request) {
  try {
    // ========================================================
    // CHECK WEBHOOK SECRET
    // ========================================================

    if (!RAZORPAY_WEBHOOK_SECRET) {
      console.error(
        "RAZORPAY_WEBHOOK_SECRET is missing."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Webhook is not configured on the server.",
        },
        { status: 500 }
      );
    }

    // ========================================================
    // READ RAW BODY
    // ========================================================

    const rawBody =
      await request.text();

    if (!rawBody) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Empty webhook request.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // GET RAZORPAY SIGNATURE
    // ========================================================

    const razorpaySignature =
      request.headers.get(
        "x-razorpay-signature"
      );

    if (!razorpaySignature) {
      console.error(
        "Razorpay webhook signature is missing."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Webhook signature is missing.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // VERIFY SIGNATURE
    // ========================================================

    const signatureValid =
      verifyWebhookSignature(
        rawBody,
        razorpaySignature
      );

    if (!signatureValid) {
      console.error(
        "Invalid Razorpay webhook signature."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid webhook signature.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // PARSE PAYLOAD
    // ========================================================

    let payload;

    try {
      payload =
        JSON.parse(rawBody);
    } catch {
      console.error(
        "Invalid Razorpay webhook JSON."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid webhook payload.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // EVENT INFORMATION
    // ========================================================

    const event =
      payload?.event || "";

    const eventId =
      request.headers.get(
        "x-razorpay-event-id"
      ) || "";

    console.log(
      "Razorpay webhook received:",
      {
        event,
        eventId,
      }
    );

    // ========================================================
    // EVENT ID IS REQUIRED
    // ========================================================

    if (!eventId) {
      console.error(
        "Razorpay webhook event ID is missing."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Webhook event ID is missing.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // CONNECT DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // CHECK EXISTING WEBHOOK EVENT
    // ========================================================

    const existingEvent =
      await RazorpayWebhookEventModel.findOne({
        eventId,
      });

    // ========================================================
    // PROCESSED EVENT
    // ========================================================

    if (
      existingEvent &&
      existingEvent.status ===
        "processed"
    ) {
      console.log(
        "Duplicate processed Razorpay webhook ignored:",
        eventId
      );

      return NextResponse.json(
        {
          success: true,
          message:
            "Webhook already processed.",
        },
        { status: 200 }
      );
    }

    // ========================================================
    // PENDING EVENT
    // ========================================================

    if (
      existingEvent &&
      existingEvent.status ===
        "pending"
    ) {
      console.log(
        "Retrying pending Razorpay webhook:",
        eventId
      );
    }

    // ========================================================
    // PAYMENT CAPTURED
    // ========================================================

    if (
      event === "payment.captured"
    ) {
      const paymentEntity =
        payload?.payload
          ?.payment?.entity;

      if (!paymentEntity) {
        console.error(
          "payment.captured payload is missing payment entity."
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid payment.captured payload.",
          },
          { status: 400 }
        );
      }

      const razorpayPaymentId =
        paymentEntity?.id
          ?.toString()
          .trim() || "";

      const razorpayOrderId =
        paymentEntity?.order_id
          ?.toString()
          .trim() || "";

      const paymentStatus =
        paymentEntity?.status
          ?.toString()
          .toLowerCase() || "";

      const capturedAmount =
        Number(
          paymentEntity?.amount || 0
        );

      const currency =
        paymentEntity?.currency
          ?.toString()
          .trim()
          .toUpperCase() || "";

      // ------------------------------------------------------
      // BASIC VALIDATION
      // ------------------------------------------------------

      if (
        !razorpayPaymentId ||
        !razorpayOrderId
      ) {
        console.error(
          "payment.captured is missing order/payment ID."
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid payment.captured data.",
          },
          { status: 400 }
        );
      }

      // ------------------------------------------------------
      // PAYMENT STATUS
      // ------------------------------------------------------

      if (
        paymentStatus &&
        paymentStatus !== "captured"
      ) {
        console.warn(
          "payment.captured received with unexpected status:",
          paymentStatus
        );
      }

      // ------------------------------------------------------
      // CURRENCY VALIDATION
      // ------------------------------------------------------

      if (
        currency &&
        currency !== "INR"
      ) {
        console.error(
          "Invalid Razorpay payment currency:",
          currency
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid payment currency.",
          },
          { status: 400 }
        );
      }

      // ------------------------------------------------------
      // FIND LOCAL ORDER
      // ------------------------------------------------------

      const order =
        await OrderModel.findOne({
          razorpayOrderId,
        });

      // ======================================================
      // LOCAL ORDER DOES NOT EXIST YET
      // ======================================================

      if (!order) {
        console.warn(
          "No local order found for captured Razorpay order:",
          razorpayOrderId
        );

        if (!existingEvent) {
          await RazorpayWebhookEventModel.create({
            eventId,
            event,
            razorpayOrderId,
            razorpayPaymentId,
            status: "pending",
            processedAt: null,
          });
        } else {
          await RazorpayWebhookEventModel.findOneAndUpdate(
            {
              eventId,
            },
            {
              $set: {
                event,
                razorpayOrderId,
                razorpayPaymentId,
                status: "pending",
                processedAt: null,
              },
            },
            {
              returnDocument: "after",
            }
          );
        }

        console.log(
          "Razorpay webhook stored as pending:",
          {
            eventId,
            razorpayOrderId,
            razorpayPaymentId,
          }
        );

        return NextResponse.json(
          {
            success: true,
            message:
              "Webhook received and stored as pending.",
          },
          { status: 200 }
        );
      }

      // ======================================================
      // ALREADY FINALIZED ORDER
      // ======================================================

      if (
        order.paymentStatus ===
          "paid" &&
        order.orderStatus !==
          "cancelled"
      ) {
        await RazorpayWebhookEventModel.findOneAndUpdate(
          {
            eventId,
          },
          {
            $set: {
              event,
              razorpayOrderId,
              razorpayPaymentId,
              status: "processed",
              processedAt: new Date(),
            },
          },
          {
            upsert: true,
            returnDocument: "after",
          }
        );

        console.log(
          "Razorpay order was already finalized:",
          {
            orderId:
              order._id.toString(),

            orderNumber:
              order.orderNumber,
          }
        );

        return NextResponse.json(
          {
            success: true,
            message:
              "Order was already finalized.",
          },
          { status: 200 }
        );
      }

      // ======================================================
      // VERIFY PAYMENT AMOUNT
      // ======================================================

      const expectedAmount =
        Math.round(
          Number(
            order.total || 0
          ) * 100
        );

      if (
        !Number.isSafeInteger(
          expectedAmount
        ) ||
        expectedAmount <= 0
      ) {
        console.error(
          "Invalid local order amount:",
          {
            orderId:
              order._id.toString(),

            total:
              order.total,
          }
        );

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
        capturedAmount !==
        expectedAmount
      ) {
        console.error(
          "Razorpay webhook amount mismatch:",
          {
            razorpayOrderId,
            capturedAmount,
            expectedAmount,
          }
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Webhook payment amount does not match the local order.",
          },
          { status: 400 }
        );
      }

      // ======================================================
      // FINALIZE PENDING ORDER
      // ======================================================

      const session =
        await mongoose.startSession();

      try {
        await session.withTransaction(
          async () => {
            // ------------------------------------------------
            // RELOAD ORDER INSIDE TRANSACTION
            // ------------------------------------------------

            const orderInTransaction =
              await OrderModel.findOne({
                _id:
                  order._id,

                razorpayOrderId,
              }).session(session);

            if (
              !orderInTransaction
            ) {
              throw new Error(
                "Local order could not be found during payment finalization."
              );
            }

            // ------------------------------------------------
            // PREVENT DUPLICATE FINALIZATION
            // ------------------------------------------------

            if (
              orderInTransaction.paymentStatus ===
              "paid"
            ) {
              return;
            }

            // ------------------------------------------------
            // GET ORDER ITEMS
            // ------------------------------------------------

            const orderItems =
              await OrderItemModel.find({
                order:
                  orderInTransaction._id,
              })
                .session(session)
                .lean();

            if (
              !orderItems.length
            ) {
              throw new Error(
                "Order items are missing for the pending payment."
              );
            }

            // ------------------------------------------------
            // REDUCE STOCK
            // ------------------------------------------------

            for (
              const orderItem of orderItems
            ) {
              const productId =
                orderItem?.product;

              const quantity =
                Number(
                  orderItem?.quantity ||
                    0
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
                    _id:
                      productId,

                    isActive:
                      true,

                    stock: {
                      $gte:
                        quantity,
                    },
                  },
                  {
                    $inc: {
                      stock:
                        -quantity,
                    },
                  },
                  {
                    returnDocument:
                      "after",

                    session,
                  }
                );

              if (
                !updatedProduct
              ) {
                throw new Error(
                  `Insufficient stock while finalizing ${orderItem.productName}.`
                );
              }
            }

            // ------------------------------------------------
            // INCREMENT COUPON USAGE
            // ------------------------------------------------

            if (
              orderInTransaction.coupon
            ) {
              const couponFilter = {
                _id:
                  orderInTransaction.coupon,

                isActive:
                  true,
              };

              if (
                orderInTransaction.couponCode
              ) {
                couponFilter.code =
                  orderInTransaction.couponCode;
              }

              const coupon =
                await CouponModel.findOne(
                  couponFilter
                )
                  .session(session)
                  .lean();

              if (!coupon) {
                throw new Error(
                  "The coupon attached to this order is no longer valid."
                );
              }

              if (
                coupon.usageLimit !=
                  null &&
                Number(
                  coupon.usedCount ||
                    0
                ) >=
                  Number(
                    coupon.usageLimit
                  )
              ) {
                throw new Error(
                  "The coupon usage limit has been reached."
                );
              }

              const couponUpdateFilter = {
                _id:
                  coupon._id,

                isActive:
                  true,

                ...(coupon.usageLimit !=
                null
                  ? {
                      usedCount: {
                        $lt: Number(
                          coupon.usageLimit
                        ),
                      },
                    }
                  : {}),
              };

              const updatedCoupon =
                await CouponModel.findOneAndUpdate(
                  couponUpdateFilter,
                  {
                    $inc: {
                      usedCount:
                        1,
                    },
                  },
                  {
                    returnDocument:
                      "after",

                    session,
                  }
                );

              if (
                !updatedCoupon
              ) {
                throw new Error(
                  "The coupon usage limit was reached while finalizing the payment."
                );
              }
            }

            // ------------------------------------------------
            // CLEAR USER CART
            // ------------------------------------------------

            await CartModel.deleteOne(
              {
                user:
                  orderInTransaction.user,
              },
              {
                session,
              }
            );

            // ------------------------------------------------
            // UPDATE ORDER
            // ------------------------------------------------

            orderInTransaction.paymentStatus =
              "paid";

            orderInTransaction.paymentMethod =
              "razorpay";

            orderInTransaction.orderStatus =
              "confirmed";

            orderInTransaction.razorpayPaymentId =
              razorpayPaymentId;

            orderInTransaction.paidAt =
              getEventDate(
                payload?.created_at
              );

            orderInTransaction.cancelledAt =
              null;

            orderInTransaction.cancellationReason =
              "";

            if (
              !Array.isArray(
                orderInTransaction.trackingEvents
              )
            ) {
              orderInTransaction.trackingEvents =
                [];
            }

            const hasConfirmedEvent =
              orderInTransaction.trackingEvents.some(
                (trackingEvent) =>
                  trackingEvent?.status ===
                    "confirmed" &&
                  trackingEvent?.title ===
                    "Order confirmed"
              );

            if (
              !hasConfirmedEvent
            ) {
              orderInTransaction.trackingEvents.push(
                {
                  status:
                    "confirmed",

                  title:
                    "Order confirmed",

                  description:
                    "Your payment was received and your order has been confirmed.",

                  location:
                    orderInTransaction
                      .shippingAddress
                      ?.city || "",

                  timestamp:
                    getEventDate(
                      payload?.created_at
                    ),
                }
              );
            }

            await orderInTransaction.save({
              session,
            });
          }
        );
      } finally {
        await session.endSession();
      }

      // ======================================================
      // SAVE / UPDATE WEBHOOK AS PROCESSED
      // ======================================================

      await RazorpayWebhookEventModel.findOneAndUpdate(
        {
          eventId,
        },
        {
          $set: {
            event,
            razorpayOrderId,
            razorpayPaymentId,
            status: "processed",
            processedAt: new Date(),
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        }
      );

      console.log(
        "Razorpay payment captured and pending order finalized:",
        {
          eventId,

          razorpayOrderId,

          razorpayPaymentId,

          orderId:
            order._id.toString(),

          orderNumber:
            order.orderNumber,
        }
      );

      return NextResponse.json(
        {
          success: true,
          message:
            "Payment captured and order finalized successfully.",
        },
        { status: 200 }
      );
    }

    // ========================================================
    // PAYMENT FAILED
    // ========================================================

    if (
      event === "payment.failed"
    ) {
      const paymentEntity =
        payload?.payload
          ?.payment?.entity;

      if (!paymentEntity) {
        console.error(
          "payment.failed payload is missing payment entity."
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid payment.failed payload.",
          },
          { status: 400 }
        );
      }

      const razorpayPaymentId =
        paymentEntity?.id
          ?.toString()
          .trim() || "";

      const razorpayOrderId =
        paymentEntity?.order_id
          ?.toString()
          .trim() || "";

      const errorDescription =
        paymentEntity?.error_description ||
        paymentEntity?.error_reason ||
        "Razorpay payment failed.";

      console.warn(
        "Razorpay payment failed:",
        {
          razorpayOrderId,
          razorpayPaymentId,
          errorDescription,
        }
      );

      // ------------------------------------------------------
      // FIND LOCAL ORDER
      // ------------------------------------------------------

      const order =
        razorpayOrderId
          ? await OrderModel.findOne({
              razorpayOrderId,
            })
          : null;

      if (order) {
        if (
          order.paymentStatus !==
          "paid"
        ) {
          order.paymentStatus =
            "failed";

          order.razorpayPaymentId =
            razorpayPaymentId;

          order.orderStatus =
            "cancelled";

          order.cancelledAt =
            new Date();

          order.cancellationReason =
            "Razorpay payment failed.";

          if (
            !Array.isArray(
              order.trackingEvents
            )
          ) {
            order.trackingEvents =
              [];
          }

          const hasFailedEvent =
            order.trackingEvents.some(
              (trackingEvent) =>
                trackingEvent?.status ===
                  "cancelled" &&
                trackingEvent?.title ===
                  "Payment failed"
            );

          if (
            !hasFailedEvent
          ) {
            order.trackingEvents.push(
              {
                status:
                  "cancelled",

                title:
                  "Payment failed",

                description:
                  "The Razorpay payment was not completed.",

                location:
                  order.shippingAddress
                    ?.city || "",

                timestamp:
                  new Date(),
              }
            );
          }

          await order.save();
        }
      }

      // ------------------------------------------------------
      // SAVE / UPDATE FAILED EVENT
      // ------------------------------------------------------

      await RazorpayWebhookEventModel.findOneAndUpdate(
        {
          eventId,
        },
        {
          $set: {
            event,
            razorpayOrderId,
            razorpayPaymentId,

            status: order
              ? "processed"
              : "pending",

            processedAt: order
              ? new Date()
              : null,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        }
      );

      return NextResponse.json(
        {
          success: true,
          message:
            "payment.failed processed successfully.",
        },
        { status: 200 }
      );
    }

    // ========================================================
    // UNHANDLED EVENT
    // ========================================================

    console.log(
      "Razorpay webhook event ignored:",
      event
    );

    await RazorpayWebhookEventModel.findOneAndUpdate(
      {
        eventId,
      },
      {
        $set: {
          event,
          status: "processed",
          processedAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Webhook received and acknowledged.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Razorpay webhook error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}