import connectDB from "@/lib/mongodb";
import StoreSettingsModel from "@/models/StoreSettings.model";

const notificationPreferenceMap = {
    new_order: "newOrder",
    new_customer: "newCustomer",
    low_stock: "lowStock",
    out_of_stock: "lowStock",
    payment_received: "paymentReceived",
    order_status: "orderStatus",
    order_cancelled: "orderCancelled",
    contact_message: "contactMessage",
};

export async function isNotificationEnabled(notificationType) {
    try {
        await connectDB();

        const settings = await StoreSettingsModel.findOne().lean();

        // If settings do not exist, keep notifications enabled by default.
        if (!settings) {
            return true;
        }

        const preferenceKey =
            notificationPreferenceMap[notificationType];

        // Unknown notification types remain enabled.
        if (!preferenceKey) {
            return true;
        }

        // Only disable when the admin explicitly turned it off.
        return settings.notifications?.[preferenceKey] !== false;
    } catch (error) {
        console.error(
            "Notification settings check error:",
            error
        );

        // Do not break important operations like orders,
        // payments, signup, or contact messages if the settings check fails.
        return true;
    }
}
