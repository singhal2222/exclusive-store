"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import {
  FiArrowRight,
  FiCheck,
  FiMapPin,
  FiShoppingBag,
  FiTruck,
  FiClock,
  FiExternalLink,
  FiCheckCircle,
} from "react-icons/fi";

// ============================================================
// ORDER SUCCESS COMPONENT
// ============================================================

const OrderSuccess = ({ user }) => {
  // ============================================================
  // STATES
  // ============================================================

  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ============================================================
  // LOAD ORDER FROM DATABASE
  // ============================================================

  useEffect(() => {
    const controller = new AbortController();

    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");

        // ------------------------------------------------------
        // GET ORDER ID FROM SESSION STORAGE
        // ------------------------------------------------------

        const storedOrder = sessionStorage.getItem("orderConfirmation");

        if (!storedOrder) {
          setError("Order confirmation details are not available.");
          return;
        }

        let parsedOrder;

        try {
          parsedOrder = JSON.parse(storedOrder);
        } catch (parseError) {
          console.error("Order confirmation parse error:", parseError);

          setError("Unable to read your order confirmation.");

          return;
        }

        const orderId = parsedOrder?.id || parsedOrder?._id;

        if (!orderId) {
          setError("Order ID is missing from the confirmation details.");

          return;
        }

        // ------------------------------------------------------
        // FETCH AUTHORITATIVE ORDER DATA
        // ------------------------------------------------------

        const response = await fetch(`/api/orders/${orderId}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Unable to load your order.");
        }

        if (!data?.order) {
          throw new Error("Order details were not returned.");
        }

        setOrder(data.order);
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("Load order success error:", error);

        setError(error?.message || "Unable to load your order confirmation.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      controller.abort();
    };
  }, []);

  // ============================================================
  // FORMAT PRICE
  // ============================================================

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(price) || 0);
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // FORMAT DATE TIME
  // ============================================================

  const formatDateTime = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================================
  // FORMAT STATUS
  // ============================================================

  const formatStatus = (status) => {
    if (!status) {
      return "Pending";
    }

    return status
      .toString()
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };

  // ============================================================
  // PAYMENT METHOD LABEL
  // ============================================================

  const getPaymentMethodLabel = (paymentMethod) => {
    switch (paymentMethod) {
      case "cod":
        return "Cash on Delivery";

      case "razorpay":
        return "Online Payment";

      default:
        return formatStatus(paymentMethod);
    }
  };

  // ============================================================
  // TRACKING DOT COLOR
  // ============================================================

  const getTrackingDotClasses = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-500";

      case "processing":
        return "bg-yellow-500";

      case "shipped":
        return "bg-purple-500";

      case "out_for_delivery":
        return "bg-orange-500";

      case "delivered":
        return "bg-green-500";

      case "cancelled":
        return "bg-red-500";

      case "pending":
      default:
        return "bg-gray-400";
    }
  };

  // ============================================================
  // LOADING UI
  // ============================================================

  if (loading) {
    return (
      <section className="min-h-screen bg-[#F5F5F5] px-4 py-8 font-poppins sm:px-6 sm:py-10 lg:px-10 xl:px-16">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center justify-center">
          <div className="w-full max-w-2xl animate-pulse rounded-lg bg-white p-6 sm:p-8">
            <div className="mx-auto h-16 w-16 rounded-full bg-gray-200 sm:h-20 sm:w-20" />

            <div className="mx-auto mt-5 h-6 w-56 rounded bg-gray-200 sm:mt-6 sm:h-8 sm:w-72" />

            <div className="mx-auto mt-3 h-4 w-full max-w-[90%] rounded bg-gray-200 sm:w-96" />

            <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
              <div className="h-20 rounded-md bg-gray-200" />
              <div className="h-20 rounded-md bg-gray-200" />
              <div className="h-20 rounded-md bg-gray-200" />
            </div>

            <div className="mt-5 h-40 rounded-md bg-gray-200 sm:mt-6" />
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // ERROR UI
  // ============================================================

  if (error || !order) {
    return (
      <section className="min-h-screen bg-[#F5F5F5] px-4 py-8 font-poppins sm:px-6 sm:py-10 lg:px-10 xl:px-16">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center justify-center">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF5F5] sm:h-16 sm:w-16">
              <FiShoppingBag size={24} className="text-[#DB4444] sm:hidden" />
              <FiShoppingBag
                size={28}
                className="hidden text-[#DB4444] sm:block"
              />
            </div>

            <h1 className="mt-6 text-xl font-semibold text-black sm:text-2xl">
              Order Confirmation
            </h1>

            <p className="mt-3 text-xs leading-5 text-[#7A7A7A] sm:text-[13px] sm:leading-6">
              {error || "Order confirmation details are not available."}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row sm:gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-md bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-black sm:px-6 sm:py-3 sm:text-[13px]"
              >
                Continue Shopping
              </Link>

              <Link
                href="/account/orders"
                className="inline-flex items-center justify-center rounded-md border border-[#E5E5E5] bg-white px-5 py-2.5 text-xs font-medium text-black transition-colors hover:border-[#DB4444] hover:text-[#DB4444] sm:px-6 sm:py-3 sm:text-[13px]"
              >
                View My Orders
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // ORDER DATA
  // ============================================================

  const orderNumber = order?.orderNumber || "N/A";

  const paymentMethod = order?.paymentMethod || "cod";

  const paymentStatus = order?.paymentStatus || "pending";

  const orderStatus = order?.orderStatus || "pending";

  const subtotal = Number(order?.subtotal) || 0;

  const discount = Number(order?.discount) || 0;

  const shipping = Number(order?.shipping) || 0;

  const total = Number(order?.total) || 0;

  const paymentMethodLabel = getPaymentMethodLabel(paymentMethod);

  const paymentStatusLabel = formatStatus(paymentStatus);

  const orderStatusLabel = formatStatus(orderStatus);

  // ============================================================
  // TRACKING EVENTS
  // ============================================================

  const trackingEvents = Array.isArray(order?.trackingEvents)
    ? [...order.trackingEvents].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )
    : [];

  // ============================================================
  // SHIPPING DETAILS
  // ============================================================

  const shippingDetails = order?.shippingDetails || {};

  // ============================================================
  // DELIVERY ADDRESS
  // ============================================================

  const deliveryAddress = order?.shippingAddress || {};

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <section className="min-h-screen bg-[#F5F5F5] px-4 py-8 font-poppins sm:px-6 sm:py-10 lg:px-10 xl:px-16">
      <div className="mx-auto w-full max-w-5xl">
        {/* ==================================================
            SUCCESS HEADER
        ================================================== */}

        <div className="rounded-lg bg-white px-4 py-8 text-center shadow-sm sm:px-8 sm:py-10 md:py-12">
          {/* Success Icon */}

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF5F5] sm:h-20 sm:w-20">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#DB4444] text-white sm:h-14 sm:w-14">
              <FiCheck size={22} className="sm:hidden" />
              <FiCheck size={30} className="hidden sm:block" />
            </div>
          </div>

          {/* Title */}

          <h1 className="mt-5 text-xl font-semibold text-black sm:mt-7 sm:text-2xl md:text-3xl">
            Order Placed Successfully
            <span className="text-[#DB4444]">.</span>
          </h1>

          {/* Message */}

          <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-[#7A7A7A] sm:text-sm sm:leading-6">
            Thank you for your order
            {user?.name ? `, ${user.name}` : ""}. Your order has been
            successfully placed.
          </p>
        </div>

        {/* ==================================================
            ORDER SUMMARY CARDS
        ================================================== */}

        <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
          {/* Order Number */}

          <div className="rounded-lg border border-[#E5E5E5] bg-white p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-wide text-[#7A7A7A] sm:text-[11px]">
              Order Number
            </p>

            <p className="mt-2 break-all text-xs font-semibold text-black sm:text-[13px]">
              {orderNumber}
            </p>
          </div>

          {/* Payment Method */}

          <div className="rounded-lg border border-[#E5E5E5] bg-white p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-wide text-[#7A7A7A] sm:text-[11px]">
              Payment Method
            </p>

            <p className="mt-2 text-xs font-semibold text-black sm:text-[13px]">
              {paymentMethodLabel}
            </p>
          </div>

          {/* Total */}

          <div className="rounded-lg border border-[#E5E5E5] bg-white p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-wide text-[#7A7A7A] sm:text-[11px]">
              Total Amount
            </p>

            <p className="mt-2 text-sm font-semibold text-[#DB4444] sm:text-[16px]">
              {formatPrice(total)}
            </p>
          </div>
        </div>

        {/* ==================================================
            ORDER STATUS
        ================================================== */}

        <div className="mt-4 rounded-lg border border-[#E5E5E5] bg-white p-4 sm:mt-6 sm:p-5 md:p-6">
          <h2 className="text-base font-semibold text-black sm:text-lg">
            Order Status
          </h2>

          <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4">
            {/* Payment Status */}

            <div className="rounded-md bg-[#F5F5F5] p-3.5 sm:p-4">
              <p className="text-[10px] uppercase tracking-wide text-[#7A7A7A] sm:text-[11px]">
                Payment Status
              </p>

              <p className="mt-2 text-xs font-medium text-black sm:text-[13px]">
                {paymentStatusLabel}
              </p>
            </div>

            {/* Order Status */}

            <div className="rounded-md bg-[#F5F5F5] p-3.5 sm:p-4">
              <p className="text-[10px] uppercase tracking-wide text-[#7A7A7A] sm:text-[11px]">
                Order Status
              </p>

              <p className="mt-2 text-xs font-medium text-black sm:text-[13px]">
                {orderStatusLabel}
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            SHIPPING & TRACKING
        ================================================== */}

        <div className="mt-4 rounded-lg border border-[#E5E5E5] bg-white p-4 sm:mt-6 sm:p-5 md:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start sm:gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <FiTruck size={18} className="text-[#DB4444] sm:hidden" />
                <FiTruck size={19} className="hidden text-[#DB4444] sm:block" />

                <h2 className="text-base font-semibold text-black sm:text-lg">
                  Shipping & Tracking
                </h2>
              </div>

              <p className="mt-2 text-xs leading-5 text-[#7A7A7A] sm:text-[13px] sm:leading-6">
                Track the current progress of your order.
              </p>
            </div>

            {shippingDetails?.estimatedDeliveryDate && (
              <div className="rounded-md bg-[#FFF5F5] px-3 py-2.5 sm:px-4 sm:py-3">
                <p className="text-[10px] uppercase tracking-wide text-[#7A7A7A] sm:text-[11px]">
                  Estimated Delivery
                </p>

                <p className="mt-1 text-xs font-semibold text-[#DB4444] sm:text-[13px]">
                  {formatDate(shippingDetails.estimatedDeliveryDate)}
                </p>
              </div>
            )}
          </div>

          {/* Shipping Details */}

          <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <div className="rounded-md bg-[#F5F5F5] p-3.5 sm:p-4">
              <p className="text-[10px] text-[#7A7A7A] sm:text-[11px]">
                Carrier
              </p>

              <p className="mt-1 text-xs font-semibold text-black sm:text-[13px]">
                {shippingDetails?.carrier || "Not assigned"}
              </p>
            </div>

            <div className="rounded-md bg-[#F5F5F5] p-3.5 sm:p-4">
              <p className="text-[10px] text-[#7A7A7A] sm:text-[11px]">
                Tracking Number
              </p>

              <p className="mt-1 break-all text-xs font-semibold text-black sm:text-[13px]">
                {shippingDetails?.trackingNumber || "Not available"}
              </p>
            </div>

            <div className="rounded-md bg-[#F5F5F5] p-3.5 sm:p-4">
              <p className="text-[10px] text-[#7A7A7A] sm:text-[11px]">
                Shipped
              </p>

              <p className="mt-1 text-xs font-semibold text-black sm:text-[13px]">
                {shippingDetails?.shippedAt
                  ? formatDate(shippingDetails.shippedAt)
                  : "Not shipped yet"}
              </p>
            </div>

            <div className="rounded-md bg-[#F5F5F5] p-3.5 sm:p-4">
              <p className="text-[10px] text-[#7A7A7A] sm:text-[11px]">
                Delivered
              </p>

              <p className="mt-1 text-xs font-semibold text-black sm:text-[13px]">
                {shippingDetails?.deliveredAt
                  ? formatDate(shippingDetails.deliveredAt)
                  : "Not delivered yet"}
              </p>
            </div>
          </div>

          {/* Tracking Link */}

          {shippingDetails?.trackingUrl && (
            <div className="mt-4 sm:mt-5">
              <a
                href={shippingDetails.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-[#DB4444] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-black sm:px-5 sm:py-2.5 sm:text-[13px]"
              >
                Track Shipment
                <FiExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Tracking Timeline */}

          <div className="mt-5 border-t border-[#E5E5E5] pt-5 sm:mt-6 sm:pt-6">
            <div className="flex items-center gap-2">
              <FiClock size={16} className="text-[#DB4444] sm:hidden" />
              <FiClock size={18} className="hidden text-[#DB4444] sm:block" />

              <h3 className="text-xs font-semibold text-black sm:text-sm">
                Tracking Timeline
              </h3>
            </div>

            {trackingEvents.length > 0 ? (
              <div className="mt-4 sm:mt-5">
                {trackingEvents.map((event, index) => {
                  const isLast = index === trackingEvents.length - 1;

                  return (
                    <div
                      key={
                        event.id ||
                        `${event.status}-${event.timestamp}-${index}`
                      }
                      className="relative flex gap-3 sm:gap-4"
                    >
                      {!isLast && (
                        <div className="absolute left-2.25 top-6 h-[calc(100%-4px)] w-px bg-[#E5E5E5]" />
                      )}

                      <div
                        className={`relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-white shadow-sm sm:h-5 sm:w-5 ${getTrackingDotClasses(
                          event.status,
                        )}`}
                      />

                      <div className="min-w-0 flex-1 pb-5 sm:pb-7">
                        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start sm:gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-semibold text-black sm:text-sm">
                                {event.title || formatStatus(event.status)}
                              </h4>

                              {isLast && (
                                <FiCheckCircle
                                  size={14}
                                  className="text-green-600 sm:hidden"
                                />
                              )}
                              {isLast && (
                                <FiCheckCircle
                                  size={15}
                                  className="hidden text-green-600 sm:block"
                                />
                              )}
                            </div>

                            {event.description && (
                              <p className="mt-1 text-xs leading-5 text-[#7A7A7A] sm:text-[13px] sm:leading-6">
                                {event.description}
                              </p>
                            )}

                            {event.location && (
                              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#7A7A7A] sm:text-xs">
                                <FiMapPin size={12} />

                                <span className="wrap-break-words">
                                  {event.location}
                                </span>
                              </div>
                            )}
                          </div>

                          <p className="shrink-0 text-[10px] text-[#999999] sm:text-xs">
                            {formatDateTime(event.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-md bg-[#FAFAFA] px-4 py-6 text-center sm:px-5 sm:py-7">
                <FiClock
                  size={22}
                  className="mx-auto text-[#999999] sm:hidden"
                />
                <FiClock
                  size={24}
                  className="mx-auto hidden text-[#999999] sm:block"
                />

                <p className="mt-3 text-xs font-medium text-black sm:text-sm">
                  Tracking updates are not available yet.
                </p>

                <p className="mt-1 text-[10px] leading-5 text-[#7A7A7A] sm:text-xs">
                  Shipment tracking will appear here once your order is updated.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================
            DELIVERY ADDRESS
        ================================================== */}

        <div className="mt-4 rounded-lg border border-[#E5E5E5] bg-white p-4 sm:mt-6 sm:p-5 md:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <FiMapPin size={18} className="text-[#DB4444] sm:hidden" />
            <FiMapPin size={19} className="hidden text-[#DB4444] sm:block" />

            <h2 className="text-base font-semibold text-black sm:text-lg">
              Delivery Address
            </h2>
          </div>

          <div className="mt-4 rounded-md bg-[#F5F5F5] p-3.5 sm:mt-5 sm:p-4">
            <p className="text-xs font-semibold text-black sm:text-[13px]">
              {deliveryAddress.fullName}
            </p>

            {deliveryAddress.addressLine1 && (
              <p className="mt-2 text-[11px] leading-5 text-[#7A7A7A] sm:text-[12px]">
                {deliveryAddress.addressLine1}

                {deliveryAddress.addressLine2
                  ? `, ${deliveryAddress.addressLine2}`
                  : ""}
              </p>
            )}

            {(deliveryAddress.city ||
              deliveryAddress.state ||
              deliveryAddress.postalCode) && (
              <p className="text-[11px] leading-5 text-[#7A7A7A] sm:text-[12px]">
                {deliveryAddress.city}

                {deliveryAddress.city && deliveryAddress.state ? ", " : ""}

                {deliveryAddress.state}

                {deliveryAddress.postalCode
                  ? ` - ${deliveryAddress.postalCode}`
                  : ""}
              </p>
            )}

            {deliveryAddress.country && (
              <p className="text-[11px] leading-5 text-[#7A7A7A] sm:text-[12px]">
                {deliveryAddress.country}
              </p>
            )}

            {deliveryAddress.phone && (
              <p className="mt-2 text-[11px] text-[#7A7A7A] sm:text-[12px]">
                {deliveryAddress.phone}
              </p>
            )}
          </div>
        </div>

        {/* ==================================================
            PRICE BREAKDOWN
        ================================================== */}

        <div className="mt-4 rounded-lg border border-[#E5E5E5] bg-white p-4 sm:mt-6 sm:p-5 md:p-6">
          <h2 className="text-base font-semibold text-black sm:text-lg">
            Order Summary
          </h2>

          <div className="mt-4 space-y-3.5 sm:mt-5 sm:space-y-4">
            {/* Subtotal */}

            <div className="flex items-center justify-between text-xs sm:text-[13px]">
              <span className="text-[#7A7A7A]">Subtotal</span>

              <span className="font-medium text-black">
                {formatPrice(subtotal)}
              </span>
            </div>

            {/* Discount */}

            {discount > 0 && (
              <div className="flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-[#7A7A7A]">Discount</span>

                <span className="font-medium text-green-600">
                  -{formatPrice(discount)}
                </span>
              </div>
            )}

            {/* Coupon */}

            {order?.couponCode && (
              <div className="flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-[#7A7A7A]">Coupon</span>

                <span className="font-medium text-black">
                  {order.couponCode}
                </span>
              </div>
            )}

            {/* Shipping */}

            <div className="flex items-center justify-between text-xs sm:text-[13px]">
              <span className="text-[#7A7A7A]">Shipping</span>

              <span className="text-[#7A7A7A]">
                {shipping === 0 ? "Free" : formatPrice(shipping)}
              </span>
            </div>

            {/* Total */}

            <div className="border-t border-[#E5E5E5] pt-3.5 sm:pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-black sm:text-[15px]">
                  Total
                </span>

                <span className="text-lg font-semibold text-[#DB4444] sm:text-xl">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            COD INFORMATION
        ================================================== */}

        {paymentMethod === "cod" && (
          <div className="mt-4 rounded-lg bg-[#FFF5F5] px-4 py-3.5 sm:mt-6 sm:px-5 sm:py-4 md:px-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <FiCheck
                size={16}
                className="mt-0.5 shrink-0 text-[#DB4444] sm:hidden"
              />
              <FiCheck
                size={18}
                className="mt-0.5 hidden shrink-0 text-[#DB4444] sm:block"
              />

              <p className="text-[11px] leading-5 text-[#7A7A7A] sm:text-[12px]">
                Your order has been placed with Cash on Delivery. Please keep
                the total amount ready when your order is delivered.
              </p>
            </div>
          </div>
        )}

        {/* ==================================================
            ACTION BUTTONS
        ================================================== */}

        <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:justify-center sm:gap-3">
          <Link
            href="/shop"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-black sm:w-auto sm:px-7 sm:py-3 sm:text-[13px]"
          >
            Continue Shopping
            <FiArrowRight size={14} />
          </Link>

          <Link
            href="/account/orders"
            className="inline-flex w-full items-center justify-center rounded-md border border-[#E5E5E5] bg-white px-5 py-2.5 text-xs font-medium text-black transition-colors hover:border-[#DB4444] hover:text-[#DB4444] sm:w-auto sm:px-7 sm:py-3 sm:text-[13px]"
          >
            View My Orders
          </Link>
        </div>
      </div>
    </section>
  );
};

export default OrderSuccess;
