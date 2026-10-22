// FILE LOCATION: src/app/api/auth/reset-password/route.js

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User.model";
import PasswordResetModel from "@/models/PasswordReset.model";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 30;

// ============================================================
// PASSWORD VALIDATION
// ============================================================

function validatePassword(password) {
    if (!password) {
        return "Password is required.";
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
        return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
        return `Password must not exceed ${PASSWORD_MAX_LENGTH} characters.`;
    }

    if (/\s/.test(password)) {
        return "Password must not contain spaces.";
    }

    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter.";
    }

    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter.";
    }

    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number.";
    }

    if (!/[!@#$%^&*]/.test(password)) {
        return "Password must contain at least one special character.";
    }

    return null;
}

// ============================================================
// POST - RESET PASSWORD
// ============================================================

export async function POST(request) {
    try {
        // -------------------- PARSE BODY --------------------

        let body;

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid request body.",
                },
                { status: 400 }
            );
        }

        const resetToken =
            typeof body?.resetToken === "string"
                ? body.resetToken.trim()
                : "";

        const newPassword = body?.newPassword;
        const confirmPassword = body?.confirmPassword;

        // -------------------- REQUIRED FIELDS --------------------

        if (!resetToken) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Password reset token is required.",
                },
                { status: 400 }
            );
        }

        if (!newPassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: "New password is required.",
                },
                { status: 400 }
            );
        }

        if (!confirmPassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please confirm your new password.",
                },
                { status: 400 }
            );
        }

        // -------------------- PASSWORD VALIDATION --------------------

        const passwordError = validatePassword(newPassword);

        if (passwordError) {
            return NextResponse.json(
                {
                    success: false,
                    message: passwordError,
                },
                { status: 400 }
            );
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Passwords do not match.",
                },
                { status: 400 }
            );
        }

        // -------------------- CONNECT DB --------------------

        await connectDB();

        // -------------------- FIND RESET SESSION --------------------

        const passwordReset =
            await PasswordResetModel.findOne({
                resetToken,
                verified: true,
            }).select("+resetToken");

        if (!passwordReset) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid or expired password reset session. Please request a new code.",
                },
                { status: 400 }
            );
        }

        // -------------------- TOKEN EXPIRY --------------------

        if (
            !passwordReset.resetTokenExpiresAt ||
            passwordReset.resetTokenExpiresAt.getTime() <= Date.now()
        ) {
            await PasswordResetModel.deleteOne({
                _id: passwordReset._id,
            });

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "The password reset session has expired. Please request a new code.",
                },
                { status: 400 }
            );
        }

        // -------------------- FIND USER (WITH PASSWORD) --------------------
        //
        // We fetch the user WITH the password in a single query,
        // so that `user.password` is a real string when we call
        // comparePassword.
        //
        // --------------------

        const user = await User.findOne({
            _id: passwordReset.userId,
            deletedAt: null,
        }).select("+password");

        if (!user) {
            await PasswordResetModel.deleteOne({
                _id: passwordReset._id,
            });

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to reset the password for this account.",
                },
                { status: 404 }
            );
        }

        // -------------------- DEFENSIVE CHECK --------------------
        //
        // If for any reason the password hash is missing, fail
        // cleanly rather than passing undefined to bcrypt.
        //
        // --------------------

        if (
            typeof user.password !== "string" ||
            user.password.length === 0
        ) {
            console.error(
                "reset-password: user password hash is missing for user",
                user._id?.toString?.()
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Unable to reset the password for this account.",
                },
                { status: 500 }
            );
        }

        // -------------------- PREVENT REUSING OLD PASSWORD --------------------

        const isSamePassword = await user.comparePassword(newPassword);

        if (isSamePassword) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "New password must be different from your current password.",
                },
                { status: 400 }
            );
        }

        // -------------------- UPDATE PASSWORD --------------------
        //
        // The model's pre-save hook hashes the password because
        // `password` has been modified.
        //
        // --------------------

        user.password = newPassword;

        await user.save();

        // -------------------- INVALIDATE RESET SESSION --------------------

        await PasswordResetModel.deleteOne({
            _id: passwordReset._id,
        });

        // -------------------- SUCCESS --------------------

        return NextResponse.json(
            {
                success: true,
                message:
                    "Your password has been reset successfully. Please log in with your new password.",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Reset password API error:", error);

        if (error?.name === "CastError") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid password reset session.",
                },
                { status: 400 }
            );
        }

        if (error?.name === "ValidationError") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid password data.",
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message:
                    "Something went wrong while resetting your password. Please try again.",
            },
            { status: 500 }
        );
    }
}