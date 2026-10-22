// FILE LOCATION: src/models/SignupVerification.model.js

import mongoose from "mongoose";

// ============================================================
// SIGNUP VERIFICATION SCHEMA
// ============================================================
//
// Temporary record created when a user submits the signup form.
// The record is deleted automatically by MongoDB after the
// token expiry window (30 minutes) using a TTL index.
//
// After the user clicks the email verification link, the
// verification API reads this record, validates the token hash,
// creates the real User document, and then deletes this record.
//
// ============================================================

const signupVerificationSchema = new mongoose.Schema(
    {
        // ============================================================
        // USER DETAILS
        // ============================================================

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
            index: true,
        },

        // ============================================================
        // PASSWORD
        // ============================================================
        //
        // The password is already bcrypt-hashed BEFORE being stored
        // here. It is inserted directly into the User collection
        // without re-hashing when signup is completed.
        //
        // ============================================================

        password: {
            type: String,
            required: [true, "Password is required"],
            select: false,
        },

        // ============================================================
        // EMAIL VERIFICATION TOKEN
        // ============================================================
        //
        // We store only the SHA-256 hash of the raw token.
        // The raw token is sent in the verification email link.
        //
        // Raw token format: 64-character hex string
        // (32 random bytes hex-encoded)
        //
        // ============================================================

        verificationTokenHash: {
            type: String,
            required: [true, "Verification token hash is required"],
            select: false,
        },

        tokenExpiresAt: {
            type: Date,
            required: [true, "Token expiry is required"],
        },

        // ============================================================
        // USAGE TRACKING
        // ============================================================
        //
        // Set when the verification link is successfully used.
        // This provides a defensive check so a token cannot be
        // replayed even if the record is not yet deleted.
        //
        // ============================================================

        usedAt: {
            type: Date,
            default: null,
        },

        // ============================================================
        // AUDIT (OPTIONAL)
        // ============================================================

        ipAddress: {
            type: String,
            default: null,
        },

        // ============================================================
        // CREATED AT
        // ============================================================
        //
        // A TTL index on `createdAt` is defined below.
        //
        // ============================================================

        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        collection: "signup_verifications",
    }
);

// ============================================================
// TTL INDEX
// ============================================================
//
// MongoDB automatically removes records once the expiry
// threshold is reached.
//
// The token itself is valid for 30 minutes.
// We keep the record in the database slightly longer (35 min)
// so a late click still gets a friendly "expired" message
// rather than "not found".
//
// ============================================================

signupVerificationSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 2100 } // 35 minutes
);

// ============================================================
// HELPFUL INDEXES
// ============================================================

// Email lookup for "delete previous signup attempt" queries.
signupVerificationSchema.index({ email: 1, createdAt: -1 });

// ============================================================
// MODEL
// ============================================================

const SignupVerificationModel =
    mongoose.models.SignupVerification ||
    mongoose.model(
        "SignupVerification",
        signupVerificationSchema,
        "signup_verifications"
    );

export default SignupVerificationModel;