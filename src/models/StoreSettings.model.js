import mongoose from "mongoose";

const notificationSettingsSchema = new mongoose.Schema(
    {
        newOrder: {
            type: Boolean,
            default: true,
        },

        newCustomer: {
            type: Boolean,
            default: true,
        },

        lowStock: {
            type: Boolean,
            default: true,
        },

        paymentReceived: {
            type: Boolean,
            default: true,
        },

        orderStatus: {
            type: Boolean,
            default: true,
        },

        orderCancelled: {
            type: Boolean,
            default: true,
        },

        contactMessage: {
            type: Boolean,
            default: true,
        },
    },
    {
        _id: false,
    }
);

const storeSettingsSchema = new mongoose.Schema(
    {
        storeName: {
            type: String,
            required: [true, "Store name is required"],
            trim: true,
            minlength: [2, "Store name must be at least 2 characters"],
            maxlength: [100, "Store name must not exceed 100 characters"],
            default: "Exclusive",
        },

        storeEmail: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: [
                100,
                "Store email must not exceed 100 characters",
            ],
            default: "",
        },

        storePhone: {
            type: String,
            trim: true,
            maxlength: [
                20,
                "Store phone must not exceed 20 characters",
            ],
            default: "",
        },

        storeAddress: {
            type: String,
            trim: true,
            maxlength: [
                300,
                "Store address must not exceed 300 characters",
            ],
            default: "",
        },

        currency: {
            type: String,
            trim: true,
            uppercase: true,
            enum: ["INR", "USD", "EUR", "GBP"],
            default: "INR",
        },

        language: {
            type: String,
            trim: true,
            enum: ["English"],
            default: "English",
        },

        notifications: {
            type: notificationSettingsSchema,

            default: () => ({
                newOrder: true,
                newCustomer: true,
                lowStock: true,
                paymentReceived: true,
                orderStatus: true,
                orderCancelled: true,
                contactMessage: true,
            }),
        },
    },
    {
        timestamps: true,
        collection: "store_settings",
    }
);

const StoreSettingsModel =
    mongoose.models.StoreSettings ||
    mongoose.model(
        "StoreSettings",
        storeSettingsSchema
    );

export default StoreSettingsModel;
