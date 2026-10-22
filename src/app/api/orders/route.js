import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import { isNotificationEnabled } from "@/lib/notificationSettings";

import CartModel from "@/models/Cart.model";
import CouponModel from "@/models/Coupon.model";
import OrderModel from "@/models/Order.model";
import OrderItemModel from "@/models/OrderItem.model";
import ProductModel from "@/models/Product.model";
import NotificationModel from "@/models/Notification.model";

// ============================================================
// CONSTANTS
// ============================================================

const LOW_STOCK_THRESHOLD = 5;

// ============================================================
// HELPERS
// ============================================================

const roundAmount = (value) => {
  return Number(Number(value || 0).toFixed(2));
};

const generateOrderNumber = () => {
  const timestamp = Date.now();

  const randomPart = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();

  return `ORD-${timestamp}-${randomPart}`;
};

const isDuplicateOrderNumberError = (error) => {
  return (
    error?.code === 11000 &&
    (error?.keyPattern?.orderNumber ||
      error?.keyValue?.orderNumber)
  );
};

// ============================================================
// POST - CREATE ORDER
// ============================================================

export async function POST(request) {
  const session = await mongoose.startSession();

  try {
    // ========================================================
    // AUTHENTICATION
    // ========================================================

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in to place an order.",
        },
        { status: 401 }
      );
    }

    // ========================================================
    // ADMIN GUARD
    //
    // Admins are managers, not customers. They must use the
    // POS system for in-store / staff-initiated sales.
    // Blocking them here also protects reporting data from
    // being polluted by test or self-orders.
    // ========================================================

    if (user.role === "admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admins cannot place online orders. Use the POS system for in-store sales.",
        },
        { status: 403 }
      );
    }

    // ========================================================
    // REQUEST BODY
    // ========================================================

    const body = await request.json();

    const paymentMethod =
      body?.paymentMethod?.trim().toLowerCase();

    const shippingAddress = body?.shippingAddress || {};

    const couponCode =
      body?.couponCode?.trim().toUpperCase() || "";

    // ========================================================
    // PAYMENT METHOD CHECK
    // ========================================================

    // For now this API supports COD only.
    // Razorpay will be connected separately.

    if (paymentMethod !== "cod") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only Cash on Delivery is currently available.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // SHIPPING ADDRESS VALIDATION
    // ========================================================

    const fullName =
      shippingAddress?.fullName?.toString().trim() || "";

    const phone =
      shippingAddress?.phone?.toString().trim() || "";

    const addressLine1 =
      shippingAddress?.addressLine1?.toString().trim() || "";

    const addressLine2 =
      shippingAddress?.addressLine2?.toString().trim() || "";

    const city =
      shippingAddress?.city?.toString().trim() || "";

    const state =
      shippingAddress?.state?.toString().trim() || "";

    const postalCode =
      shippingAddress?.postalCode?.toString().trim() || "";

    const country =
      shippingAddress?.country?.toString().trim() || "India";

    // ========================================================
    // REQUIRED ADDRESS FIELDS
    // ========================================================

    if (
      !fullName ||
      !phone ||
      !addressLine1 ||
      !city ||
      !state ||
      !postalCode
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Complete delivery address is required.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // NAME VALIDATION
    // ========================================================

    if (fullName.length < 2 || fullName.length > 50) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Full name must be between 2 and 50 characters.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // PHONE VALIDATION
    // ========================================================

    const phoneRegex = /^[6-9][0-9]{9}$/;

    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a valid 10-digit Indian phone number.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // POSTAL CODE VALIDATION
    // ========================================================

    const postalCodeRegex = /^[1-9][0-9]{5}$/;

    if (!postalCodeRegex.test(postalCode)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a valid 6-digit postal code.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // TRACK PRODUCTS WHOSE STOCK BECAME LOW / EMPTY
    // ========================================================

    const stockNotificationProducts = new Map();

    // ========================================================
    // TRANSACTION
    // ========================================================

    let createdOrder = null;

    await session.withTransaction(async () => {
      // ======================================================
      // GET CART
      // ======================================================

      const cart = await CartModel.findOne({
        user: user.id,
      })
        .session(session)
        .lean();

      if (
        !cart ||
        !Array.isArray(cart.items) ||
        cart.items.length === 0
      ) {
        throw new Error("Your cart is empty.");
      }

      // ======================================================
      // GET PRODUCT IDS
      // ======================================================

      const productIds = cart.items.map(
        (item) => item.product
      );

      // ======================================================
      // FETCH CURRENT PRODUCTS
      // ======================================================

      const products = await ProductModel.find({
        _id: {
          $in: productIds,
        },
      })
        .session(session)
        .lean();

      // ======================================================
      // CREATE PRODUCT MAP
      // ======================================================

      const productMap = new Map();

      products.forEach((product) => {
        productMap.set(
          product._id.toString(),
          product
        );
      });

      // ======================================================
      // VALIDATE PRODUCTS + CALCULATE SUBTOTAL
      // ======================================================

      let subtotal = 0;

      const orderItemsData = [];

      for (const cartItem of cart.items) {
        const productId =
          cartItem?.product?.toString();

        const quantity = Number(
          cartItem?.quantity || 0
        );

        if (!productId) {
          throw new Error(
            "Invalid product found in your cart."
          );
        }

        if (
          !Number.isInteger(quantity) ||
          quantity < 1
        ) {
          throw new Error(
            "Invalid product quantity found in your cart."
          );
        }

        const product = productMap.get(productId);

        if (!product) {
          throw new Error(
            "One of the products in your cart is no longer available."
          );
        }

        // ----------------------------------------------------
        // ACTIVE PRODUCT CHECK
        // ----------------------------------------------------

        if (product.isActive !== true) {
          throw new Error(
            `${product.name} is no longer available.`
          );
        }

        // ----------------------------------------------------
        // STOCK CHECK
        // ----------------------------------------------------

        if (
          Number(product.stock || 0) < quantity
        ) {
          throw new Error(
            `Insufficient stock for ${product.name}.`
          );
        }

        // ----------------------------------------------------
        // CURRENT DATABASE PRICE
        // ----------------------------------------------------

        const price = Number(
          product.price || 0
        );

        const itemSubtotal =
          price * quantity;

        subtotal += itemSubtotal;

        // ----------------------------------------------------
        // ORDER ITEM SNAPSHOT
        // ----------------------------------------------------

        orderItemsData.push({
          product: product._id,

          productName: product.name,

          productImage: product.image || "",

          price,

          quantity,

          subtotal: roundAmount(
            itemSubtotal
          ),
        });
      }

      subtotal = roundAmount(subtotal);

      // ======================================================
      // COUPON
      // ======================================================

      let coupon = null;
      let discount = 0;
      let appliedCouponCode = "";

      if (couponCode) {
        coupon = await CouponModel.findOne({
          code: couponCode,
          isActive: true,
        })
          .session(session)
          .lean();

        if (!coupon) {
          throw new Error(
            "Invalid or inactive coupon code."
          );
        }

        // ----------------------------------------------------
        // EXPIRY CHECK
        // ----------------------------------------------------

        if (
          coupon.expiryDate &&
          new Date(coupon.expiryDate) < new Date()
        ) {
          throw new Error(
            "This coupon has expired."
          );
        }

        // ----------------------------------------------------
        // USAGE LIMIT CHECK
        // ----------------------------------------------------

        if (
          coupon.usageLimit !== null &&
          Number(coupon.usedCount || 0) >=
          Number(coupon.usageLimit)
        ) {
          throw new Error(
            "This coupon usage limit has been reached."
          );
        }

        // ----------------------------------------------------
        // REDEEMED CHECK
        // ----------------------------------------------------

        if (coupon.redeemed === true) {
          throw new Error(
            "This coupon has already been used."
          );
        }

        // ----------------------------------------------------
        // WELCOME COUPON VALIDATION
        // ----------------------------------------------------

        if (coupon.couponType === "welcome") {
          const userEmail =
            user.email?.trim().toLowerCase();

          const couponOwnerEmail =
            coupon.ownerEmail
              ?.trim()
              .toLowerCase();

          // --------------------------------------------------
          // OWNER EMAIL CHECK
          // --------------------------------------------------

          if (
            !couponOwnerEmail ||
            !userEmail ||
            couponOwnerEmail !== userEmail
          ) {
            throw new Error(
              "This welcome coupon is not valid for your account."
            );
          }

          // --------------------------------------------------
          // ASSIGNED USER CHECK
          // --------------------------------------------------

          if (
            coupon.assignedUser &&
            coupon.assignedUser.toString() !==
            user.id.toString()
          ) {
            throw new Error(
              "This welcome coupon is not assigned to your account."
            );
          }

          // --------------------------------------------------
          // FIRST ORDER CHECK
          // --------------------------------------------------

          const existingOrder =
            await OrderModel.findOne({
              user: user.id,
              $or: [
                {
                  paymentStatus: "paid",
                },
                {
                  paymentMethod: "cod",
                  orderStatus: {
                    $nin: ["cancelled"],
                  },
                },
              ],
            })
              .session(session)
              .select("_id")
              .lean();

          if (existingOrder) {
            throw new Error(
              "Welcome coupons are available only for your first order."
            );
          }
        }

        // ----------------------------------------------------
        // MINIMUM ORDER CHECK
        // ----------------------------------------------------

        if (
          subtotal <
          Number(
            coupon.minimumOrderAmount || 0
          )
        ) {
          throw new Error(
            `Minimum order amount for this coupon is ₹${Number(
              coupon.minimumOrderAmount || 0
            ).toFixed(2)}.`
          );
        }

        // ----------------------------------------------------
        // CALCULATE DISCOUNT
        // ----------------------------------------------------

        if (
          coupon.discountType === "percentage"
        ) {
          discount =
            (subtotal *
              Number(
                coupon.discountValue || 0
              )) /
            100;
        }

        if (
          coupon.discountType === "fixed"
        ) {
          discount = Number(
            coupon.discountValue || 0
          );
        }

        // ----------------------------------------------------
        // MAXIMUM DISCOUNT
        // ----------------------------------------------------

        if (
          coupon.maximumDiscount !== null &&
          Number(coupon.maximumDiscount) > 0 &&
          discount >
          Number(coupon.maximumDiscount)
        ) {
          discount =
            Number(
              coupon.maximumDiscount
            );
        }

        // ----------------------------------------------------
        // DISCOUNT CANNOT EXCEED SUBTOTAL
        // ----------------------------------------------------

        if (discount > subtotal) {
          discount = subtotal;
        }

        discount = roundAmount(discount);

        appliedCouponCode = coupon.code;
      }

      // ======================================================
      // SHIPPING
      // ======================================================

      const shipping = 0;

      // ======================================================
      // FINAL TOTAL
      // ======================================================

      const total = roundAmount(
        Math.max(
          subtotal -
          discount +
          shipping,
          0
        )
      );

      // ======================================================
      // ATOMIC STOCK REDUCTION
      // ======================================================

      for (const cartItem of cart.items) {
        const productId =
          cartItem?.product?.toString();

        const quantity = Number(
          cartItem?.quantity || 0
        );

        // ----------------------------------------------------
        // Atomically reduce stock and return updated product.
        // ----------------------------------------------------

        const updatedProduct =
          await ProductModel.findOneAndUpdate(
            {
              _id: productId,
              isActive: true,
              stock: {
                $gte: quantity,
              },
            },
            {
              $inc: {
                stock: -quantity,
              },
            },
            {
              new: true,
              session,
            }
          ).lean();

        if (!updatedProduct) {
          throw new Error(
            "Stock changed while placing your order. Please try again."
          );
        }

        // ----------------------------------------------------
        // Store the updated stock information.
        // ----------------------------------------------------

        const updatedStock =
          Number(updatedProduct.stock || 0);

        if (
          updatedStock === 0 ||
          updatedStock <= LOW_STOCK_THRESHOLD
        ) {
          stockNotificationProducts.set(
            updatedProduct._id.toString(),
            {
              id: updatedProduct._id,
              name: updatedProduct.name,
              stock: updatedStock,
            }
          );
        }
      }

      // ======================================================
      // GENERATE ORDER NUMBER
      // ======================================================

      const orderNumber =
        generateOrderNumber();

      // ======================================================
      // EXTRA COLLISION CHECK
      // ======================================================

      const existingOrder =
        await OrderModel.findOne({
          orderNumber,
        })
          .session(session)
          .lean();

      if (existingOrder) {
        throw new Error(
          "A temporary order number conflict occurred. Please try placing your order again."
        );
      }

      // ======================================================
      // CREATE ORDER
      // ======================================================

      const order = new OrderModel({
        user: user.id,

        orderNumber,

        shippingAddress: {
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          country,
        },

        subtotal,

        discount,

        shipping,

        total,

        coupon: coupon?._id || null,

        couponCode: appliedCouponCode,

        paymentMethod: "cod",

        paymentStatus: "pending",

        orderStatus: "confirmed",

        // ==================================================
        // INITIAL SHIPPING DETAILS
        // ==================================================

        shippingDetails: {
          carrier: "",
          trackingNumber: "",
          trackingUrl: "",
          estimatedDeliveryDate: null,
          shippedAt: null,
          outForDeliveryAt: null,
          deliveredAt: null,
        },

        // ==================================================
        // INITIAL TRACKING EVENT
        // ==================================================

        trackingEvents: [
          {
            status: "confirmed",

            title: "Order confirmed",

            description:
              "Your order has been confirmed.",

            location: city,

            timestamp: new Date(),
          },
        ],

        razorpayOrderId: "",

        razorpayPaymentId: "",

        razorpaySignature: "",

        paidAt: null,

        cancelledAt: null,

        cancellationReason: "",
      });

      createdOrder =
        await order.save({
          session,
        });

      // ======================================================
      // REDEEM COUPON
      // ======================================================

      if (coupon) {
        const couponUpdate =
          await CouponModel.updateOne(
            {
              _id: coupon._id,
              isActive: true,
              redeemed: false,

              $or: [
                {
                  usageLimit: null,
                },
                {
                  $expr: {
                    $lt: [
                      "$usedCount",
                      "$usageLimit",
                    ],
                  },
                },
              ],
            },
            {
              $inc: {
                usedCount: 1,
              },

              $set: {
                redeemed: true,
                redeemedAt: new Date(),
                redeemedBy: user.id,
                redeemedOrder:
                  createdOrder._id,
              },
            }
          ).session(session);

        if (
          couponUpdate.modifiedCount !== 1
        ) {
          throw new Error(
            "This coupon is no longer available."
          );
        }
      }

      // ======================================================
      // CREATE ORDER ITEMS
      // ======================================================

      const orderItems =
        orderItemsData.map(
          (item) => ({
            ...item,
            order: createdOrder._id,
          })
        );

      await OrderItemModel.insertMany(
        orderItems,
        {
          session,
        }
      );

      // ======================================================
      // CLEAR CART
      // ======================================================

      await CartModel.deleteOne({
        user: user.id,
      }).session(session);
    });

    // ========================================================
    // CREATE ADMIN NOTIFICATIONS
    // ========================================================

    // --------------------------------------------------------
    // 1. NEW ORDER NOTIFICATION
    // --------------------------------------------------------

    try {
      const newOrderEnabled =
        await isNotificationEnabled("new_order");

      if (newOrderEnabled) {
        await NotificationModel.create({
          type: "new_order",

          title: "New Order Received",

          message: `New order #${createdOrder.orderNumber} has been placed by ${fullName}.`,

          relatedId: createdOrder._id,

          link: "/admin/orders",

          isRead: false,

          readAt: null,
        });
      }
    } catch (notificationError) {
      console.error(
        "Create order notification error:",
        notificationError
      );
    }

    // --------------------------------------------------------
    // 2. LOW STOCK / OUT OF STOCK NOTIFICATIONS
    // --------------------------------------------------------

    try {
      const lowStockEnabled =
        await isNotificationEnabled("low_stock");

      if (lowStockEnabled) {
        for (const product of stockNotificationProducts.values()) {
          try {
            const notificationType =
              product.stock === 0
                ? "out_of_stock"
                : "low_stock";

            // ------------------------------------------------
            // Prevent duplicate unread notifications for the
            // same product and notification type.
            // ------------------------------------------------

            const existingNotification =
              await NotificationModel.findOne({
                type: notificationType,

                relatedId: product.id,

                isRead: false,
              }).lean();

            if (existingNotification) {
              continue;
            }

            // ------------------------------------------------
            // OUT OF STOCK
            // ------------------------------------------------

            if (product.stock === 0) {
              await NotificationModel.create({
                type: "out_of_stock",

                title: "Product Out of Stock",

                message: `${product.name} is now out of stock.`,

                relatedId: product.id,

                link: "/admin/products",

                isRead: false,

                readAt: null,
              });

              continue;
            }

            // ------------------------------------------------
            // LOW STOCK
            // ------------------------------------------------

            await NotificationModel.create({
              type: "low_stock",

              title: "Low Stock Alert",

              message: `${product.name} has only ${product.stock} unit${product.stock === 1 ? "" : "s"
                } left in stock.`,

              relatedId: product.id,

              link: "/admin/products",

              isRead: false,

              readAt: null,
            });
          } catch (notificationError) {
            // ------------------------------------------------
            // Notification failure must never fail the order.
            // ------------------------------------------------

            console.error(
              `Create stock notification error for ${product.name}:`,
              notificationError
            );
          }
        }
      }
    } catch (notificationError) {
      console.error(
        "Check low stock notification setting error:",
        notificationError
      );
    }

    // ========================================================
    // SUCCESS RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Cash on Delivery order placed successfully.",

        order: {
          id:
            createdOrder._id.toString(),

          orderNumber:
            createdOrder.orderNumber,

          subtotal:
            createdOrder.subtotal,

          discount:
            createdOrder.discount,

          shipping:
            createdOrder.shipping,

          total:
            createdOrder.total,

          paymentMethod:
            createdOrder.paymentMethod,

          paymentStatus:
            createdOrder.paymentStatus,

          orderStatus:
            createdOrder.orderStatus,

          couponCode:
            createdOrder.couponCode,

          trackingEvents:
            createdOrder.trackingEvents,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    // ========================================================
    // DUPLICATE ORDER NUMBER
    // ========================================================

    if (
      isDuplicateOrderNumberError(error)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A temporary order-number conflict occurred. Please try placing your order again.",
        },
        { status: 409 }
      );
    }

    // ========================================================
    // TRANSACTION ERROR
    // ========================================================

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Something went wrong while placing your order.",
      },
      { status: 500 }
    );
  } finally {
    await session.endSession();
  }
}