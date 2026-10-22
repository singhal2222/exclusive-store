// FILE LOCATION: src/app/api/auth/forgot-password/verify/route.js

import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import PasswordResetModel from "@/models/PasswordReset.model";

const MAX_VERIFICATION_ATTEMPTS = 5;

const RESET_TOKEN_EXPIRY_MINUTES = 10;

function hashResetCode(code) {
    return crypto
        .createHash("sha256")
        .update(code)
        .digest("hex");
}

function codesMatch(enteredCode, storedHash) {
    const enteredHash = hashResetCode(enteredCode);

    const enteredBuffer = Buffer.from(
        enteredHash,
        "utf8"
    );

    const storedBuffer = Buffer.from(
        storedHash,
        "utf8"
    );

    if (
        enteredBuffer.length !==
        storedBuffer.length
    ) {
        return false;
    }

    return crypto.timingSafeEqual(
        enteredBuffer,
        storedBuffer
    );
}

function generateResetToken() {
    return crypto.randomBytes(32).toString("hex");
}

export async function POST(request) {
    try {
        /*
         * Safely read request body.
         */
        let body;

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid request body.",
                },
                {
                    status: 400,
                }
            );
        }

        const resetId =
            body?.resetId?.trim();

        const resetCode =
            body?.resetCode?.trim();

        /*
         * Both values are required.
         */
        if (!resetId || !resetCode) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Reset ID and verification code are required.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Validate MongoDB ObjectId.
         */
        if (
            !/^[0-9a-fA-F]{24}$/.test(
                resetId
            )
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid password reset session.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Verification code must be exactly
         * 6 digits.
         */
        if (!/^[0-9]{6}$/.test(resetCode)) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Verification code must be 6 digits.",
                },
                {
                    status: 400,
                }
            );
        }

        await connectDB();

        /*
         * We need resetCodeHash because it has
         * select:false in the model.
         */
        const passwordReset =
            await PasswordResetModel.findById(
                resetId
            ).select(
                "+resetCodeHash +resetToken"
            );

        /*
         * Reset session doesn't exist.
         */
        if (!passwordReset) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "This password reset request is invalid or has expired.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Prevent using a session that has already
         * been successfully verified.
         */
        if (passwordReset.verified) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "This verification code has already been used.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Maximum 5 attempts.
         */
        if (
            passwordReset.attempts >=
            MAX_VERIFICATION_ATTEMPTS
        ) {
            await PasswordResetModel.deleteOne({
                _id: passwordReset._id,
            });

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Too many incorrect attempts. Please request a new code.",
                },
                {
                    status: 429,
                }
            );
        }

        /*
         * Check whether the verification code
         * has expired.
         */
        if (
            !passwordReset.resetCodeExpiresAt ||
            passwordReset.resetCodeExpiresAt
                .getTime() <= Date.now()
        ) {
            await PasswordResetModel.deleteOne({
                _id: passwordReset._id,
            });

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "The verification code has expired. Please request a new code.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * If resetCodeHash is somehow missing (e.g., it was
         * already cleared in a previous step), treat this as
         * an invalid session.
         */
        if (!passwordReset.resetCodeHash) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "This password reset request is invalid or has expired.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Compare the entered code with the
         * stored SHA-256 hash.
         */
        const isCodeCorrect =
            codesMatch(
                resetCode,
                passwordReset.resetCodeHash
            );

        /*
         * Wrong code.
         *
         * We only increment attempts here. We do NOT touch
         * resetCodeHash, so a plain .save() is safe.
         */
        if (!isCodeCorrect) {
            passwordReset.attempts += 1;

            await passwordReset.save();

            const remainingAttempts =
                Math.max(
                    0,
                    MAX_VERIFICATION_ATTEMPTS -
                    passwordReset.attempts
                );

            if (
                remainingAttempts === 0
            ) {
                await PasswordResetModel.deleteOne(
                    {
                        _id:
                            passwordReset._id,
                    }
                );

                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Too many incorrect attempts. Please request a new code.",
                    },
                    {
                        status: 429,
                    }
                );
            }

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Incorrect verification code.",
                    remainingAttempts,
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * ==================================================
         * CODE IS CORRECT
         * ==================================================
         *
         * Generate a cryptographically secure reset token.
         */
        const resetToken =
            generateResetToken();

        /*
         * Reset token is valid for 10 minutes.
         */
        const resetTokenExpiresAt =
            new Date(
                Date.now() +
                RESET_TOKEN_EXPIRY_MINUTES *
                60 *
                1000
            );

        /*
         * ==================================================
         * ATOMIC UPDATE
         * ==================================================
         *
         * We use findByIdAndUpdate() instead of .save()
         * so we can $unset the resetCodeHash field in the
         * same atomic operation.
         *
         * This bypasses Mongoose document validators, which
         * is fine here because we have already validated
         * everything manually above.
         *
         * ==================================================
         */
        await PasswordResetModel.findByIdAndUpdate(
            passwordReset._id,
            {
                $set: {
                    verified: true,
                    resetToken,
                    resetTokenExpiresAt,
                },
                $unset: {
                    resetCodeHash: "",
                },
            },
            {
                runValidators: false,
            }
        );

        /*
         * Return the reset token to the frontend.
         *
         * The frontend will send this token
         * to the reset-password API.
         */
        return NextResponse.json(
            {
                success: true,

                message:
                    "Verification successful. You can now create a new password.",

                resetToken,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.error(
            "Forgot password verification API error:",
            error
        );

        /*
         * Handle invalid ObjectId / Mongoose errors.
         */
        if (
            error?.name ===
            "CastError"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid password reset session.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            error?.name ===
            "ValidationError"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid verification data.",
                },
                {
                    status: 400,
                }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message:
                    "Something went wrong while verifying the code. Please try again.",
            },
            {
                status: 500,
            }
        );
    }
}