import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import OrderModel from "@/models/Order.model";
import OrderItemModel from "@/models/OrderItem.model";
import UserModel from "@/models/User.model";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

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

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export async function GET(request) {
  try {
    // ============================================================
    // AUTHENTICATION + ADMIN ACCESS
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
    // QUERY PARAMETERS
    // ============================================================

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";

    const status =
      searchParams.get("status")?.trim().toLowerCase() || "";

    const paymentStatus =
      searchParams.get("paymentStatus")?.trim().toLowerCase() || "";

    const requestedPage =
      Number(searchParams.get("page")) || 1;

    const requestedLimit =
      Number(searchParams.get("limit")) || DEFAULT_LIMIT;

    const page = Math.max(requestedPage, 1);

    const limit = Math.min(
      Math.max(requestedLimit, 1),
      MAX_LIMIT
    );

    const skip = (page - 1) * limit;

    // ============================================================
    // VALIDATE FILTERS
    // ============================================================

    if (
      status &&
      !VALID_ORDER_STATUSES.includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order status.",
        },
        { status: 400 }
      );
    }

    if (
      paymentStatus &&
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
    // DATABASE
    // ============================================================

    await connectDB();

    // ============================================================
    // BUILD ORDER FILTER
    // ============================================================

    const orderFilter = {};

    if (status) {
      orderFilter.orderStatus = status;
    }

    if (paymentStatus) {
      orderFilter.paymentStatus = paymentStatus;
    }

    // ============================================================
    // SEARCH
    // Matches:
    // - Order Number          (online + POS)
    // - POS bill number       (POS)
    // - POS customer name     (POS)
    // - POS customer phone    (POS)
    // - Registered user name / email / phone (online)
    // ============================================================

    if (search) {
      const escapedSearch = escapeRegex(search);
      const searchRegex = new RegExp(escapedSearch, "i");

      const matchingUsers = await UserModel.find({
        deletedAt: null,
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
        ],
      })
        .select("_id")
        .lean();

      const matchingUserIds = matchingUsers.map(
        (user) => user._id
      );

      orderFilter.$or = [
        {
          orderNumber: searchRegex,
        },
        {
          user: {
            $in: matchingUserIds,
          },
        },
        // POS-specific search paths
        {
          "posMetadata.billNumber": searchRegex,
        },
        {
          "posMetadata.customerName": searchRegex,
        },
        {
          "posMetadata.customerPhone": searchRegex,
        },
      ];
    }

    // ============================================================
    // FETCH ORDERS + TOTAL COUNT
    // ============================================================

    const [orders, total] = await Promise.all([
      OrderModel.find(orderFilter)
        .populate({
          path: "user",
          select: "name email phone",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      OrderModel.countDocuments(orderFilter),
    ]);

    // ============================================================
    // FETCH ORDER ITEMS
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
        .select("order quantity")
        .lean();
    }

    // ============================================================
    // CALCULATE ITEM COUNTS
    // ============================================================

    const itemCountByOrder = {};

    for (const item of orderItems) {
      const orderId = item.order.toString();

      if (!itemCountByOrder[orderId]) {
        itemCountByOrder[orderId] = 0;
      }

      itemCountByOrder[orderId] +=
        Number(item.quantity) || 0;
    }

    // ============================================================
    // FORMAT ORDERS FOR ADMIN UI
    // ============================================================

    const formattedOrders = orders.map((order) => {
      const orderId = order._id.toString();

      const isPos = order.source === "pos";

      // --------------------------------------------------------
      // CUSTOMER
      //
      // - Online orders: resolve from populated user
      // - POS orders:    resolve from posMetadata
      // --------------------------------------------------------

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
          id:
            order.user?._id?.toString() || null,
          name:
            order.user?.name || "Unknown Customer",
          email:
            order.user?.email || "",
          phone:
            order.user?.phone || "",
        };
      }

      return {
        id: orderId,

        orderNumber: order.orderNumber,

        customer,

        itemsCount:
          itemCountByOrder[orderId] || 0,

        subtotal: order.subtotal,
        discount: order.discount,
        shipping: order.shipping,
        total: order.total,

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

        createdAt:
          order.createdAt,

        updatedAt:
          order.updatedAt,

        paidAt:
          order.paidAt,

        cancelledAt:
          order.cancelledAt,

        cancellationReason:
          order.cancellationReason || "",

        // ======================================================
        // POS FIELDS
        // ======================================================

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
          totalPages: Math.ceil(total / limit),
        },

        filters: {
          search,
          status: status || "all",
          paymentStatus:
            paymentStatus || "all",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/admin/orders error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch admin orders.",
      },
      { status: 500 }
    );
  }
}