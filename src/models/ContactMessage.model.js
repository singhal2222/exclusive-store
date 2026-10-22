import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [30, "Name must not exceed 30 characters"],
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            maxlength: [50, "Email must not exceed 50 characters"],
        },

        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
        },

        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
            minlength: [10, "Message must be at least 10 characters"],
            maxlength: [500, "Message must not exceed 500 characters"],
        },

        status: {
            type: String,
            enum: ["new", "read", "replied"],
            default: "new",
            index: true,
        },

        readAt: {
            type: Date,
            default: null,
        },

        repliedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: "contact_messages",
    }
);

contactMessageSchema.index({ createdAt: -1 });

const ContactMessageModel =
    mongoose.models.ContactMessage ||
    mongoose.model(
        "ContactMessage",
        contactMessageSchema
    );

export default ContactMessageModel;