import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

import ProductModel from "@/models/Product.model";
import OrderModel from "@/models/Order.model";
import UserModel from "@/models/User.model";

// ============================================================
// GET ADMIN SEARCH RESULTS
// ============================================================

export async function GET(request) {
  try {
    // ========================================================
    // CHECK ADMIN AUTHENTICATION
    // ========================================================

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

    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 }
      );
    }

    // ========================================================
    // GET SEARCH QUERY
    // ========================================================

    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q")?.trim() || "";

    // Search requires at least 1 character
    if (!query) {
      return NextResponse.json({
        success: true,
        data: {
          products: [],
          orders: [],
          customers: [],
        },
      });
    }

    // ========================================================
    // SEARCH REGEX
    // ========================================================

    // Escape special regex characters so user input is safe.
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(escapedQuery, "i");

    // ========================================================
    // SEARCH PRODUCTS
    // ========================================================

    const productsPromise = ProductModel.find({
      isActive: true,
      $or: [
        {
          name: regex,
        },
        {
          description: regex,
        },
      ],
    })
      .select("_id name price image category")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // ========================================================
    // SEARCH CUSTOMERS
    // ========================================================

    const customersPromise = UserModel.find({
      role: "user",
      deletedAt: null,
      $or: [
        {
          name: regex,
        },
        {
          email: regex,
        },
        {
          phone: regex,
        },
      ],
    })
      .select("_id name email phone")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // ========================================================
    // SEARCH ORDERS
    // ========================================================

    const ordersPromise = OrderModel.find({
      $or: [
        {
          orderNumber: regex,
        },
        {
          couponCode: regex,
        },
      ],
    })
      .select(
        "_id orderNumber user total paymentMethod paymentStatus orderStatus createdAt"
      )
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // ========================================================
    // RUN SEARCHES TOGETHER
    // ========================================================

    const [products, customers, orders] = await Promise.all([
      productsPromise,
      customersPromise,
      ordersPromise,
    ]);

    // ========================================================
    // FORMAT PRODUCTS
    // ========================================================

    const formattedProducts = products.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      price: Number(product.price || 0),
      image: product.image || "",
      category: product.category
        ? {
            id: product.category._id.toString(),
            name: product.category.name,
          }
        : null,
    }));

    // ========================================================
    // FORMAT CUSTOMERS
    // ========================================================

    const formattedCustomers = customers.map((customer) => ({
      id: customer._id.toString(),
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
    }));

    // ========================================================
    // FORMAT ORDERS
    // ========================================================

    const formattedOrders = orders.map((order) => ({
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      customer: order.user
        ? {
            id: order.user._id.toString(),
            name: order.user.name,
            email: order.user.email || "",
          }
        : null,
      total: Number(order.total || 0),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      date: order.createdAt,
    }));

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,
      data: {
        products: formattedProducts,
        orders: formattedOrders,
        customers: formattedCustomers,
      },
    });
  } catch (error) {
    console.error("Admin search error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to perform admin search",
      },
      { status: 500 }
    );
  }
}