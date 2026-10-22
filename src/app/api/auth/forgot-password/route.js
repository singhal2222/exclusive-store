// FILE LOCATION: src/app/api/auth/forgot-password/route.js

import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import User from "@/models/User.model";
import PasswordResetModel from "@/models/PasswordReset.model";
import { sendPasswordResetEmail } from "@/lib/email";

const RESET_CODE_EXPIRY_MINUTES = 10;

const MAX_ATTEMPTS = 5;

function generateResetCode() {
    return crypto.randomInt(100000, 1000000).toString();
}

function hashResetCode(code) {
    return crypto
        .createHash("sha256")
        .update(code)
        .digest("hex");
}

function normalizePhone(phone) {
    return phone.replace(/\D/g, "");
}

export async function POST(request) {
    try {
        /*
         * Safely read the request body.
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

        const contact = body?.contact?.trim();

        /*
         * Contact is required.
         */
        if (!contact) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email or phone number is required.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Detect whether the user entered
         * an email address or phone number.
         */
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const phoneRegex =
            /^[0-9]{10}$/;

        const isEmail = emailRegex.test(
            contact.toLowerCase()
        );

        const normalizedPhone = normalizePhone(contact);

        const isPhone = phoneRegex.test(
            normalizedPhone
        );

        /*
         * Validate the contact format.
         */
        if (!isEmail && !isPhone) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Enter a valid email or 10-digit phone number.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Validate email length.
         */
        if (isEmail && contact.length > 50) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Email must not exceed 50 characters.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Validate Indian mobile number.
         */
        if (
            isPhone &&
            !/^[6-9][0-9]{9}$/.test(normalizedPhone)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Enter a valid Indian mobile number.",
                },
                {
                    status: 400,
                }
            );
        }

        await connectDB();

        /*
         * Find the registered user.
         *
         * We only search active users.
         */
        let user = null;

        if (isEmail) {
            user = await User.findOne({
                email: contact.toLowerCase(),
                deletedAt: null,
            }).select(
                "_id name email phone"
            );
        } else {
            user = await User.findOne({
                phone: normalizedPhone,
                deletedAt: null,
            }).select(
                "_id name email phone"
            );
        }

        /*
         * Do not reveal whether the account exists.
         *
         * This prevents attackers from using
         * the forgot-password form to discover
         * registered accounts.
         */
        if (!user) {
            return NextResponse.json(
                {
                    success: true,
                    message:
                        "If an account exists with these details, a verification code has been sent.",
                },
                {
                    status: 200,
                }
            );
        }

        /*
         * Remove any previous reset session
         * for this user.
         */
        await PasswordResetModel.deleteMany({
            userId: user._id,
        });

        /*
         * Generate a new 6-digit reset code.
         */
        const resetCode = generateResetCode();

        /*
         * Store only the hash of the code.
         */
        const resetCodeHash =
            hashResetCode(resetCode);

        /*
         * Code is valid for 10 minutes.
         */
        const resetCodeExpiresAt = new Date(
            Date.now() +
            RESET_CODE_EXPIRY_MINUTES *
            60 *
            1000
        );

        /*
         * Create temporary password reset session.
         */
        const passwordReset =
            await PasswordResetModel.create({
                userId: user._id,

                email: user.email || null,

                phone: user.phone || null,

                resetCodeHash,

                resetCodeExpiresAt,

                attempts: 0,

                verified: false,

                resetToken: null,

                resetTokenExpiresAt: null,
            });

        /*
         * ==================================================
         * EMAIL RESET
         * ==================================================
         *
         * If the user requested reset using email,
         * send the reset code using the dedicated
         * password-reset email function.
         *
         * The email function expects:
         *
         *   email
         *   name
         *   resetCode
         *
         * ==================================================
         */
        if (isEmail) {
            try {
                await sendPasswordResetEmail({
                    email: user.email,
                    name: user.name,
                    resetCode,
                });
            } catch (emailError) {
                console.error(
                    "Forgot password email error:",
                    emailError
                );

                /*
                 * Do not leave an unusable reset
                 * session in the database.
                 */
                await PasswordResetModel.deleteOne({
                    _id: passwordReset._id,
                });

                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Unable to send verification email. Please try again.",
                    },
                    {
                        status: 500,
                    }
                );
            }
        }

        /*
         * ==================================================
         * PHONE RESET
         * ==================================================
         *
         * MSG91 is currently unavailable because
         * its IP is blocked.
         *
         * For development/testing, print the OTP
         * in the terminal.
         *
         * Later we can replace this section with
         * sendPasswordResetOtp().
         */
        if (isPhone) {
            console.log(
                "\n============================================================"
            );

            console.log(
                "DEVELOPMENT PASSWORD RESET OTP"
            );

            console.log(
                "============================================================"
            );

            console.log(
                `Phone: ${normalizedPhone}`
            );

            console.log(
                `OTP: ${resetCode}`
            );

            console.log(
                `Valid for: ${RESET_CODE_EXPIRY_MINUTES} minutes`
            );

            console.log(
                "============================================================\n"
            );
        }

        /*
         * Return the reset session ID.
         *
         * The frontend will use this ID when
         * verifying the code.
         */
        return NextResponse.json(
            {
                success: true,

                message:
                    "If an account exists with these details, a verification code has been sent.",

                resetId:
                    passwordReset._id.toString(),

                contactType: isEmail
                    ? "email"
                    : "phone",
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.error(
            "Forgot password API error:",
            error
        );

        /*
         * Handle duplicate-key errors.
         */
        if (error?.code === 11000) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "A password reset request already exists. Please try again.",
                },
                {
                    status: 409,
                }
            );
        }

        /*
         * Handle Mongoose validation errors.
         */
        if (
            error?.name ===
            "ValidationError"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid password reset data.",
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
                    "Something went wrong. Please try again later.",
            },
            {
                status: 500,
            }
        );
    }
}