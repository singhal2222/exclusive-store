import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User.model";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request) {
  try {
    // ============================================================
    // CHECK LOGGED-IN USER
    // ============================================================

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    // ============================================================
    // CHECK ADMIN ROLE
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
    // CONNECT DATABASE
    // ============================================================

    await connectDB();

    // ============================================================
    // URL PARAMETERS
    // ============================================================

    const { searchParams } = new URL(
      request.url
    );

    const search =
      searchParams.get("search")?.trim() || "";

    const page = Math.max(
      Number(searchParams.get("page")) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(searchParams.get("limit")) || 12,
        1
      ),
      100
    );

    // ============================================================
    // SEARCH QUERY
    // ============================================================

    const query = {
      role: "user",
      deletedAt: null,
    };

    if (search) {
      const safeSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const searchRegex = new RegExp(
        safeSearch,
        "i"
      );

      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    // ============================================================
    // TOTAL CUSTOMERS
    // ============================================================

    const total =
      await User.countDocuments(query);

    // ============================================================
    // PAGINATION
    // ============================================================

    const totalPages =
      Math.ceil(total / limit) || 1;

    const currentPage = Math.min(
      page,
      totalPages
    );

    const skip =
      (currentPage - 1) * limit;

    // ============================================================
    // FETCH CUSTOMERS
    // ============================================================

    const customers = await User.find(query)
      .select(
        "name email phone role createdAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // ============================================================
    // FORMAT RESPONSE
    // ============================================================

    const formattedCustomers =
      customers.map((customer) => ({
        id: customer._id.toString(),
        name: customer.name || "Unknown Customer",
        email: customer.email || "—",
        phone: customer.phone || "—",
        joined: customer.createdAt || null,

        // These will be connected later
        // when the Order system is built.
        location: "—",
        orders: null,
        spent: null,
      }));

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json(
      {
        success: true,
        customers: formattedCustomers,
        pagination: {
          page: currentPage,
          limit,
          total,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Admin customers API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while loading customers.",
      },
      { status: 500 }
    );
  }
}