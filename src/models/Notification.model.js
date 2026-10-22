import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        // Notification type
        type: {
            type: String,
            enum: [
                "new_order",
                "new_customer",
                "low_stock",
                "out_of_stock",
                "payment_received",
                "order_status",
                "order_cancelled",
                "contact_message",
            ],
            required: true,
        },

        // Main notification message
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        // Additional notification details
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },

        // Related document ID
        // Example:
        // Order ID for new_order
        // Product ID for low_stock
        // User ID for new_customer
        // Contact Message ID for contact_message
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },

        // Where the notification should take the admin
        // Example: /admin/orders
        // Example: /admin/contact-messages
        link: {
            type: String,
            default: null,
            trim: true,
            maxlength: 300,
        },

        // Whether admin has opened/read the notification
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },

        // When the notification was read
        readAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: "notifications",
    }
);

// Latest notifications first
notificationSchema.index({ createdAt: -1 });

// Useful for fetching unread notifications
notificationSchema.index({
    isRead: 1,
    createdAt: -1,
});

const NotificationModel =
    mongoose.models.Notification ||
    mongoose.model("Notification", notificationSchema);

export default NotificationModel;
