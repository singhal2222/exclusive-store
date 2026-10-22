import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import { isNotificationEnabled } from "@/lib/notificationSettings";

import OrderModel from "@/models/Order.model";
import OrderItemModel from "@/models/OrderItem.model";
import NotificationModel from "@/models/Notification.model";

// ============================================================
// CONSTANTS
// ============================================================

const VALID_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const VALID_PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
];

// ============================================================
// HELPER - FORMAT ORDER STATUS
// ============================================================

function formatOrderStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

// ============================================================
// HELPER - FORMAT ORDER
// ============================================================

async function formatOrder(order) {
  const orderItems = await OrderItemModel.find({
    order: order._id,
  })
    .sort({ createdAt: 1 })
    .lean();

  const formattedItems = orderItems.map((item) => ({
    id: item._id.toString(),

    product: item.product
      ? item.product.toString()
      : null,

    productName: item.productName,

    productImage: item.productImage || "",

    price: item.price,

    quantity: item.quantity,

    subtotal: item.subtotal,

    // ============================================================
    // POS / WHOLESALE LINE ITEM SNAPSHOT
    // Only populated for POS orders; null / 0 for online orders
    // ============================================================

    mrp: item.mrp ?? null,

    wholesaleDiscountPercentage:
      item.wholesaleDiscountPercentage ?? 0,

    wholesaleDiscountAmount:
      item.wholesaleDiscountAmount ?? 0,

    unitPrice: item.unitPrice ?? null,
  }));

  // ============================================================
  // CUSTOMER RESOLUTION
  //
  // - Online orders: resolve from populated user
  // - POS orders:    resolve from posMetadata (walk-in)
  // ============================================================

  const isPos = order.source === "pos";

  let customer;

  if (isPos) {
    const meta = order.posMetadata || {};

    customer = {
      id: null,
      name:
        meta.customerName?.trim() ||
        (meta.walkInCustomer
          ? "Walk-in Customer"
          : "POS Customer"),
      email: "",
      phone: meta.customerPhone?.trim() || "",
    };
  } else {
    customer = {
      id: order.user?._id
        ? order.user._id.toString()
        : null,
      name:
        order.user?.name || "Unknown Customer",
      email:
        order.user?.email || "",
      phone:
        order.user?.phone || "",
    };
  }

  return {
    id: order._id.toString(),

    orderNumber: order.orderNumber,

    customer,

    items: formattedItems,

    subtotal: order.subtotal,

    discount: order.discount,

    shipping: order.shipping,

    total: order.total,

    coupon: order.coupon
      ? order.coupon.toString()
      : null,

    couponCode:
      order.couponCode || "",

    paymentMethod:
      order.paymentMethod,

    paymentStatus:
      order.paymentStatus,

    orderStatus:
      order.orderStatus,

    shippingAddress:
      order.shippingAddress || null,

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
        order.shippingDetails?.outForDeliveryAt || null,

      deliveredAt:
        order.shippingDetails?.deliveredAt || null,
    },

    trackingEvents:
      (order.trackingEvents || []).map(
        (event) => ({
          id: event._id
            ? event._id.toString()
            : null,

          status: event.status,

          title: event.title,

          description:
            event.description || "",

          location:
            event.location || "",

          timestamp:
            event.timestamp,
        })
      ),

    razorpayOrderId:
      order.razorpayOrderId || "",

    razorpayPaymentId:
      order.razorpayPaymentId || "",

    razorpaySignature:
      order.razorpaySignature || "",

    paidAt:
      order.paidAt || null,

    cancelledAt:
      order.cancelledAt || null,

    cancellationReason:
      order.cancellationReason || "",

    createdAt:
      order.createdAt,

    updatedAt:
      order.updatedAt,

    // ============================================================
    // POS FIELDS
    // ============================================================

    source:
      order.source || "online",

    customerType:
      order.customerType || null,

    posMetadata: isPos
      ? {
        billNumber:
          order.posMetadata?.billNumber || "",
        cashierId:
          order.posMetadata?.cashierId
            ?.toString() || null,
        cashierName:
          order.posMetadata?.cashierName || "",
        walkInCustomer:
          Boolean(
            order.posMetadata?.walkInCustomer
          ),
        customerName:
          order.posMetadata?.customerName || "",
        customerPhone:
          order.posMetadata?.customerPhone || "",
        paymentMethod:
          order.posMetadata?.paymentMethod ||
          null,
        totalWholesaleDiscount:
          Number(
            order.posMetadata
              ?.totalWholesaleDiscount || 0
          ),
      }
      : null,
  };
}

// ============================================================
// HELPER - TRACKING TITLE
// ============================================================

