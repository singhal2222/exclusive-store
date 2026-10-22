// FILE LOCATION: src/app/api/admin/coupons/route.js

import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import CouponModel from "@/models/Coupon.model";

// ============================================================
// HELPERS
// ============================================================

function jsonError(message, status) {
    return NextResponse.json({ success: false, message }, { status });
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseOptionalNumber(value, fieldName) {
    if (value === undefined || value === null || value === "") {
        return { value: null, error: null };
    }

    if (typeof value === "string" && value.trim() === "") {
        return { value: null, error: `${fieldName} must be a valid number` };
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return { value: null, error: `${fieldName} must be a valid number` };
    }

    return { value: number, error: null };
}

// ============================================================
// GET - LIST COUPONS (ADMIN ONLY)
// ============================================================

export async function GET(request) {
    try {
        // ----------------------------------------
        // Auth
        // ----------------------------------------

        const user = await getCurrentUser();

        if (!user) {
            return jsonError("Authentication required", 401);
        }

        if (user.role !== "admin") {
            return jsonError("Admin access required", 403);
        }

        await connectDB();

        // ----------------------------------------
        // Parse query params
        // ----------------------------------------

        const { searchParams } = new URL(request.url);

        const search = searchParams.get("search")?.trim() || "";
        const type = searchParams.get("type")?.trim() || "";
        const status = searchParams.get("status")?.trim() || "";

        const rawPage = searchParams.get("page");
        const rawLimit = searchParams.get("limit");

        const page = rawPage === null ? 1 : Number(rawPage);
        const limit = rawLimit === null ? 20 : Number(rawLimit);

        if (!Number.isSafeInteger(page) || page < 1) {
            return jsonError("Page must be a positive integer", 400);
        }

        if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
            return jsonError("Limit must be an integer between 1 and 100", 400);
        }

        // ----------------------------------------
        // Build query
        // ----------------------------------------

        const query = {};

        // Search by code or owner email
        if (search) {
            const escaped = escapeRegex(search);

            query.$or = [
                { code: { $regex: escaped, $options: "i" } },
                { ownerEmail: { $regex: escaped, $options: "i" } },
            ];
        }

        // Filter by coupon type
        if (type === "general" || type === "welcome") {
            query.couponType = type;
        }

        // Filter by status
        if (status) {
            const now = new Date();

            switch (status) {
                case "active":
                    query.isActive = true;
                    query.redeemed = { $ne: true };
                    query.$and = [
                        {
                            $or: [
                                { expiryDate: null },
                                { expiryDate: { $gte: now } },
                            ],
                        },
                        {
                            $or: [
                                { usageLimit: null },
                                { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
                            ],
                        },
                    ];
                    break;

                case "inactive":
                    query.isActive = false;
                    break;

                case "expired":
                    query.expiryDate = { $lt: now };
                    break;

                case "redeemed":
                    query.redeemed = true;
                    break;

                default:
                    break;
            }
        }

        // ----------------------------------------
        // Pagination
        // ----------------------------------------

        const skip = (page - 1) * limit;

        // ----------------------------------------
        // Fetch
        // ----------------------------------------

        const [coupons, total] = await Promise.all([
            CouponModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            CouponModel.countDocuments(query),
        ]);

        const totalPages = Math.ceil(total / limit);

        // ----------------------------------------
        // Response
        // ----------------------------------------

        return NextResponse.json(
            {
                success: true,
                coupons,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("List coupons error:", error);

        return jsonError(
            process.env.NODE_ENV === "development"
                ? error?.message || "Internal server error"
                : "Something went wrong while fetching coupons",
            500
        );
    }
}

// ============================================================
// POST - CREATE COUPON (ADMIN ONLY)
// ============================================================

export async function POST(request) {
    try {
        // ----------------------------------------
        // Auth
        // ----------------------------------------

        const user = await getCurrentUser();

        if (!user) {
            return jsonError("Authentication required", 401);
        }

        if (user.role !== "admin") {
            return jsonError("Admin access required", 403);
        }

        await connectDB();

        // ----------------------------------------
        // Parse body
        // ----------------------------------------

        let body;

        try {
            body = await request.json();
        } catch {
            return jsonError("Invalid JSON body", 400);
        }

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return jsonError("Request body must be a JSON object", 400);
        }

        const {
            code,
            couponType = "general",
            discountType,
            discountValue,
            minimumOrderAmount = 0,
            maximumDiscount = null,
            expiryDate = null,
            usageLimit = null,
            isActive = true,
            ownerEmail = null,
        } = body;

        // ----------------------------------------
        // Validate code
        // ----------------------------------------

        if (typeof code !== "string" || !code.trim()) {
            return jsonError("Coupon code is required", 400);
        }

        const normalizedCode = code.trim().toUpperCase();

        if (normalizedCode.length < 3 || normalizedCode.length > 30) {
            return jsonError(
                "Coupon code must be between 3 and 30 characters",
                400
            );
        }

        // ----------------------------------------
        // Validate coupon type
        // ----------------------------------------

        if (couponType !== "general" && couponType !== "welcome") {
            return jsonError(
                'Coupon type must be either "general" or "welcome"',
                400
            );
        }

        // ----------------------------------------
        // Validate discount type
        // ----------------------------------------

        if (
            discountType !== "percentage" &&
            discountType !== "fixed"
        ) {
            return jsonError(
                'Discount type must be either "percentage" or "fixed"',
                400
            );
        }

        // ----------------------------------------
        // Validate discount value
        // ----------------------------------------

        const discountResult = parseOptionalNumber(
            discountValue,
            "Discount value"
        );

        if (discountResult.error || discountResult.value === null) {
            return jsonError(
                discountResult.error || "Discount value is required",
                400
            );
        }

        const numericDiscount = discountResult.value;

        if (numericDiscount <= 0) {
            return jsonError("Discount value must be greater than 0", 400);
        }

        if (discountType === "percentage" && numericDiscount > 100) {
            return jsonError(
                "Percentage discount cannot exceed 100",
                400
            );
        }

        // ----------------------------------------
        // Validate minimum order amount
        // ----------------------------------------

        const minOrderResult = parseOptionalNumber(
            minimumOrderAmount,
            "Minimum order amount"
        );

        if (minOrderResult.error) {
            return jsonError(minOrderResult.error, 400);
        }

        const numericMinOrder = minOrderResult.value ?? 0;

        if (numericMinOrder < 0) {
            return jsonError(
                "Minimum order amount cannot be negative",
                400
            );
        }

        // ----------------------------------------
        // Validate maximum discount
        // ----------------------------------------

        let numericMaxDiscount = null;

        if (
            maximumDiscount !== null &&
            maximumDiscount !== undefined &&
            maximumDiscount !== ""
        ) {
            const maxResult = parseOptionalNumber(
                maximumDiscount,
                "Maximum discount"
            );

            if (maxResult.error || maxResult.value === null) {
                return jsonError(
                    maxResult.error || "Maximum discount is invalid",
                    400
                );
            }

            numericMaxDiscount = maxResult.value;

            if (numericMaxDiscount < 0) {
                return jsonError(
                    "Maximum discount cannot be negative",
                    400
                );
            }
        }

        // ----------------------------------------
        // Validate expiry date
        // ----------------------------------------

        let numericExpiryDate = null;

        if (
            expiryDate !== null &&
            expiryDate !== undefined &&
            expiryDate !== ""
        ) {
            const parsed = new Date(expiryDate);

            if (Number.isNaN(parsed.getTime())) {
                return jsonError("Expiry date is not a valid date", 400);
            }

            numericExpiryDate = parsed;
        }

        // ----------------------------------------
        // Validate usage limit
        // ----------------------------------------

        let numericUsageLimit = null;

        if (
            usageLimit !== null &&
            usageLimit !== undefined &&
            usageLimit !== ""
        ) {
            const limitResult = parseOptionalNumber(
                usageLimit,
                "Usage limit"
            );

            if (limitResult.error || limitResult.value === null) {
                return jsonError(
                    limitResult.error || "Usage limit is invalid",
                    400
                );
            }

            numericUsageLimit = limitResult.value;

            if (
                !Number.isInteger(numericUsageLimit) ||
                numericUsageLimit < 1
            ) {
                return jsonError(
                    "Usage limit must be a positive whole number",
                    400
                );
            }
        }

        // ----------------------------------------
        // Validate owner email
        // ----------------------------------------

        let normalizedOwnerEmail = null;

        if (couponType === "welcome") {
            if (typeof ownerEmail !== "string" || !ownerEmail.trim()) {
                return jsonError(
                    "Welcome coupons require an owner email",
                    400
                );
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(ownerEmail.trim())) {
                return jsonError("Owner email is not valid", 400);
            }

            normalizedOwnerEmail = ownerEmail.trim().toLowerCase();
        }

        // ----------------------------------------
        // Check duplicate code
        // ----------------------------------------

        const existing = await CouponModel.findOne({
            code: normalizedCode,
        })
            .select("_id")
            .lean();

        if (existing) {
            return jsonError(
                "A coupon with this code already exists",
                409
            );
        }

        // ----------------------------------------
        // Create coupon
        // ----------------------------------------

        const coupon = await CouponModel.create({
            code: normalizedCode,
            couponType,
            discountType,
            discountValue: numericDiscount,
            minimumOrderAmount: numericMinOrder,
            maximumDiscount: numericMaxDiscount,
            expiryDate: numericExpiryDate,
            usageLimit: numericUsageLimit,
            usedCount: 0,
            isActive: Boolean(isActive),
            ownerEmail: normalizedOwnerEmail,
        });

        // ----------------------------------------
        // Response
        // ----------------------------------------

        return NextResponse.json(
            {
                success: true,
                message: "Coupon created successfully",
                coupon: coupon.toObject(),
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create coupon error:", error);

        // Mongoose duplicate key (race condition)
        if (error?.code === 11000) {
            return jsonError(
                "A coupon with this code already exists",
                409
            );
        }

        // Mongoose validation error
        if (error?.name === "ValidationError") {
            const firstMessage = Object.values(error.errors || {})[0]?.message;

            return jsonError(
                firstMessage || "Coupon validation failed",
                400
            );
        }

        return jsonError(
            process.env.NODE_ENV === "development"
                ? error?.message || "Internal server error"
                : "Something went wrong while creating the coupon",
            500
        );
    }
}