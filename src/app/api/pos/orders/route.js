import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import OrderModel from "@/models/Order.model";
import OrderItemModel from "@/models/OrderItem.model";
import ProductModel from "@/models/Product.model";

// ============================================================
// POST /api/pos/orders
// ============================================================

export async function POST(request) {
    const session = await mongoose.startSession();

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
        // DATABASE
        // ============================================================

        await connectDB();

        // ============================================================
        // PARSE BODY
        // ============================================================

        let body;

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, message: "Invalid request body." },
                { status: 400 }
            );
        }

        // ============================================================
        // VALIDATE CUSTOMER TYPE
        // ============================================================

        const customerType = body?.customerType;

        if (!["retail", "wholesale"].includes(customerType)) {
            return NextResponse.json(
                { success: false, message: "Invalid customer type." },
                { status: 400 }
            );
        }

        // ============================================================
        // VALIDATE PAYMENT METHOD
        // ============================================================

        const paymentMethod = body?.paymentMethod;

        if (!["cash", "card", "upi"].includes(paymentMethod)) {
            return NextResponse.json(
                { success: false, message: "Invalid payment method." },
                { status: 400 }
            );
        }

        // ============================================================
        // VALIDATE ITEMS
        // ============================================================

        const items = Array.isArray(body?.items) ? body.items : [];

        if (items.length === 0) {
            return NextResponse.json(
                { success: false, message: "Cart is empty." },
                { status: 400 }
            );
        }

        // ============================================================
        // LOAD PRODUCTS
        // ============================================================

        const productIds = items
            .map((i) => i?.productId)
            .filter(Boolean);

        if (productIds.length !== items.length) {
            return NextResponse.json(
                { success: false, message: "Invalid product reference in cart." },
                { status: 400 }
            );
        }

        if (!productIds.every((id) => mongoose.isValidObjectId(id))) {
            return NextResponse.json(
                { success: false, message: "Invalid product ID." },
                { status: 400 }
            );
        }

        const products = await ProductModel.find({
            _id: { $in: productIds },
        }).lean();

        const productMap = new Map(
            products.map((p) => [String(p._id), p])
        );

        // ============================================================
        // BUILD LINE ITEMS + VALIDATE STOCK
        // ============================================================

        let subtotal = 0;
        let totalDiscount = 0;

        const lineItems = [];

        for (const item of items) {
            const product = productMap.get(String(item.productId));

            if (!product) {
                return NextResponse.json(
                    {
                        success: false,
                        message: `Product not found: ${item.productId}`,
                    },
                    { status: 400 }
                );
            }

            const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

            if (product.stock < qty) {
                return NextResponse.json(
                    {
                        success: false,
                        message: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
                    },
                    { status: 400 }
                );
            }

            const mrp = product.price;

            let discountPct = 0;

            if (customerType === "wholesale") {
                discountPct = Math.min(
                    100,
                    Math.max(
                        0,
                        parseFloat(item.wholesaleDiscountPercentage) || 0
                    )
                );
            }

            const discountAmountPerUnit = (mrp * discountPct) / 100;

            const unitPrice =
                Math.round((mrp - discountAmountPerUnit) * 100) / 100;

            const lineTotal =
                Math.round(unitPrice * qty * 100) / 100;

            const lineDiscount =
                Math.round(discountAmountPerUnit * qty * 100) / 100;

            subtotal += mrp * qty;
            totalDiscount += lineDiscount;

            lineItems.push({
                product,
                quantity: qty,
                mrp,
                wholesaleDiscountPercentage: discountPct,
                wholesaleDiscountAmount: lineDiscount,
                unitPrice,
                subtotal: lineTotal,
            });
        }

        const total =
            Math.round((subtotal - totalDiscount) * 100) / 100;

        // ============================================================
        // GENERATE BILL NUMBER + ORDER NUMBER
        // ============================================================

        const now = new Date();
        const yyyy = now.getFullYear();
        const seq = Date.now().toString().slice(-6);

        const billNumber = `POS-${yyyy}-${seq}`;
        const orderNumber = `POS-${yyyy}-${seq}`;

        // ============================================================
        // CREATE ORDER + ITEMS IN A TRANSACTION
        // ============================================================

        let createdOrder = null;

        await session.withTransaction(async () => {
            const [orderDoc] = await OrderModel.create(
                [
                    {
                        user: null,
                        source: "pos",
                        customerType,
                        orderNumber,

                        // POS sales have no shipping address
                        subtotal,
                        discount: totalDiscount,
                        shipping: 0,
                        total,

                        paymentMethod,
                        paymentStatus: "paid",
                        orderStatus: "delivered",

                        paidAt: now,

                        shippingDetails: {},

                        trackingEvents: [
                            {
                                status: "delivered",
                                title: "POS Sale Completed",
                                description: "In-store sale completed.",
                                timestamp: now,
                            },
                        ],

                        posMetadata: {
                            cashierId: currentUser._id,
                            cashierName:
                                currentUser.name ||
                                currentUser.email ||
                                "Admin",
                            walkInCustomer:
                                body.walkInCustomer !== false,
                            customerName: (body.customerName || "").trim(),
                            customerPhone: (body.customerPhone || "").trim(),
                            paymentMethod,
                            totalWholesaleDiscount: totalDiscount,
                            billNumber,
                        },
                    },
                ],
                { session }
            );

            const orderItemsToCreate = lineItems.map((li) => ({
                order: orderDoc._id,
                product: li.product._id,
                productName: li.product.name,
                productImage:
                    (Array.isArray(li.product.images) &&
                        li.product.images[0]) ||
                    li.product.image ||
                    "",
                price: li.mrp,
                quantity: li.quantity,
                subtotal: li.subtotal,
                mrp: li.mrp,
                wholesaleDiscountPercentage:
                    li.wholesaleDiscountPercentage,
                wholesaleDiscountAmount: li.wholesaleDiscountAmount,
                unitPrice: li.unitPrice,
            }));

            await OrderItemModel.insertMany(orderItemsToCreate, {
                session,
            });

            // Reduce stock for each product
            for (const li of lineItems) {
                await ProductModel.updateOne(
                    { _id: li.product._id },
                    { $inc: { stock: -li.quantity } },
                    { session }
                );
            }

            createdOrder = orderDoc;
        });

        // ============================================================
        // RESPONSE
        // ============================================================

        return NextResponse.json({
            success: true,
            message: "POS bill created.",
            order: {
                _id: createdOrder._id.toString(),
                orderNumber: createdOrder.orderNumber,
                billNumber,
                customerType,
                customerName: createdOrder.posMetadata.customerName,
                customerPhone: createdOrder.posMetadata.customerPhone,
                paymentMethod,
                subtotal,
                discount: totalDiscount,
                total,
                createdAt: createdOrder.createdAt,
                cashierName: createdOrder.posMetadata.cashierName,
                items: lineItems.map((li) => ({
                    productName: li.product.name,
                    mrp: li.mrp,
                    wholesaleDiscountPercentage:
                        li.wholesaleDiscountPercentage,
                    unitPrice: li.unitPrice,
                    quantity: li.quantity,
                    lineTotal: li.subtotal,
                })),
            },
        });
    } catch (error) {
        console.error("POS order error:", error);

        return NextResponse.json(
            { success: false, message: "Failed to create POS bill." },
            { status: 500 }
        );
    } finally {
        await session.endSession();
    }
}