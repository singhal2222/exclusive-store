import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

import NotificationModel from "@/models/Notification.model";

export async function GET() {
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

    // Fetch latest notifications
    const notifications = await NotificationModel.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Count unread notifications
    const unreadCount = await NotificationModel.countDocuments({
      isRead: false,
    });

    // Format notifications for frontend
    const formattedNotifications = notifications.map((notification) => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: {
        notifications: formattedNotifications,
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Admin notifications error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load notifications",
      },
      { status: 500 }
    );
  }
}
