// FILE LOCATION: src/models/PasswordReset.model.js

import mongoose from "mongoose";

const passwordResetSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: [50, "Email must not exceed 50 characters"],
        },

        phone: {
            type: String,
            trim: true,
        },

        // ============================================================
        // RESET CODE HASH
        // ============================================================
        //
        // Not `required` because after successful verification
        // we clear this field ($unset) so the code cannot be
        // reused.
        //
        // The forgot-password route ensures this field is set
        // when creating the record.
        //
        // ============================================================

        resetCodeHash: {
            type: String,
            default: null,
            select: false,
        },

        resetCodeExpiresAt: {
            type: Date,
            required: [true, "Reset code expiry is required"],
        },

        resetToken: {
            type: String,
            default: null,
            select: false,
        },

        resetTokenExpiresAt: {
            type: Date,
            default: null,
        },

        attempts: {
            type: Number,
            default: 0,
            min: 0,
        },

        verified: {
            type: Boolean,
            default: false,
        },

        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        collection: "password_resets",
    }
);

/*
 * Automatically delete password reset records
 * after 30 minutes.
 */
passwordResetSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 1800 }
);

/*
 * Useful indexes for finding reset sessions.
 */
passwordResetSchema.index({ userId: 1 });
passwordResetSchema.index({ email: 1 });
passwordResetSchema.index({ phone: 1 });

const PasswordResetModel =
    mongoose.models.PasswordReset ||
    mongoose.model(
        "PasswordReset",
        passwordResetSchema,
        "password_resets"
    );

export default PasswordResetModel;