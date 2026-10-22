import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

import NotificationModel from "@/models/Notification.model";

export async function PATCH() {
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

    // Mark all unread notifications as read
    const result = await NotificationModel.updateMany(
      {
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read",
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark all notifications as read",
      },
      { status: 500 }
    );
  }
}
