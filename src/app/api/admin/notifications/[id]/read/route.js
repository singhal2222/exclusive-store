import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

import NotificationModel from "@/models/Notification.model";

export async function PATCH(request, { params }) {
  try {
    // Get currently logged-in user
    const user = await getCurrentUser();

    // Check authentication
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Check admin role
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 }
      );
    }

    // Get notification ID from URL
    const { id } = await params;

    // Validate notification ID
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid notification ID",
        },
        { status: 400 }
      );
    }

    // Find and mark notification as read
    const notification = await NotificationModel.findByIdAndUpdate(
      id,
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      {
        new: true,
      }
    ).lean();

    // Notification not found
    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found",
        },
        { status: 404 }
      );
    }

    // Return updated notification
    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
      data: {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedId: notification.relatedId
          ? notification.relatedId.toString()
          : null,
        link: notification.link || null,
        isRead: notification.isRead,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      },
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark notification as read",
      },
      { status: 500 }
    );
  }
}
