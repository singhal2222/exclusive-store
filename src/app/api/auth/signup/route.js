// FILE LOCATION: src/app/api/auth/signup/route.js

import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/mongodb";
import { isNotificationEnabled } from "@/lib/notificationSettings";

import User from "@/models/User.model";
import SignupVerificationModel from "@/models/SignupVerification.model";
import NotificationModel from "@/models/Notification.model";

import { sendSignupVerificationEmail } from "@/lib/email";

// ============================================================
// CONSTANTS
// ============================================================

const TOKEN_EXPIRY_MINUTES = 30;

// ============================================================
// HELPERS
// ============================================================

function jsonError(message, status) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

/**
 * Generate a cryptographically secure random token.
 * 32 bytes = 64 hex characters = 256 bits of entropy.
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * SHA-256 hash of the raw token.
 * Only the hash is stored in the database.
 */
function hashVerificationToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

/**
 * Extract the client IP from request headers.
 * Returns null if it cannot be determined.
 */
function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return null;
}

// ============================================================
// POST - START SIGNUP VERIFICATION (EMAIL LINK BASED)
// ============================================================
//
// Flow:
//
//   1. User submits name, email, password.
//   2. We validate everything.
//   3. We generate a random token, hash it, and store the
//      hash in SignupVerification.
//   4. We email a clickable link containing the RAW token.
//   5. User clicks the link at any time within 30 minutes.
//      → /api/auth/signup/verify-email creates the User.
//
// No phone. No codes. Just a link.
//
// ============================================================

export async function POST(request) {
  try {
    // -------------------- DB CONNECTION --------------------

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

    const { name, email, password } = body;

    // -------------------- REQUIRED FIELDS --------------------

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return jsonError(
        "Name, email and password are required",
        400
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // -------------------- NAME VALIDATION --------------------

    if (
      trimmedName.length < 2 ||
      trimmedName.length > 30
    ) {
      return jsonError(
        "Name must be between 2 and 30 characters",
        400
      );
    }

    // -------------------- EMAIL VALIDATION --------------------

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      return jsonError(
        "Enter a valid email address",
        400
      );
    }

    if (trimmedEmail.length > 50) {
      return jsonError(
        "Email must not exceed 50 characters",
        400
      );
    }

    // -------------------- PASSWORD VALIDATION --------------------

    if (password.length < 8 || password.length > 30) {
      return jsonError(
        "Password must be 8-30 characters",
        400
      );
    }

    if (!/[A-Z]/.test(password)) {
      return jsonError(
        "Password needs an uppercase letter",
        400
      );
    }

    if (!/[a-z]/.test(password)) {
      return jsonError(
        "Password needs a lowercase letter",
        400
      );
    }

    if (!/[0-9]/.test(password)) {
      return jsonError(
        "Password needs a number",
        400
      );
    }

    if (!/[!@#$%^&*]/.test(password)) {
      return jsonError(
        "Password needs a special character",
        400
      );
    }

    if (/\s/.test(password)) {
      return jsonError(
        "Password must not contain spaces",
        400
      );
    }

    // -------------------- CHECK EXISTING USER --------------------

    const existingUser = await User.findOne({
      deletedAt: null,
      email: trimmedEmail,
    })
      .select("_id email")
      .lean();

    if (existingUser) {
      return jsonError(
        "An account with this email already exists",
        409
      );
    }

    // -------------------- CONFIG CHECK --------------------

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl || !/^https?:\/\//i.test(appUrl)) {
      console.error(
        "NEXT_PUBLIC_APP_URL is missing or invalid in .env.local"
      );

      return jsonError(
        "Server configuration error: NEXT_PUBLIC_APP_URL is not set.",
        500
      );
    }

    // -------------------- CLEANUP PREVIOUS ATTEMPTS --------------------
    //
    // If the same email already has a pending signup attempt,
    // delete it so this new one becomes the only valid session.
    //
    // --------------------

    await SignupVerificationModel.deleteMany({
      email: trimmedEmail,
    });

    // -------------------- GENERATE TOKEN --------------------

    const rawToken = generateVerificationToken();
    const tokenHash = hashVerificationToken(rawToken);

    // -------------------- HASH PASSWORD --------------------
    //
    // User.model.js hashes passwords on save. But here we're
    // storing the password in SignupVerification temporarily
    // until email is verified.
    //
    // So we hash it manually and store the hash. When the User
    // is finally created via verify-email, we insert the hash
    // directly without re-hashing.
    //
    // --------------------

    const hashedPassword = await bcrypt.hash(password, 10);

    // -------------------- EXPIRY --------------------

    const tokenExpiresAt = new Date(
      Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000
    );

    // -------------------- CREATE VERIFICATION RECORD --------------------

    const signupVerification =
      await SignupVerificationModel.create({
        name: trimmedName,
        email: trimmedEmail,
        password: hashedPassword,
        verificationTokenHash: tokenHash,
        tokenExpiresAt,
        usedAt: null,
        ipAddress: getClientIp(request),
      });

    // -------------------- BUILD VERIFICATION URL --------------------

    const verificationUrl =
      `${appUrl}/auth/verify-email` +
      `?token=${encodeURIComponent(rawToken)}` +
      `&id=${signupVerification._id.toString()}`;

    // -------------------- SEND EMAIL --------------------

    try {
      await sendSignupVerificationEmail({
        email: trimmedEmail,
        name: trimmedName,
        verificationUrl,
      });
    } catch (emailError) {
      console.error(
        "Signup verification email error:",
        emailError
      );

      // Delete the temp record so the user can retry cleanly.
      await SignupVerificationModel.findByIdAndDelete(
        signupVerification._id
      );

      return jsonError(
        "Unable to send verification email. Please try again.",
        500
      );
    }

    // -------------------- SUCCESS --------------------

    return NextResponse.json(
      {
        success: true,

        message:
          "Verification link has been sent to your email. " +
          "Please click the link to activate your account.",

        verificationId:
          signupVerification._id.toString(),

        // Do NOT return the token to the client.
        // It is only sent via email.
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);

    // -------------------- DUPLICATE KEY --------------------

    if (error?.code === 11000) {
      return jsonError(
        "An account with this email already exists",
        409
      );
    }

    // -------------------- MONGOOSE VALIDATION --------------------

    if (error?.name === "ValidationError") {
      const firstMsg = Object.values(
        error.errors || {}
      )[0]?.message;

      return jsonError(
        firstMsg || "Validation failed",
        400
      );
    }

    // -------------------- FALLBACK --------------------

    return jsonError(
      process.env.NODE_ENV === "development"
        ? error?.message || "Internal server error"
        : "Something went wrong while starting the signup process",
      500
    );
  }
}