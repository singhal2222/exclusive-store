import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

import UserModel from "@/models/User.model";
import ProductModel from "@/models/Product.model";
import OrderModel from "@/models/Order.model";

export async function GET() {
  try {
    // ============================================================
    // CHECK LOGGED-IN USER
    // ============================================================

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // ============================================================
    // ADMIN ACCESS ONLY
    // ============================================================

    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 }
      );
    }

    // ============================================================
    // GET DASHBOARD STATISTICS
    // ============================================================

    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      revenueResult,
    ] = await Promise.all([
      // ----------------------------------------------------------
      // TOTAL ORDERS
      // Includes all orders, including cancelled orders.
      // ----------------------------------------------------------

      OrderModel.countDocuments(),

      // ----------------------------------------------------------
      // TOTAL CUSTOMERS
      // Exclude admins and soft-deleted users.
      // ----------------------------------------------------------

      UserModel.countDocuments({
        role: "user",
        deletedAt: null,
      }),

      // ----------------------------------------------------------
      // TOTAL ACTIVE PRODUCTS
      // ----------------------------------------------------------

      ProductModel.countDocuments({
        isActive: true,
      }),

      // ----------------------------------------------------------
      // TOTAL REVENUE
      // Only paid and non-cancelled orders are included.
      // Order.total is the final payable amount.
      // ----------------------------------------------------------

      OrderModel.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            orderStatus: {
              $ne: "cancelled",
            },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: "$total",
            },
          },
        },
      ]),
    ]);

    // ============================================================
    // FORMAT REVENUE
    // ============================================================

    const totalRevenue = Number(
      revenueResult[0]?.totalRevenue || 0
    );

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load dashboard statistics",
      },
      { status: 500 }
    );
  }
}
