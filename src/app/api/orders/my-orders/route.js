import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import OrderModel from "@/models/Order.model";
import OrderItemModel from "@/models/OrderItem.model";

export async function GET(request) {
  try {
    // ============================================================
    // AUTHENTICATION
    // ============================================================

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    // ============================================================
    // PAGINATION
    // ============================================================

    const { searchParams } = new URL(request.url);

    const pageParam =
      Number(searchParams.get("page")) || 1;

    const limitParam =
      Number(searchParams.get("limit")) || 10;

    const page = Math.max(pageParam, 1);

    const limit = Math.min(
      Math.max(limitParam, 1),
      50
    );

    const skip = (page - 1) * limit;

    // ============================================================
    // DATABASE
    // ============================================================

    await connectDB();

    // ============================================================
    // GET USER ORDERS
    // ============================================================

    const [orders, total] = await Promise.all([
      OrderModel.find({
        user: user.id,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      OrderModel.countDocuments({
        user: user.id,
      }),
    ]);

    // ============================================================
    // GET ORDER ITEMS
    // ============================================================

    const orderIds = orders.map(
      (order) => order._id
    );

    let orderItems = [];

    if (orderIds.length > 0) {
      orderItems = await OrderItemModel.find({
        order: {
          $in: orderIds,
        },
      })
        .sort({ createdAt: 1 })
        .lean();
    }

    // ============================================================
    // GROUP ITEMS BY ORDER
    // ============================================================

    const itemsByOrder = {};

    for (const item of orderItems) {
      const orderId = item.order.toString();

      if (!itemsByOrder[orderId]) {
        itemsByOrder[orderId] = [];
      }

      itemsByOrder[orderId].push({
        id: item._id.toString(),

        product:
          item.product?.toString() || null,

        productName: item.productName,

        productImage:
          item.productImage || "",

        price: item.price,

        quantity: item.quantity,

        subtotal: item.subtotal,
      });
    }

    // ============================================================
    // FORMAT ORDERS
    // ============================================================

    const formattedOrders = orders.map((order) => {
      const orderId = order._id.toString();

      // ----------------------------------------------------------
      // SHIPPING DETAILS
      // ----------------------------------------------------------

      const shippingDetails = {
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
          order.shippingDetails?.shippedAt ||
          null,

        outForDeliveryAt:
          order.shippingDetails?.outForDeliveryAt ||
          null,

        deliveredAt:
          order.shippingDetails?.deliveredAt ||
          null,
      };

      // ----------------------------------------------------------
      // TRACKING EVENTS
      // ----------------------------------------------------------

      const trackingEvents = Array.isArray(
        order.trackingEvents
      )
        ? [...order.trackingEvents]
            .sort(
              (a, b) =>
                new Date(a.timestamp) -
                new Date(b.timestamp)
            )
            .map((event) => ({
              id: event._id
                ? event._id.toString()
                : null,

              status: event.status,

              title: event.title,

              description:
                event.description || "",

              location:
                event.location || "",

              timestamp: event.timestamp,
            }))
        : [];

      return {
        id: orderId,

        orderNumber:
          order.orderNumber,

        createdAt:
          order.createdAt,

        updatedAt:
          order.updatedAt,

        // --------------------------------------------------------
        // SHIPPING
        // --------------------------------------------------------

        shippingAddress:
          order.shippingAddress || null,

        shippingDetails,

        trackingEvents,

        // --------------------------------------------------------
        // PRICING
        // --------------------------------------------------------

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

        // --------------------------------------------------------
        // PAYMENT
        // --------------------------------------------------------

        paymentMethod:
          order.paymentMethod,

        paymentStatus:
          order.paymentStatus,

        paidAt:
          order.paidAt || null,

        // --------------------------------------------------------
        // ORDER STATUS
        // --------------------------------------------------------

        orderStatus:
          order.orderStatus,

        // --------------------------------------------------------
        // CANCELLATION
        // --------------------------------------------------------

        cancelledAt:
          order.cancelledAt || null,

        cancellationReason:
          order.cancellationReason || "",

        // --------------------------------------------------------
        // ITEMS
        // --------------------------------------------------------

        items:
          itemsByOrder[orderId] || [],
      };
    });

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        orders: formattedOrders,

        pagination: {
          page,

          limit,

          total,

          totalPages: Math.ceil(
            total / limit
          ),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/orders/my-orders error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch your orders.",
      },
      { status: 500 }
    );
  }
}