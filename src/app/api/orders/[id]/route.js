import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import { isNotificationEnabled } from "@/lib/notificationSettings";

import OrderModel from "@/models/Order.model";
import OrderItemModel from "@/models/OrderItem.model";
import NotificationModel from "@/models/Notification.model";

// ============================================================
// CONSTANTS
// ============================================================

const CANCELLABLE_STATUSES = [
  "pending",
  "confirmed",
  "processing",
];

// ============================================================
// CUSTOM ERROR
// ============================================================

class RouteError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "RouteError";
    this.status = status;
  }
}

// ============================================================
// HELPERS
// ============================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const formatOrder = (order, items = []) => {
  return {
    id: order._id.toString(),

    orderNumber: order.orderNumber,

    createdAt: order.createdAt,
    updatedAt: order.updatedAt,

    shippingAddress: {
      fullName:
        order.shippingAddress?.fullName || "",

      phone:
        order.shippingAddress?.phone || "",

      addressLine1:
        order.shippingAddress?.addressLine1 || "",

      addressLine2:
        order.shippingAddress?.addressLine2 || "",

      city:
        order.shippingAddress?.city || "",

      state:
        order.shippingAddress?.state || "",

      postalCode:
        order.shippingAddress?.postalCode || "",

      country:
        order.shippingAddress?.country || "",
    },

    shippingDetails: {
      carrier:
        order.shippingDetails?.carrier || "",

      trackingNumber:
        order.shippingDetails?.trackingNumber || "",

      trackingUrl:
        order.shippingDetails?.trackingUrl || "",

      estimatedDeliveryDate:
        order.shippingDetails
          ?.estimatedDeliveryDate || null,

      shippedAt:
        order.shippingDetails?.shippedAt || null,

      outForDeliveryAt:
        order.shippingDetails
          ?.outForDeliveryAt || null,

      deliveredAt:
        order.shippingDetails
          ?.deliveredAt || null,
    },

    trackingEvents:
      Array.isArray(order.trackingEvents)
        ? [...order.trackingEvents]
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() -
              new Date(b.timestamp).getTime()
          )
          .map((event) => ({
            id:
              event._id?.toString(),

            status:
              event.status,

            title:
              event.title,

            description:
              event.description || "",

            location:
              event.location || "",

            timestamp:
              event.timestamp,
          }))
        : [],

    subtotal:
      order.subtotal,

    discount:
      order.discount,

    shipping:
      order.shipping,

    total:
      order.total,

    couponCode:
      order.couponCode || "",

    paymentMethod:
      order.paymentMethod,

    paymentStatus:
      order.paymentStatus,

    paidAt:
      order.paidAt || null,

    orderStatus:
      order.orderStatus,

    cancelledAt:
      order.cancelledAt || null,

    cancellationReason:
      order.cancellationReason || "",

    items:
      items.map((item) => ({
        id:
          item._id.toString(),

        product:
          item.product?.toString() || null,

        productName:
          item.productName,

        productImage:
          item.productImage || "",

        price:
          item.price,

        quantity:
          item.quantity,

        subtotal:
          item.subtotal,
      })),
  };
};

// ============================================================
// GET - CUSTOMER ORDER DETAILS
// ============================================================

export async function GET(
  request,
  { params }
) {
  try {
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
            "You must be logged in.",
        },
        { status: 401 }
      );
    }

    // ========================================================
    // PARAMS
    // ========================================================

    const { id } =
      await params;

    if (
      !id ||
      !isValidObjectId(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid order ID.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // GET ORDER
    // ========================================================

    const order =
      await OrderModel.findOne({
        _id: id,
        user: user.id,
      }).lean();

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order not found.",
        },
        { status: 404 }
      );
    }

    // ========================================================
    // GET ORDER ITEMS
    // ========================================================

    const orderItems =
      await OrderItemModel.find({
        order: order._id,
      })
        .sort({
          createdAt: 1,
        })
        .lean();

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        order:
          formatOrder(
            order,
            orderItems
          ),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Get customer order error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Something went wrong while fetching the order.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH - CUSTOMER ORDER ACTIONS
// ============================================================

