import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import ContactMessageModel from "@/models/ContactMessage.model";
import NotificationModel from "@/models/Notification.model";
import { isNotificationEnabled } from "@/lib/notificationSettings";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[6-9][0-9]{9}$/;
const nameRegex = /^[A-Z][a-zA-Z]*( [A-Z][a-zA-Z]*)*$/;

export async function POST(request) {
    try {
        const body = await request.json();

        const {
            name,
            email,
            phone,
            message,
        } = body;

        const trimmedName = name?.trim() || "";
        const trimmedEmail = email?.trim().toLowerCase() || "";
        const trimmedPhone = phone?.trim() || "";
        const trimmedMessage = message?.trim() || "";

        // -----------------------------
        // SERVER-SIDE VALIDATION
        // -----------------------------

        if (!trimmedName) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Name is required.",
                },
                { status: 400 }
            );
        }

        if (!nameRegex.test(trimmedName)) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Name must start with a capital letter and contain only letters.",
                },
                { status: 400 }
            );
        }

        if (trimmedName.length < 2) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Name must be at least 2 characters.",
                },
                { status: 400 }
            );
        }

        if (trimmedName.length > 30) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Name must not exceed 30 characters.",
                },
                { status: 400 }
            );
        }

        if (!trimmedEmail) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email is required.",
                },
                { status: 400 }
            );
        }

        if (!emailRegex.test(trimmedEmail)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Enter a valid email address.",
                },
                { status: 400 }
            );
        }

        if (trimmedEmail.length > 50) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email must not exceed 50 characters.",
                },
                { status: 400 }
            );
        }

        if (!trimmedPhone) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Phone number is required.",
                },
                { status: 400 }
            );
        }

        if (!phoneRegex.test(trimmedPhone)) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Enter a valid 10-digit Indian mobile number.",
                },
                { status: 400 }
            );
        }

        if (!trimmedMessage) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Message is required.",
                },
                { status: 400 }
            );
        }

        if (trimmedMessage.length < 10) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Message must be at least 10 characters.",
                },
                { status: 400 }
            );
        }

        if (trimmedMessage.length > 500) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Message must not exceed 500 characters.",
                },
                { status: 400 }
            );
        }

        // -----------------------------
        // DATABASE CONNECTION
        // -----------------------------

        await connectDB();

        // -----------------------------
        // SAVE CONTACT MESSAGE
        // -----------------------------

        const contactMessage = await ContactMessageModel.create({
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            message: trimmedMessage,
        });

        // -----------------------------
        // CREATE ADMIN NOTIFICATION
        // -----------------------------

        try {
            const notificationEnabled =
                await isNotificationEnabled("contact_message");

            if (notificationEnabled) {
                await NotificationModel.create({
                    type: "contact_message",
                    title: "New Contact Message",
                    message: `${trimmedName} sent a new message through the Contact Us form.`,
                    relatedId: contactMessage._id,
                    link: "/admin/contact-messages",
                });
            }
        } catch (notificationError) {
            // Notification failure should not make
            // the contact form submission fail.
            console.error(
                "Contact notification creation error:",
                notificationError
            );
        }

        // -----------------------------
        // SUCCESS RESPONSE
        // -----------------------------

        return NextResponse.json(
            {
                success: true,
                message:
                    "Your message has been sent successfully. We will contact you within 24 hours.",
                data: {
                    id: contactMessage._id.toString(),
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error(
            "POST /api/contact error:",
            error
        );

        // -----------------------------
        // MONGOOSE VALIDATION ERROR
        // -----------------------------

        if (error?.name === "ValidationError") {
            const firstError = Object.values(
                error.errors
            )[0];

            return NextResponse.json(
                {
                    success: false,
                    message:
                        firstError?.message ||
                        "Please enter valid contact information.",
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message:
                    "Failed to send your message. Please try again later.",
            },
            { status: 500 }
        );
    }
}
