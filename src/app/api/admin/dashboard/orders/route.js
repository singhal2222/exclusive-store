import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

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
    // GET LATEST 5 ORDERS
    // ============================================================

    const orders = await OrderModel.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // ============================================================
    // FORMAT ORDERS FOR DASHBOARD
    // ============================================================

    const recentOrders = orders.map((order) => ({
      id: order.orderNumber,
      customer: order.user?.name || "Guest Customer",
      amount: Number(order.total || 0),
      status: order.orderStatus,
      date: order.createdAt,
    }));

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,
      data: recentOrders,
    });
  } catch (error) {
    console.error("Admin recent orders error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load recent orders",
      },
      { status: 500 }
    );
  }
}
