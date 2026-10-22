import mongoose from "mongoose";

const newsletterSubscriptionSchema =
  new mongoose.Schema(
    {
      // ------------------------------------------------------------
      // SUBSCRIBER EMAIL
      // ------------------------------------------------------------

      email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        maxlength: [
          100,
          "Email must not exceed 100 characters",
        ],
      },

      // ------------------------------------------------------------
      // LINK TO REGISTERED USER
      // ------------------------------------------------------------
      // This can remain null when a guest subscribes.
      // Later, when the same email creates an account,
      // we can associate the subscription with that user.

      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      // ------------------------------------------------------------
      // SUBSCRIPTION STATUS
      // ------------------------------------------------------------

      isSubscribed: {
        type: Boolean,
        default: true,
      },

      // ------------------------------------------------------------
      // WELCOME COUPON
      // ------------------------------------------------------------
      // Stores the coupon created for this subscriber.

      welcomeCoupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
        default: null,
      },

      // ------------------------------------------------------------
      // WELCOME COUPON SENT STATUS
      // ------------------------------------------------------------

      welcomeCouponSent: {
        type: Boolean,
        default: false,
      },

      welcomeCouponSentAt: {
        type: Date,
        default: null,
      },

      // ------------------------------------------------------------
      // UNSUBSCRIBED DATE
      // ------------------------------------------------------------

      unsubscribedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

// ------------------------------------------------------------
// UNIQUE EMAIL
// ------------------------------------------------------------
// Prevents multiple newsletter subscription documents
// for the same normalized email.

newsletterSubscriptionSchema.index(
  { email: 1 },
  { unique: true }
);

// ------------------------------------------------------------
// MODEL
// ------------------------------------------------------------

const NewsletterSubscriptionModel =
  mongoose.models.NewsletterSubscription ||
  mongoose.model(
    "NewsletterSubscription",
    newsletterSubscriptionSchema,
    "newsletterSubscriptions"
  );

export default NewsletterSubscriptionModel;