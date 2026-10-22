// FILE LOCATION: src/app/api/admin/coupons/[id]/route.js

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

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
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
// AUTH GUARD
// ============================================================

async function requireAdmin() {
    const user = await getCurrentUser();

    if (!user) {
        return { error: jsonError("Authentication required", 401) };
    }

    if (user.role !== "admin") {
        return { error: jsonError("Admin access required", 403) };
    }

    return { user };
}

// ============================================================
// GET - SINGLE COUPON
// ============================================================

export async function GET(request, { params }) {
    try {
        // ----------------------------------------
        // Auth
        // ----------------------------------------

        const auth = await requireAdmin();

        if (auth.error) return auth.error;

        // ----------------------------------------
        // Params
        // ----------------------------------------

        const { id } = await params;

        if (!isValidObjectId(id)) {
            return jsonError("Invalid coupon ID", 400);
        }

        await connectDB();

        // ----------------------------------------
        // Find coupon
        // ----------------------------------------

        const coupon = await CouponModel.findById(id).lean();

        if (!coupon) {
            return jsonError("Coupon not found", 404);
        }

        // ----------------------------------------
        // Response
        // ----------------------------------------

        return NextResponse.json(
            {
                success: true,
                coupon,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get coupon error:", error);

        return jsonError(
            process.env.NODE_ENV === "development"
                ? error?.message || "Internal server error"
                : "Something went wrong while fetching the coupon",
            500
        );
    }
}

// ============================================================
// PUT - UPDATE COUPON
// ============================================================

export async function PUT(request, { params }) {
    try {
        // ----------------------------------------
        // Auth
        // ----------------------------------------

        const auth = await requireAdmin();

        if (auth.error) return auth.error;

        // ----------------------------------------
        // Params
        // ----------------------------------------

        const { id } = await params;

        if (!isValidObjectId(id)) {
            return jsonError("Invalid coupon ID", 400);
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

        // ----------------------------------------
        // Fetch existing coupon
        // ----------------------------------------

        const coupon = await CouponModel.findById(id);

        if (!coupon) {
            return jsonError("Coupon not found", 404);
        }

        // ----------------------------------------
        // Destructure payload
        // ----------------------------------------

        const {
            code,
            couponType,
            discountType,
            discountValue,
            minimumOrderAmount,
            maximumDiscount,
            expiryDate,
            usageLimit,
            isActive,
            ownerEmail,
        } = body;

        // ----------------------------------------
        // Frozen fields after redemption
        // ----------------------------------------
        //
        // Once a coupon is redeemed, its code and type must not
        // change. This protects the audit trail.
        //
        // ----------------------------------------

        if (coupon.redeemed) {
            if (code !== undefined && String(code).trim().toUpperCase() !== coupon.code) {
                return jsonError(
                    "Cannot change the code of a redeemed coupon",
                    400
                );
            }

            if (
                couponType !== undefined &&
                couponType !== coupon.couponType
            ) {
                return jsonError(
                    "Cannot change the type of a redeemed coupon",
                    400
                );
            }
        }

        // ----------------------------------------
        // Validate code (if provided)
        // ----------------------------------------

        if (code !== undefined) {
            if (typeof code !== "string" || !code.trim()) {
                return jsonError("Coupon code cannot be empty", 400);
            }

            const normalizedCode = code.trim().toUpperCase();

            if (normalizedCode.length < 3 || normalizedCode.length > 30) {
                return jsonError(
                    "Coupon code must be between 3 and 30 characters",
                    400
                );
            }

            if (normalizedCode !== coupon.code) {
                // Check for duplicate
                const duplicate = await CouponModel.findOne({
                    code: normalizedCode,
                    _id: { $ne: coupon._id },
                })
                    .select("_id")
                    .lean();

                if (duplicate) {
                    return jsonError(
                        "A coupon with this code already exists",
                        409
                    );
                }

                coupon.code = normalizedCode;
            }
        }

        // ----------------------------------------
        // Validate couponType (if provided)
        // ----------------------------------------

        if (couponType !== undefined) {
            if (couponType !== "general" && couponType !== "welcome") {
                return jsonError(
                    'Coupon type must be either "general" or "welcome"',
                    400
                );
            }

            coupon.couponType = couponType;
        }

        // ----------------------------------------
        // Validate discountType (if provided)
        // ----------------------------------------

        if (discountType !== undefined) {
            if (
                discountType !== "percentage" &&
                discountType !== "fixed"
            ) {
                return jsonError(
                    'Discount type must be either "percentage" or "fixed"',
                    400
                );
            }

            coupon.discountType = discountType;
        }

        // ----------------------------------------
        // Validate discountValue (if provided)
        // ----------------------------------------

        if (discountValue !== undefined) {
            const result = parseOptionalNumber(
                discountValue,
                "Discount value"
            );

            if (result.error || result.value === null) {
                return jsonError(
                    result.error || "Discount value is required",
                    400
                );
            }

            if (result.value <= 0) {
                return jsonError(
                    "Discount value must be greater than 0",
                    400
                );
            }

            // Percentage validation against the *effective* discountType
            const effectiveType =
                discountType !== undefined ? discountType : coupon.discountType;

            if (effectiveType === "percentage" && result.value > 100) {
                return jsonError(
                    "Percentage discount cannot exceed 100",
                    400
                );
            }

            coupon.discountValue = result.value;
        }

        // ----------------------------------------
        // Validate minimumOrderAmount (if provided)
        // ----------------------------------------

        if (minimumOrderAmount !== undefined) {
            const result = parseOptionalNumber(
                minimumOrderAmount,
                "Minimum order amount"
            );

            if (result.error) {
                return jsonError(result.error, 400);
            }

            const value = result.value ?? 0;

            if (value < 0) {
                return jsonError(
                    "Minimum order amount cannot be negative",
                    400
                );
            }

            coupon.minimumOrderAmount = value;
        }

        // ----------------------------------------
        // Validate maximumDiscount (if provided)
        // ----------------------------------------

        if (maximumDiscount !== undefined) {
            if (
                maximumDiscount === null ||
                maximumDiscount === ""
            ) {
                coupon.maximumDiscount = null;
            } else {
                const result = parseOptionalNumber(
                    maximumDiscount,
                    "Maximum discount"
                );

                if (result.error || result.value === null) {
                    return jsonError(
                        result.error || "Maximum discount is invalid",
                        400
                    );
                }

                if (result.value < 0) {
                    return jsonError(
                        "Maximum discount cannot be negative",
                        400
                    );
                }

                coupon.maximumDiscount = result.value;
            }
        }

        // ----------------------------------------
        // Validate expiryDate (if provided)
        // ----------------------------------------

        if (expiryDate !== undefined) {
            if (expiryDate === null || expiryDate === "") {
                coupon.expiryDate = null;
            } else {
                const parsed = new Date(expiryDate);

                if (Number.isNaN(parsed.getTime())) {
                    return jsonError("Expiry date is not a valid date", 400);
                }

                coupon.expiryDate = parsed;
            }
        }

        // ----------------------------------------
        // Validate usageLimit (if provided)
        // ----------------------------------------

        if (usageLimit !== undefined) {
            if (usageLimit === null || usageLimit === "") {
                coupon.usageLimit = null;
            } else {
                const result = parseOptionalNumber(
                    usageLimit,
                    "Usage limit"
                );

                if (result.error || result.value === null) {
                    return jsonError(
                        result.error || "Usage limit is invalid",
                        400
                    );
                }

                if (
                    !Number.isInteger(result.value) ||
                    result.value < 1
                ) {
                    return jsonError(
                        "Usage limit must be a positive whole number",
                        400
                    );
                }

                if (result.value < coupon.usedCount) {
                    return jsonError(
                        `Usage limit cannot be lower than the used count (${coupon.usedCount})`,
                        400
                    );
                }

                coupon.usageLimit = result.value;
            }
        }

        // ----------------------------------------
        // Validate isActive (if provided)
        // ----------------------------------------

        if (isActive !== undefined) {
            if (typeof isActive !== "boolean") {
                return jsonError(
                    "isActive must be true or false",
                    400
                );
            }

            coupon.isActive = isActive;
        }

        // ----------------------------------------
        // Validate ownerEmail (if provided)
        // ----------------------------------------

        if (ownerEmail !== undefined) {
            if (ownerEmail === null || ownerEmail === "") {
                coupon.ownerEmail = null;
            } else {
                if (typeof ownerEmail !== "string") {
                    return jsonError("Owner email must be a string", 400);
                }

                const trimmed = ownerEmail.trim().toLowerCase();

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!emailRegex.test(trimmed)) {
                    return jsonError("Owner email is not valid", 400);
                }

                coupon.ownerEmail = trimmed;
            }
        }

        // ----------------------------------------
        // Welcome coupon requires ownerEmail
        // ----------------------------------------

        if (
            coupon.couponType === "welcome" &&
            !coupon.ownerEmail
        ) {
            return jsonError(
                "Welcome coupons require an owner email",
                400
            );
        }

        // ----------------------------------------
        // Save (triggers pre-validate hooks)
        // ----------------------------------------

        await coupon.save();

        // ----------------------------------------
        // Response
        // ----------------------------------------

        return NextResponse.json(
            {
                success: true,
                message: "Coupon updated successfully",
                coupon: coupon.toObject(),
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Update coupon error:", error);

        if (error?.code === 11000) {
            return jsonError(
                "A coupon with this code already exists",
                409
            );
        }

        if (error?.name === "ValidationError") {
            const firstMessage = Object.values(error.errors || {})[0]?.message;

            return jsonError(
                firstMessage || "Coupon validation failed",
                400
            );
        }

        if (error?.name === "CastError") {
            return jsonError("Invalid coupon data", 400);
        }

        return jsonError(
            process.env.NODE_ENV === "development"
                ? error?.message || "Internal server error"
                : "Something went wrong while updating the coupon",
            500
        );
    }
}

// ============================================================
// DELETE - DELETE COUPON
// ============================================================

export async function DELETE(request, { params }) {
    try {
        // ----------------------------------------
        // Auth
        // ----------------------------------------

        const auth = await requireAdmin();

        if (auth.error) return auth.error;

        // ----------------------------------------
        // Params
        // ----------------------------------------

        const { id } = await params;

        if (!isValidObjectId(id)) {
            return jsonError("Invalid coupon ID", 400);
        }

        await connectDB();

        // ----------------------------------------
        // Find coupon
        // ----------------------------------------

        const coupon = await CouponModel.findById(id);

        if (!coupon) {
            return jsonError("Coupon not found", 404);
        }

        // ----------------------------------------
        // Protect redeemed coupons
        // ----------------------------------------
        //
        // Redeemed coupons carry audit history (who used it, on
        // which order, at what time). Deleting them would break
        // that history. Admins should deactivate them instead.
        //
        // ----------------------------------------

        if (coupon.redeemed) {
            return jsonError(
                "Redeemed coupons cannot be deleted. Deactivate them instead.",
                400
            );
        }

        // ----------------------------------------
        // Warn about coupons already in use
        // ----------------------------------------
        //
        // If the coupon has been partially used (usedCount > 0),
        // deletion is discouraged but still allowed. If you prefer
        // to block it, uncomment the block below.
        //
        // ----------------------------------------

        // if (coupon.usedCount > 0) {
        //   return jsonError(
        //     "Coupons that have been used cannot be deleted. Deactivate them instead.",
        //     400
        //   );
        // }

        // ----------------------------------------
        // Delete
        // ----------------------------------------

        await coupon.deleteOne();

        // ----------------------------------------
        // Response
        // ----------------------------------------

        return NextResponse.json(
            {
                success: true,
                message: "Coupon deleted successfully",
                deletedCouponId: id,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Delete coupon error:", error);

        if (error?.name === "CastError") {
            return jsonError("Invalid coupon ID", 400);
        }

        return jsonError(
            process.env.NODE_ENV === "development"
                ? error?.message || "Internal server error"
                : "Something went wrong while deleting the coupon",
            500
        );
    }
}