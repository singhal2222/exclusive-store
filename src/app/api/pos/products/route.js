import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import ProductModel from "@/models/Product.model";

// ============================================================
// GET /api/pos/products
// Lightweight product search for POS terminal
// Query params:
//   q      -> search term (product name)
//   limit  -> max results (default 20, max 50)
// ============================================================

export async function GET(request) {
    try {
        // ============================================================
        // AUTHENTICATION + ADMIN ACCESS
        // ============================================================

        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { success: false, message: "Unauthorized." },
                { status: 401 }
            );
        }

        if (currentUser.role !== "admin") {
            return NextResponse.json(
                { success: false, message: "Admin access required." },
                { status: 403 }
            );
        }

        // ============================================================
        // QUERY PARAMETERS
        // ============================================================

        const { searchParams } = new URL(request.url);

        const q = (searchParams.get("q") || "").trim();

        const requestedLimit = Number(searchParams.get("limit")) || 20;

        const limit = Math.min(Math.max(requestedLimit, 1), 50);

        // ============================================================
        // DATABASE
        // ============================================================

        await connectDB();

        // ============================================================
        // BUILD QUERY
        // Only products that are active and have stock > 0
        // ============================================================

        const query = {
            stock: { $gt: 0 },
        };

        if (q) {
            query.name = { $regex: q, $options: "i" };
        }

        const products = await ProductModel.find(query)
            .select("_id name price stock images image category")
            .sort({ name: 1 })
            .limit(limit)
            .lean();

        // ============================================================
        // NORMALIZE IMAGE FIELD
        // Supports both `images: [String]` and `image: String`
        // ============================================================

        const normalized = products.map((p) => ({
            _id: p._id.toString(),
            name: p.name,
            price: p.price,
            stock: p.stock,
            image:
                (Array.isArray(p.images) && p.images[0]) ||
                p.image ||
                "",
            category: p.category || null,
        }));

        // ============================================================
        // RESPONSE
        // ============================================================

        return NextResponse.json({
            success: true,
            products: normalized,
        });
    } catch (error) {
        console.error("POS products error:", error);

        return NextResponse.json(
            { success: false, message: "Failed to fetch products." },
            { status: 500 }
        );
    }
}