function getTrackingTitle(status) {
  switch (status) {
    case "pending":
      return "Order placed";

    case "confirmed":
      return "Order confirmed";

    case "processing":
      return "Order is being processed";

    case "shipped":
      return "Order shipped";

    case "out_for_delivery":
      return "Out for delivery";

    case "delivered":
      return "Order delivered";

    case "cancelled":
      return "Order cancelled";

    default:
      return "Order updated";
  }
}

// ============================================================
// GET - SINGLE ORDER DETAILS
// ============================================================

export async function GET(request, { params }) {
  try {
    // ============================================================
    // AUTHENTICATION
    // ============================================================

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    // ============================================================
    // ADMIN ACCESS
    // ============================================================

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    // ============================================================
    // GET ORDER ID
    // ============================================================

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // VALIDATE OBJECT ID
    // ============================================================

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order ID.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // CONNECT DATABASE
    // ============================================================

    await connectDB();

    // ============================================================
    // FETCH ORDER
    // ============================================================

    const order = await OrderModel.findById(id)
      .populate({
        path: "user",
        select: "name email phone",
      })
      .lean();

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    // ============================================================
    // FORMAT ORDER
    // ============================================================

    const formattedOrder =
      await formatOrder(order);

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,
        order: formattedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/admin/orders/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch order details.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH - UPDATE ORDER / SHIPPING
// ============================================================

export async function PATCH(request, { params }) {
  try {
    // ============================================================
    // AUTHENTICATION
    // ============================================================

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    // ============================================================
    // ADMIN ACCESS
    // ============================================================

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    // ============================================================
    // GET ORDER ID
    // ============================================================

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // VALIDATE OBJECT ID
    // ============================================================

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order ID.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // REQUEST BODY
    // ============================================================

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

    const {
      orderStatus,
      paymentStatus,
      carrier,
      trackingNumber,
      trackingUrl,
      estimatedDeliveryDate,
      trackingDescription,
      trackingLocation,
    } = body || {};

    // ============================================================
    // VALIDATE ORDER STATUS
    // ============================================================

    if (
      orderStatus !== undefined &&
      !VALID_ORDER_STATUSES.includes(orderStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order status.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // VALIDATE PAYMENT STATUS
    // ============================================================

    if (
      paymentStatus !== undefined &&
      !VALID_PAYMENT_STATUSES.includes(paymentStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment status.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // VALIDATE TRACKING URL
    // ============================================================

    let normalizedTrackingUrl = "";

    if (trackingUrl !== undefined) {
      normalizedTrackingUrl =
        String(trackingUrl).trim();

      if (normalizedTrackingUrl) {
        try {
          const parsedUrl = new URL(
            normalizedTrackingUrl
          );

          if (
            parsedUrl.protocol !== "http:" &&
            parsedUrl.protocol !== "https:"
          ) {
            throw new Error(
              "Invalid tracking URL protocol."
            );
          }
        } catch {
          return NextResponse.json(
            {
              success: false,
              message:
                "Please provide a valid tracking URL.",
            },
            { status: 400 }
          );
        }
      }
    }

    // ============================================================
    // VALIDATE ESTIMATED DELIVERY DATE
    // ============================================================

    let normalizedEstimatedDeliveryDate = null;

    if (estimatedDeliveryDate !== undefined) {
      if (
        estimatedDeliveryDate === "" ||
        estimatedDeliveryDate === null
      ) {
        normalizedEstimatedDeliveryDate = null;
      } else {
        const parsedDate = new Date(
          estimatedDeliveryDate
        );

        if (
          Number.isNaN(parsedDate.getTime())
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid estimated delivery date.",
            },
            { status: 400 }
          );
        }

        normalizedEstimatedDeliveryDate =
          parsedDate;
      }
    }

    // ============================================================
    // CONNECT DATABASE
    // ============================================================

    await connectDB();

    // ============================================================
    // FETCH CURRENT ORDER
    // ============================================================

    const order =
      await OrderModel.findById(id);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    // ============================================================
    // STORE OLD STATUS
    // ============================================================

    const previousOrderStatus =
      order.orderStatus;

    // ============================================================
    // UPDATE ORDER STATUS
    // ============================================================

    if (orderStatus !== undefined) {
      order.orderStatus = orderStatus;
    }

    // ============================================================
    // UPDATE PAYMENT STATUS
    // ============================================================

    if (paymentStatus !== undefined) {
      order.paymentStatus = paymentStatus;

      if (
        paymentStatus === "paid" &&
        !order.paidAt
      ) {
        order.paidAt = new Date();
      }

      if (
        paymentStatus !== "paid" &&
        paymentStatus !== "refunded"
      ) {
        order.paidAt = null;
      }
    }

    // ============================================================
    // UPDATE SHIPPING DETAILS
    // ============================================================

    if (
      order.shippingDetails === undefined ||
      order.shippingDetails === null
    ) {
      order.shippingDetails = {};
    }

    if (carrier !== undefined) {
      order.shippingDetails.carrier =
        String(carrier).trim();
    }

    if (trackingNumber !== undefined) {
      order.shippingDetails.trackingNumber =
        String(trackingNumber).trim();
    }

    if (trackingUrl !== undefined) {
      order.shippingDetails.trackingUrl =
        normalizedTrackingUrl;
    }

    if (
      estimatedDeliveryDate !== undefined
    ) {
      order.shippingDetails.estimatedDeliveryDate =
        normalizedEstimatedDeliveryDate;
    }

    // ============================================================
    // UPDATE AUTOMATIC SHIPPING DATES
    // ============================================================

    const now = new Date();

    if (
      orderStatus === "shipped" &&
      previousOrderStatus !== "shipped"
    ) {
      order.shippingDetails.shippedAt =
        order.shippingDetails.shippedAt || now;
    }

    if (
      orderStatus === "out_for_delivery" &&
      previousOrderStatus !== "out_for_delivery"
    ) {
      order.shippingDetails.outForDeliveryAt =
        order.shippingDetails.outForDeliveryAt ||
        now;
    }

    if (
      orderStatus === "delivered" &&
      previousOrderStatus !== "delivered"
    ) {
      order.shippingDetails.deliveredAt =
        order.shippingDetails.deliveredAt || now;
    }

    if (orderStatus === "cancelled") {
      order.cancelledAt =
        order.cancelledAt || now;
    }

    // ============================================================
    // ADD TRACKING EVENT WHEN ORDER STATUS CHANGES
    // ============================================================

    const orderStatusChanged =
      orderStatus !== undefined &&
      orderStatus !== previousOrderStatus;

    if (orderStatusChanged) {
      const trackingTitle =
        getTrackingTitle(orderStatus);

      let description =
        trackingDescription !== undefined
          ? String(
            trackingDescription
          ).trim()
          : "";

      let location =
        trackingLocation !== undefined
          ? String(
            trackingLocation
          ).trim()
          : "";

      // ==========================================================
      // DEFAULT TRACKING DESCRIPTIONS
      // ==========================================================

      if (!description) {
        switch (orderStatus) {
          case "pending":
            description =
              "Your order has been placed and is waiting for confirmation.";
            break;

          case "confirmed":
            description =
              "Your order has been confirmed.";
            break;

          case "processing":
            description =
              "Your order is being prepared for shipment.";
            break;

          case "shipped":
            description =
              "Your order has been shipped.";
            break;

          case "out_for_delivery":
            description =
              "Your order is out for delivery.";
            break;

          case "delivered":
            description =
              "Your order has been delivered successfully.";
            break;

          case "cancelled":
            description =
              "Your order has been cancelled.";
            break;

          default:
            description =
              "Order status updated.";
        }
      }

      // ==========================================================
      // DEFAULT LOCATION
      // ==========================================================

      if (!location) {
        location =
          order.shippingAddress?.city || "";
      }

      order.trackingEvents.push({
        status: orderStatus,

        title: trackingTitle,

        description,

        location,

        timestamp: now,
      });
    }

    // ============================================================
    // SAVE ORDER
    // ============================================================

    await order.save();

    // ============================================================
    // CREATE ORDER STATUS NOTIFICATION
    // ============================================================

    if (
      orderStatusChanged &&
      orderStatus !== "cancelled"
    ) {
      try {
        const notificationEnabled =
          await isNotificationEnabled(
            "order_status"
          );

        if (notificationEnabled) {
          const previousStatusLabel =
            formatOrderStatus(
              previousOrderStatus
            );

          const newStatusLabel =
            formatOrderStatus(orderStatus);

          await NotificationModel.create({
            type: "order_status",

            title: "Order Status Updated",

            message:
              `Order #${order.orderNumber} status changed ` +
              `from ${previousStatusLabel} to ${newStatusLabel}.`,

            relatedId: order._id,

            link: "/admin/orders",

            isRead: false,

            readAt: null,
          });
        }
      } catch (notificationError) {
        console.error(
          "Create order status notification error:",
          notificationError
        );
      }
    }

    // ============================================================
    // FETCH UPDATED ORDER
    // ============================================================

    const updatedOrder =
      await OrderModel.findById(id)
        .populate({
          path: "user",
          select: "name email phone",
        })
        .lean();

    if (!updatedOrder) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order was updated but could not be fetched again.",
        },
        { status: 500 }
      );
    }

    // ============================================================
    // FORMAT UPDATED ORDER
    // ============================================================

    const formattedOrder =
      await formatOrder(updatedOrder);

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Order updated successfully.",

        order: formattedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PATCH /api/admin/orders/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update order.",
      },
      { status: 500 }
    );
  }
}