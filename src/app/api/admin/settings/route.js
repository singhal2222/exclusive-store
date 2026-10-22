import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import StoreSettingsModel from "@/models/StoreSettings.model";

export async function GET() {
    try {
        // Check logged-in user
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

        // Check admin role
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

        // Get the store settings document
        let settings = await StoreSettingsModel.findOne();

        // Create default settings if they don't exist
        if (!settings) {
            settings = await StoreSettingsModel.create({});
        }

        return NextResponse.json(
            {
                success: true,
                message: "Settings fetched successfully.",
                settings,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET admin settings error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to load settings.",
            },
            { status: 500 }
        );
    }
}

export async function PATCH(request) {
    try {
        // Check logged-in user
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

        // Check admin role
        if (user.role !== "admin") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Access denied. Admin only.",
                },
                { status: 403 }
            );
        }

        const body = await request.json();

        const {
            storeName,
            storeEmail,
            storePhone,
            storeAddress,
            currency,
            language,
            notifications,
        } = body;

        // -----------------------------
        // Store settings validation
        // -----------------------------

        if (
            typeof storeName !== "undefined" &&
            (
                typeof storeName !== "string" ||
                storeName.trim().length < 2 ||
                storeName.trim().length > 100
            )
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Store name must be between 2 and 100 characters.",
                },
                { status: 400 }
            );
        }

        if (
            typeof storeEmail !== "undefined" &&
            storeEmail !== "" &&
            (
                typeof storeEmail !== "string" ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeEmail.trim()) ||
                storeEmail.trim().length > 100
            )
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please enter a valid store email.",
                },
                { status: 400 }
            );
        }

        if (
            typeof storePhone !== "undefined" &&
            (
                typeof storePhone !== "string" ||
                storePhone.trim().length > 20
            )
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Store phone must not exceed 20 characters.",
                },
                { status: 400 }
            );
        }

        if (
            typeof storeAddress !== "undefined" &&
            (
                typeof storeAddress !== "string" ||
                storeAddress.trim().length > 300
            )
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Store address must not exceed 300 characters.",
                },
                { status: 400 }
            );
        }

        // -----------------------------
        // Currency validation
        // -----------------------------

        const allowedCurrencies = [
            "INR",
            "USD",
            "EUR",
            "GBP",
        ];

        if (
            typeof currency !== "undefined" &&
            !allowedCurrencies.includes(currency)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid currency.",
                },
                { status: 400 }
            );
        }

        // -----------------------------
        // Language validation
        // -----------------------------

        if (
            typeof language !== "undefined" &&
            language !== "English"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid language.",
                },
                { status: 400 }
            );
        }

        // -----------------------------
        // Notification validation
        // -----------------------------

        if (
            typeof notifications !== "undefined" &&
            (
                typeof notifications !== "object" ||
                notifications === null ||
                Array.isArray(notifications)
            )
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid notification settings.",
                },
                { status: 400 }
            );
        }

        // IMPORTANT:
        // contactMessage has been added here.
        const notificationKeys = [
            "newOrder",
            "newCustomer",
            "lowStock",
            "paymentReceived",
            "orderStatus",
            "orderCancelled",
            "contactMessage",
        ];

        if (notifications) {
            for (const key of notificationKeys) {
                if (
                    typeof notifications[key] !== "undefined" &&
                    typeof notifications[key] !== "boolean"
                ) {
                    return NextResponse.json(
                        {
                            success: false,
                            message: `Invalid value for notification setting: ${key}.`,
                        },
                        { status: 400 }
                    );
                }
            }
        }

        await connectDB();

        // -----------------------------
        // Prepare update data
        // -----------------------------

        const updateData = {};

        if (typeof storeName !== "undefined") {
            updateData.storeName = storeName.trim();
        }

        if (typeof storeEmail !== "undefined") {
            updateData.storeEmail = storeEmail.trim().toLowerCase();
        }

        if (typeof storePhone !== "undefined") {
            updateData.storePhone = storePhone.trim();
        }

        if (typeof storeAddress !== "undefined") {
            updateData.storeAddress = storeAddress.trim();
        }

        if (typeof currency !== "undefined") {
            updateData.currency = currency;
        }

        if (typeof language !== "undefined") {
            updateData.language = language;
        }

        // -----------------------------
        // Update notification settings
        // -----------------------------

        if (notifications) {
            for (const key of notificationKeys) {
                if (typeof notifications[key] !== "undefined") {
                    updateData[`notifications.${key}`] =
                        notifications[key];
                }
            }
        }

        // -----------------------------
        // Update existing settings
        // or create settings document
        // -----------------------------

        const settings =
            await StoreSettingsModel.findOneAndUpdate(
                {},
                {
                    $set: updateData,
                },
                {
                    new: true,
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true,
                }
            );

        return NextResponse.json(
            {
                success: true,
                message: "Settings saved successfully.",
                settings,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("PATCH admin settings error:", error);

        // Mongoose validation error
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
                        "Invalid settings data.",
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: "Failed to save settings.",
            },
            { status: 500 }
        );
    }
}