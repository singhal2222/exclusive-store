// FILE LOCATION: src/app/api/auth/signup/verify-email/route.js

import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import crypto from "crypto";

import connectDB from "@/lib/mongodb";
import { isNotificationEnabled } from "@/lib/notificationSettings";

import User from "@/models/User.model";
import SignupVerificationModel from "@/models/SignupVerification.model";
import NotificationModel from "@/models/Notification.model";

// ============================================================
// JWT CONFIGURATION
// ============================================================

const JWT_SECRET = process.env.SECRET_KEY;

if (!JWT_SECRET) {
    throw new Error("SECRET_KEY is missing in .env.local");
}

const secret = new TextEncoder().encode(JWT_SECRET);

const TOKEN_EXPIRY_DAYS = 7;

// ============================================================
// HELPERS
// ============================================================

function jsonError(message, status) {
    return NextResponse.json(
        { success: false, message },
        { status }
    );
}

function hashVerificationToken(token) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}

function hashesMatch(a, b) {
    if (typeof a !== "string" || typeof b !== "string") {
        return false;
    }

    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");

    if (bufA.length !== bufB.length) {
        return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
}

async function createAuthToken(userId) {
    return await new SignJWT({
        userId: userId.toString(),
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${TOKEN_EXPIRY_DAYS}d`)
        .sign(secret);
}

function isValidObjectId(id) {
    return (
        typeof id === "string" &&
        /^[0-9a-fA-F]{24}$/.test(id)
    );
}

// ============================================================
// POST - VERIFY EMAIL AND CREATE USER
// ============================================================

export async function POST(request) {
    try {
        await connectDB();

        // -------------------- PARSE BODY --------------------

        let body;

        try {
            body = await request.json();
        } catch {
            return jsonError("Invalid JSON body", 400);
        }

        if (
            !body ||
            typeof body !== "object" ||
            Array.isArray(body)
        ) {
            return jsonError(
                "Request body must be a JSON object",
                400
            );
        }

        const token =
            typeof body.token === "string"
                ? body.token.trim()
                : "";

        const verificationId =
            typeof body.id === "string" ? body.id.trim() : "";

        // -------------------- REQUIRED FIELDS --------------------

        if (!token || !verificationId) {
            return jsonError(
                "Verification token and ID are required",
                400
            );
        }

        // -------------------- FORMAT VALIDATION --------------------

        if (!isValidObjectId(verificationId)) {
            return jsonError(
                "Invalid verification session",
                400
            );
        }

        if (!/^[0-9a-fA-F]{64}$/.test(token)) {
            return jsonError(
                "Invalid verification link",
                400
            );
        }

        // -------------------- FIND VERIFICATION RECORD --------------------
        //
        // IMPORTANT:
        //
        // Both `verificationTokenHash` and `password` have
        // `select: false` in the schema, so we must explicitly
        // request BOTH of them here.
        //
        // Missing the `+password` selector will result in the new
        // User document being created WITHOUT a password field,
        // which makes login and reset-password unusable.
        //
        // --------------------

        const signupVerification =
            await SignupVerificationModel.findById(verificationId)
                .select("+verificationTokenHash +password")
                .lean();

        if (!signupVerification) {
            return jsonError(
                "This verification link is invalid or has already been used. Please sign up again.",
                410
            );
        }

        // -------------------- CHECK IF ALREADY USED --------------------

        if (signupVerification.usedAt) {
            return jsonError(
                "This verification link has already been used. Please log in instead.",
                409
            );
        }

        // -------------------- CHECK EXPIRY --------------------

        if (
            !signupVerification.tokenExpiresAt ||
            new Date() > new Date(signupVerification.tokenExpiresAt)
        ) {
            await SignupVerificationModel.findByIdAndDelete(
                signupVerification._id
            );

            return jsonError(
                "This verification link has expired. Please sign up again.",
                410
            );
        }

        // -------------------- VERIFY TOKEN HASH --------------------

        const incomingHash = hashVerificationToken(token);

        if (
            !hashesMatch(
                incomingHash,
                signupVerification.verificationTokenHash
            )
        ) {
            return jsonError(
                "Invalid verification link",
                400
            );
        }

        // -------------------- VALIDATE PASSWORD EXISTS --------------------
        //
        // Defensive: if the hashed password is somehow missing from
        // the verification record, we must not create a User
        // without a password.
        //
        // --------------------

        if (
            typeof signupVerification.password !== "string" ||
            signupVerification.password.length === 0
        ) {
            console.error(
                "verify-email: password hash missing in verification record",
                signupVerification._id?.toString?.()
            );

            await SignupVerificationModel.findByIdAndDelete(
                signupVerification._id
            );

            return jsonError(
                "Your signup session is incomplete. Please sign up again.",
                410
            );
        }

        // -------------------- ENSURE NO USER EXISTS --------------------

        const existingUser = await User.findOne({
            deletedAt: null,
            email: signupVerification.email,
        })
            .select("_id")
            .lean();

        if (existingUser) {
            await SignupVerificationModel.findByIdAndDelete(
                signupVerification._id
            );

            return jsonError(
                "An account with this email already exists. Please log in.",
                409
            );
        }

        // -------------------- CREATE USER --------------------
        //
        // The password in `signupVerification.password` is already
        // bcrypt-hashed (done in signup/route.js).
        //
        // We use `User.collection.insertOne()` to bypass the
        // pre-save hook in User.model.js, which would otherwise
        // re-hash the password.
        //
        // --------------------

        const now = new Date();

        const userDocument = {
            name: signupVerification.name,
            email: signupVerification.email,
            phone: null,
            password: signupVerification.password,
            emailVerified: true,
            role: "user",
            deletedAt: null,
            createdAt: now,
            updatedAt: now,
        };

        const insertResult =
            await User.collection.insertOne(userDocument);

        if (!insertResult?.insertedId) {
            throw new Error("User account could not be created.");
        }

        // -------------------- MARK VERIFICATION AS USED --------------------

        await SignupVerificationModel.findByIdAndUpdate(
            signupVerification._id,
            { $set: { usedAt: now } }
        );

        // -------------------- DELETE VERIFICATION RECORD --------------------

        await SignupVerificationModel.findByIdAndDelete(
            signupVerification._id
        );

        // -------------------- FETCH CREATED USER --------------------

        const createdUser = await User.findById(
            insertResult.insertedId
        )
            .select("-password -__v")
            .lean();

        if (!createdUser) {
            throw new Error("User account could not be retrieved.");
        }

        // -------------------- ADMIN NOTIFICATION --------------------

        try {
            const newCustomerEnabled =
                await isNotificationEnabled("new_customer");

            if (newCustomerEnabled) {
                await NotificationModel.create({
                    type: "new_customer",
                    title: "New Customer Registered",
                    message: `${createdUser.name} has created a new customer account.`,
                    relatedId: createdUser._id,
                    link: "/admin/customers",
                    isRead: false,
                    readAt: null,
                });
            }
        } catch (notificationError) {
            console.error(
                "Create customer notification error:",
                notificationError
            );
        }

        // -------------------- CREATE JWT --------------------

        const jwt = await createAuthToken(createdUser._id);

        // -------------------- RESPONSE + COOKIE --------------------

        const response = NextResponse.json(
            {
                success: true,
                message:
                    "Email verified successfully. Your account is now active.",

                user: {
                    id: createdUser._id.toString(),
                    name: createdUser.name,
                    email: createdUser.email,
                    role: createdUser.role,
                },
            },
            { status: 201 }
        );

        response.cookies.set({
            name: "auth_token",
            value: jwt,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
        });

        return response;
    } catch (error) {
        console.error("Verify email error:", error);

        if (error?.code === 11000) {
            return jsonError(
                "An account with this email already exists. Please log in.",
                409
            );
        }

        if (error?.name === "CastError") {
            return jsonError(
                "Invalid verification session",
                400
            );
        }

        if (error?.name === "ValidationError") {
            const firstMsg = Object.values(
                error.errors || {}
            )[0]?.message;

            return jsonError(
                firstMsg || "Validation failed",
                400
            );
        }

        return jsonError(
            process.env.NODE_ENV === "development"
                ? error?.message || "Internal server error"
                : "Something went wrong while verifying your email",
            500
        );
    }
}