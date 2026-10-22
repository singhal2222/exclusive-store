import mongoose from "mongoose";

const razorpayWebhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    event: {
      type: String,
      required: true,
      trim: true,
    },

    razorpayOrderId: {
      type: String,
      trim: true,
      default: null,
    },

    razorpayPaymentId: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "processed"],
      default: "pending",
      required: true,
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const RazorpayWebhookEventModel =
  mongoose.models.RazorpayWebhookEvent ||
  mongoose.model(
    "RazorpayWebhookEvent",
    razorpayWebhookEventSchema,
    "razorpayWebhookEvents"
  );

export default RazorpayWebhookEventModel;