export async function PATCH(
  request,
  { params }
) {
  const session =
    await mongoose.startSession();

  try {
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
            "You must be logged in.",
        },
        { status: 401 }
      );
    }

    // ========================================================
    // PARAMS
    // ========================================================

    const { id } =
      await params;

    if (
      !id ||
      !isValidObjectId(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid order ID.",
        },
        { status: 400 }
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
          message:
            "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const action =
      body?.action
        ?.toString()
        .trim()
        .toLowerCase();

    // ========================================================
    // ACTION CHECK
    // ========================================================

    if (
      action !== "cancel"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Invalid order action. Currently only "cancel" is supported.',
        },
        { status: 400 }
      );
    }

    // ========================================================
    // CANCELLATION REASON
    // ========================================================

    let cancellationReason =
      body?.cancellationReason
        ?.toString()
        .trim() || "";

    if (
      cancellationReason.length >
      300
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Cancellation reason cannot exceed 300 characters.",
        },
        { status: 400 }
      );
    }

    if (
      !cancellationReason
    ) {
      cancellationReason =
        "Order cancelled by customer.";
    }

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    let cancelledOrderId =
      null;

    // ========================================================
    // TRANSACTION
    // ========================================================

    await session.withTransaction(
      async () => {
        // ====================================================
        // FIND CUSTOMER ORDER
        // ====================================================

        const order =
          await OrderModel.findOne({
            _id: id,
            user: user.id,
          }).session(session);

        if (!order) {
          throw new RouteError(
            "Order not found.",
            404
          );
        }

        // ====================================================
        // CHECK CURRENT ORDER STATUS
        // ====================================================

        if (
          !CANCELLABLE_STATUSES.includes(
            order.orderStatus
          )
        ) {
          throw new RouteError(
            `This order cannot be cancelled because its current status is "${order.orderStatus}".`,
            409
          );
        }

        // ====================================================
        // PAYMENT CHECK
        // ====================================================

        if (
          order.paymentStatus ===
          "paid"
        ) {
          throw new RouteError(
            "This order cannot be cancelled because payment has already been completed.",
            409
          );
        }

        // ====================================================
        // GET ORDER ITEMS
        // ====================================================

        const orderItems =
          await OrderItemModel.find({
            order: order._id,
          })
            .session(session)
            .lean();

        if (
          !Array.isArray(
            orderItems
          ) ||
          orderItems.length === 0
        ) {
          throw new RouteError(
            "Order items could not be found. The order cannot be cancelled safely.",
            409
          );
        }

        // ====================================================
        // RESTORE PRODUCT STOCK
        // ====================================================

        for (
          const item of orderItems
        ) {
          const productId =
            item?.product?.toString();

          const quantity =
            Number(
              item?.quantity || 0
            );

          if (
            !productId ||
            !Number.isInteger(
              quantity
            ) ||
            quantity < 1
          ) {
            throw new RouteError(
              "Invalid order item data. The order cannot be cancelled safely.",
              409
            );
          }

          const stockUpdate =
            await mongoose
              .model("Product")
              .updateOne(
                {
                  _id:
                    productId,
                },
                {
                  $inc: {
                    stock:
                      quantity,
                  },
                }
              )
              .session(session);

          if (
            stockUpdate.modifiedCount !==
            1
          ) {
            throw new RouteError(
              "A product from this order is no longer available in inventory. The cancellation was not completed.",
              409
            );
          }
        }

        // ====================================================
        // RESTORE COUPON USAGE
        // ====================================================

        if (
          order.coupon
        ) {
          const couponUpdate =
            await mongoose
              .model("Coupon")
              .updateOne(
                {
                  _id:
                    order.coupon,

                  usedCount: {
                    $gt: 0,
                  },
                },
                {
                  $inc: {
                    usedCount:
                      -1,
                  },
                }
              )
              .session(session);

          if (
            couponUpdate.modifiedCount !==
            1
          ) {
            throw new RouteError(
              "The coupon usage could not be restored. The cancellation was not completed.",
              409
            );
          }
        }

        // ====================================================
        // UPDATE ORDER STATUS
        // ====================================================

        const now =
          new Date();

        order.orderStatus =
          "cancelled";

        order.cancelledAt =
          now;

        order.cancellationReason =
          cancellationReason;

        // ====================================================
        // ADD TRACKING EVENT
        // ====================================================

        order.trackingEvents.push({
          status:
            "cancelled",

          title:
            "Order cancelled",

          description:
            cancellationReason,

          location:
            order.shippingAddress
              ?.city || "",

          timestamp:
            now,
        });

        await order.save({
          session,
        });

        cancelledOrderId =
          order._id;
      }
    );

    // ========================================================
    // GET UPDATED ORDER
    // ========================================================

    const updatedOrder =
      await OrderModel.findOne({
        _id:
          cancelledOrderId,

        user:
          user.id,
      }).lean();

    if (!updatedOrder) {
      throw new Error(
        "Order was cancelled, but the updated order could not be fetched."
      );
    }

    // ========================================================
    // CREATE ORDER CANCELLED NOTIFICATION
    // ========================================================

    try {
      const orderCancelledEnabled =
        await isNotificationEnabled(
          "order_cancelled"
        );

      if (orderCancelledEnabled) {
        const existingNotification =
          await NotificationModel.findOne({
            type:
              "order_cancelled",

            relatedId:
              updatedOrder._id,

            isRead:
              false,
          }).lean();

        if (
          !existingNotification
        ) {
          await NotificationModel.create({
            type:
              "order_cancelled",

            title:
              "Order Cancelled",

            message:
              `Order #${updatedOrder.orderNumber} has been cancelled by the customer.`,

            relatedId:
              updatedOrder._id,

            link:
              "/admin/orders",

            isRead:
              false,

            readAt:
              null,
          });
        }
      }
    } catch (
    notificationError
    ) {
      console.error(
        "Create order cancellation notification error:",
        notificationError
      );
    }

    // ========================================================
    // GET UPDATED ORDER ITEMS
    // ========================================================

    const updatedOrderItems =
      await OrderItemModel.find({
        order:
          updatedOrder._id,
      })
        .sort({
          createdAt: 1,
        })
        .lean();

    // ========================================================
    // SUCCESS RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Your order has been cancelled successfully.",

        order:
          formatOrder(
            updatedOrder,
            updatedOrderItems
          ),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Cancel customer order error:",
      error
    );

    const status =
      error instanceof
        RouteError
        ? error.status
        : 500;

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Something went wrong while cancelling the order.",
      },
      { status }
    );
  } finally {
    await session.endSession();
  }
}