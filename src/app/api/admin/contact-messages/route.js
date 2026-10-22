
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import ContactMessageModel from "@/models/ContactMessage.model";

export async function GET(request) {
    try {
        // --------------------------------
        // Check logged-in user
        // --------------------------------

        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized. Please login.",
                },
                { status: 401 }
            );
        }

        // --------------------------------
        // Check admin role
        // --------------------------------

        if (user.role !== "admin") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Access denied. Admin only.",
                },
                { status: 403 }
            );
        }

        await connectDB();

        // --------------------------------
        // Get query parameters
        // --------------------------------

        const { searchParams } = new URL(request.url);

        const search =
            searchParams.get("search")?.trim() || "";

        const status =
            searchParams.get("status")?.trim() || "";

        const pageParam = Number.parseInt(
            searchParams.get("page") || "1",
            10
        );

        const limitParam = Number.parseInt(
            searchParams.get("limit") || "10",
            10
        );

        // --------------------------------
        // Safe pagination
        // --------------------------------

        const page =
            Number.isInteger(pageParam) && pageParam > 0
                ? pageParam
                : 1;

        const limit =
            Number.isInteger(limitParam) &&
                limitParam > 0
                ? Math.min(limitParam, 50)
                : 10;

        const skip = (page - 1) * limit;

        // --------------------------------
        // Validate status
        // --------------------------------

        const allowedStatuses = [
            "new",
            "read",
            "replied",
        ];

        if (
            status &&
            !allowedStatuses.includes(status)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid contact message status.",
                },
                { status: 400 }
            );
        }

        // --------------------------------
        // Build search query
        // --------------------------------

        const query = {};

        if (search) {
            const escapedSearch = search.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            const searchRegex = new RegExp(
                escapedSearch,
                "i"
            );

            query.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { phone: searchRegex },
                { message: searchRegex },
            ];
        }

        if (status) {
            query.status = status;
        }

        // --------------------------------
        // Build status count query
        // --------------------------------

        const statusCountQuery = search
            ? {
                $or: query.$or,
            }
            : {};

        // --------------------------------
        // Fetch data
        // --------------------------------

        const [
            messages,
            totalMessages,
            newMessages,
            readMessages,
            repliedMessages,
        ] = await Promise.all([
            ContactMessageModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            ContactMessageModel.countDocuments(query),

            ContactMessageModel.countDocuments({
                ...statusCountQuery,
                status: "new",
            }),

            ContactMessageModel.countDocuments({
                ...statusCountQuery,
                status: "read",
            }),

            ContactMessageModel.countDocuments({
                ...statusCountQuery,
                status: "replied",
            }),
        ]);

        // --------------------------------
        // Pagination
        // --------------------------------

        const totalPages =
            Math.ceil(totalMessages / limit);

        return NextResponse.json(
            {
                success: true,
                message:
                    "Contact messages fetched successfully.",

                data: {
                    messages: messages.map((item) => ({
                        id: item._id.toString(),
                        name: item.name,
                        email: item.email,
                        phone: item.phone,
                        message: item.message,
                        status: item.status,
                        readAt: item.readAt,
                        repliedAt: item.repliedAt,
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt,
                    })),

                    counts: {
                        total: totalMessages,
                        new: newMessages,
                        read: readMessages,
                        replied: repliedMessages,
                    },

                    pagination: {
                        page,
                        limit,
                        totalMessages,
                        totalPages,
                        hasNextPage: page < totalPages,
                        hasPreviousPage: page > 1,
                    },

                    filters: {
                        search,
                        status: status || "all",
                    },
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(
            "GET admin contact messages error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Failed to load contact messages.",
            },
            { status: 500 }
        );
    }
}
