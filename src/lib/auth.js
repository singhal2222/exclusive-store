import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import connectDB from "@/lib/mongodb";
import User from "@/models/User.model";

const JWT_SECRET = process.env.SECRET_KEY;

if (!JWT_SECRET) {
  throw new Error("SECRET_KEY is missing in .env.local");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    const userId = payload?.userId;

    if (!userId) {
      return null;
    }

    await connectDB();

    const user = await User.findOne({
      _id: userId,
      deletedAt: null,
    }).select("name email phone role");

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email || null,
      phone: user.phone || null,
      role: user.role,
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}