import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import connectDB from "@/lib/mongodb";
import User from "@/models/User.model";

const JWT_SECRET = process.env.SECRET_KEY;

if (!JWT_SECRET) {
  throw new Error("SECRET_KEY is missing in .env.local");
}

const secret = new TextEncoder().encode(JWT_SECRET);

function clearAuthCookie(response) {
  response.cookies.set({
    name: "auth_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

// ============================================================
// ROUTES AN ADMIN IS ALLOWED TO VISIT OUTSIDE /admin/*
// ============================================================

const ADMIN_ALLOWED_NON_ADMIN_PREFIXES = [
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/api/",
];

function isAdminAllowedNonAdminRoute(pathname) {
  return ADMIN_ALLOWED_NON_ADMIN_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
}

export async function proxy(request) {
  try {
    const { pathname } = request.nextUrl;

    // ==================================================
    // 1. GET AUTH TOKEN
    // ==================================================

    const token = request.cookies.get("auth_token")?.value;

    // ==================================================
    // 2. NO TOKEN
    // ==================================================

    if (!token) {
      // Admin requires login
      if (pathname.startsWith("/admin")) {
        return NextResponse.redirect(
          new URL("/auth/login", request.url)
        );
      }

      // Customer account requires login
      if (pathname.startsWith("/account")) {
        return NextResponse.redirect(
          new URL("/auth/login", request.url)
        );
      }

      // Everything else is public
      return NextResponse.next();
    }

    // ==================================================
    // 3. VERIFY TOKEN
    // ==================================================

    let payload;

    try {
      const result = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });

      payload = result.payload;
    } catch (error) {
      console.error("JWT verification failed:", error);

      const response = NextResponse.next();

      return clearAuthCookie(response);
    }

    // ==================================================
    // 4. GET USER ID
    // ==================================================

    const userId = payload?.userId;

    if (!userId) {
      const response = NextResponse.next();

      return clearAuthCookie(response);
    }

    // ==================================================
    // 5. FIND USER
    // ==================================================

    await connectDB();

    const user = await User.findOne({
      _id: userId,
      deletedAt: null,
    }).select("role");

    // ==================================================
    // 6. USER NO LONGER EXISTS
    // ==================================================

    if (!user) {
      const response = NextResponse.next();

      return clearAuthCookie(response);
    }

    const role = user.role;

    // ==================================================
    // 7. LOGIN / SIGNUP (redirect already-logged-in users)
    // ==================================================

    if (
      pathname.startsWith("/auth/login") ||
      pathname.startsWith("/auth/signup")
    ) {
      return NextResponse.redirect(
        new URL(
          role === "admin" ? "/admin" : "/",
          request.url
        )
      );
    }

    // ==================================================
    // 8. ADMIN ROUTES (/admin/*)
    // ==================================================

    if (pathname.startsWith("/admin")) {
      if (role !== "admin") {
        return NextResponse.redirect(
          new URL("/", request.url)
        );
      }

      // Admin visiting admin route → allow
      return NextResponse.next();
    }

    // ==================================================
    // 9. CUSTOMER ACCOUNT (/account/*)
    // ==================================================

    if (pathname.startsWith("/account")) {
      if (role !== "user") {
        return NextResponse.redirect(
          new URL("/admin", request.url)
        );
      }
    }

    // ==================================================
    // 10. ADMIN TRAPPED IN ADMIN PANEL
    // ==================================================

    if (role === "admin") {
      if (!isAdminAllowedNonAdminRoute(pathname)) {
        return NextResponse.redirect(
          new URL("/admin", request.url)
        );
      }
    }

    // ==================================================
    // 11. PUBLIC WEBSITE (for customers / guests)
    // ==================================================

    return NextResponse.next();
  } catch (error) {
    console.error("Proxy error:", error);

    const response = NextResponse.redirect(
      new URL("/auth/login", request.url)
    );

    return clearAuthCookie(response);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf|eot)$).*)",
  ],
};