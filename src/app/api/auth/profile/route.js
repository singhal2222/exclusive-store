import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import connectDB from "@/lib/mongodb";
import User from "@/models/User.model";

const JWT_SECRET = process.env.SECRET_KEY;

if (!JWT_SECRET) {
  throw new Error("SECRET_KEY is missing in .env.local");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export async function PUT(request) {
  try {
    // Get authentication cookie
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Verify JWT
    let payload;

    try {
      const result = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });

      payload = result.payload;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired session",
        },
        { status: 401 }
      );
    }

    const userId = payload?.userId;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Read request body
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request data",
        },
        { status: 400 }
      );
    }

    const { name, email, phone } = body || {};

    // Basic validation
    if (!name || !String(name).trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Name is required",
        },
        { status: 400 }
      );
    }

    const trimmedName = String(name).trim();

    if (trimmedName.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Name must be at least 2 characters",
        },
        { status: 400 }
      );
    }

    if (trimmedName.length > 30) {
      return NextResponse.json(
        {
          success: false,
          message: "Name must not exceed 30 characters",
        },
        { status: 400 }
      );
    }

    // Email validation
    const trimmedEmail = email
      ? String(email).trim().toLowerCase()
      : "";

    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          {
            success: false,
            message: "Please enter a valid email address",
          },
          { status: 400 }
        );
      }

      if (trimmedEmail.length > 50) {
        return NextResponse.json(
          {
            success: false,
            message: "Email must not exceed 50 characters",
          },
          { status: 400 }
        );
      }
    }

    // Phone validation
    const trimmedPhone = phone
      ? String(phone).trim()
      : "";

    if (trimmedPhone) {
      const phoneRegex = /^[6-9][0-9]{9}$/;

      if (!phoneRegex.test(trimmedPhone)) {
        return NextResponse.json(
          {
            success: false,
            message: "Please enter a valid 10-digit Indian phone number",
          },
          { status: 400 }
        );
      }
    }

    await connectDB();

    // Check email already belongs to another user
    if (trimmedEmail) {
      const existingEmail = await User.findOne({
        email: trimmedEmail,
        _id: { $ne: userId },
        deletedAt: null,
      });

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            message: "Email is already registered with another account",
          },
          { status: 409 }
        );
      }
    }

    // Check phone already belongs to another user
    if (trimmedPhone) {
      const existingPhone = await User.findOne({
        phone: trimmedPhone,
        _id: { $ne: userId },
        deletedAt: null,
      });

      if (existingPhone) {
        return NextResponse.json(
          {
            success: false,
            message: "Phone number is already registered with another account",
          },
          { status: 409 }
        );
      }
    }

    // Update user
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        deletedAt: null,
      },
      {
        $set: {
          name: trimmedName,
          email: trimmedEmail || undefined,
          phone: trimmedPhone || undefined,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("name email phone role");

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        user: {
          id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email || null,
          phone: updatedUser.phone || null,
          role: updatedUser.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update profile error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating your profile",
      },
      { status: 500 }
    );
  }
}