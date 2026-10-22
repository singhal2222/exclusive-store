import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import connectDB from "@/lib/mongodb";
import User from "@/models/User.model";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.SECRET_KEY;

if (!JWT_SECRET) {
  throw new Error("SECRET_KEY is missing in .env.local");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export async function POST(request) {
  try {
    // --------------------------------------------------
    // CONNECT TO DATABASE
    // --------------------------------------------------

    await connectDB();

    // --------------------------------------------------
    // GET REQUEST BODY
    // --------------------------------------------------

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 }
      );
    }

    const { contact, password } = body || {};

    // --------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------

    if (!contact || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 }
      );
    }

    const trimmedContact = String(contact).trim();

    // --------------------------------------------------
    // EMAIL / PHONE VALIDATION
    // --------------------------------------------------

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9][0-9]{9}$/;

    let query;

    if (emailRegex.test(trimmedContact)) {
      query = {
        email: trimmedContact.toLowerCase(),
        deletedAt: null,
      };
    } else if (phoneRegex.test(trimmedContact)) {
      query = {
        phone: trimmedContact,
        deletedAt: null,
      };
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // FIND USER
    // --------------------------------------------------

    const user = await User.findOne(query).select("+password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // CHECK PASSWORD
    // --------------------------------------------------

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // CREATE JWT
    // JWT CONTAINS ONLY USER ID
    // --------------------------------------------------

    const token = await new SignJWT({
      userId: user._id.toString(),
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    // --------------------------------------------------
    // CREATE RESPONSE
    // --------------------------------------------------

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email || null,
          phone: user.phone || null,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // --------------------------------------------------
    // SET HTTP-ONLY COOKIE
    // --------------------------------------------------

    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong during login",
      },
      { status: 500 }
    );
  }
}