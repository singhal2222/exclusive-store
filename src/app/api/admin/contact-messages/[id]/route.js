import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import ContactMessageModel from "@/models/ContactMessage.model";

export async function GET(request, { params }) {
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

        const { id } = await params;

        // --------------------------------
        // Validate ObjectId
        // --------------------------------

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid contact message ID.",
                },
                { status: 400 }
            );
        }

        await connectDB();

        // --------------------------------
        // Find message
        // --------------------------------

        const contactMessage =
            await ContactMessageModel.findById(id).lean();

        if (!contactMessage) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Contact message not found.",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message:
                    "Contact message fetched successfully.",

                data: {
                    id: contactMessage._id.toString(),
                    name: contactMessage.name,
                    email: contactMessage.email,
                    phone: contactMessage.phone,
                    message: contactMessage.message,
                    status: contactMessage.status,
                    readAt: contactMessage.readAt,
                    repliedAt: contactMessage.repliedAt,
                    createdAt: contactMessage.createdAt,
                    updatedAt: contactMessage.updatedAt,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(
            "GET admin contact message error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Failed to load contact message.",
            },
            { status: 500 }
        );
    }
}

export async function PATCH(request, { params }) {
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

        const { id } = await params;

        // --------------------------------
        // Validate ObjectId
        // --------------------------------

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid contact message ID.",
                },
                { status: 400 }
            );
        }

        const body = await request.json();

        const { status } = body;

        // --------------------------------
        // Validate status
        // --------------------------------

        const allowedStatuses = [
            "new",
            "read",
            "replied",
        ];

        if (!allowedStatuses.includes(status)) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Status must be new, read, or replied.",
                },
                { status: 400 }
            );
        }

        await connectDB();

        // --------------------------------
        // Find message
        // --------------------------------

        const contactMessage =
            await ContactMessageModel.findById(id);

        if (!contactMessage) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Contact message not found.",
                },
                { status: 404 }
            );
        }

        // --------------------------------
        // Update status
        // --------------------------------

        contactMessage.status = status;

        if (status === "new") {
            contactMessage.readAt = null;
            contactMessage.repliedAt = null;
        }

        if (status === "read") {
            if (!contactMessage.readAt) {
                contactMessage.readAt = new Date();
            }

            contactMessage.repliedAt = null;
        }

        if (status === "replied") {
            if (!contactMessage.readAt) {
                contactMessage.readAt = new Date();
            }

            contactMessage.repliedAt = new Date();
        }

        await contactMessage.save();

        return NextResponse.json(
            {
                success: true,
                message:
                    "Contact message status updated successfully.",

                data: {
                    id: contactMessage._id.toString(),
                    name: contactMessage.name,
                    email: contactMessage.email,
                    phone: contactMessage.phone,
                    message: contactMessage.message,
                    status: contactMessage.status,
                    readAt: contactMessage.readAt,
                    repliedAt: contactMessage.repliedAt,
                    createdAt: contactMessage.createdAt,
                    updatedAt: contactMessage.updatedAt,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(
            "PATCH admin contact message error:",
            error
        );

        if (error?.name === "ValidationError") {
            const validationMessage = Object.values(
                error.errors
            )
                .map((item) => item.message)
                .join(", ");

            return NextResponse.json(
                {
                    success: false,
                    message:
                        validationMessage ||
                        "Invalid contact message data.",
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message:
                    "Failed to update contact message.",
            },
            { status: 500 }
        );
    }
}
