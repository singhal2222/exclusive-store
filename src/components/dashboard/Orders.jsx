// FILE LOCATION: src/components/dashboard/Orders.jsx

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  FiPackage,
  FiChevronDown,
  FiChevronUp,
  FiShoppingBag,
  FiTruck,
  FiMapPin,
  FiClock,
  FiExternalLink,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
} from "react-icons/fi";

const ORDERS_PER_PAGE = 10;

const EMPTY_PAGINATION = {
  page: 1,
  limit: ORDERS_PER_PAGE,
  total: 0,
  totalPages: 0,
};

const CANCELLABLE_STATUSES = ["pending", "confirmed", "processing"];

const Orders = ({ user }) => {
  const [orders, setOrders] = useState([]);

  const [pagination, setPagination] = useState(EMPTY_PAGINATION);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [expandedOrder, setExpandedOrder] = useState(null);

  const [cancelOrderId, setCancelOrderId] = useState(null);

  const [cancellationReason, setCancellationReason] = useState("");

  const [cancelError, setCancelError] = useState("");

  const [cancelling, setCancelling] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  // ============================================================
  // FETCH ORDERS
  // ============================================================

  useEffect(() => {
    const controller = new AbortController();

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/orders/my-orders?page=${pagination.page}&limit=${ORDERS_PER_PAGE}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch your orders.");
        }

        setOrders(Array.isArray(data?.orders) ? data.orders : []);

        setPagination(
          data?.pagination || {
            ...EMPTY_PAGINATION,
            page: pagination.page,
          },
        );
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("Fetch orders error:", error);

        setError(
          error?.message || "Something went wrong while loading your orders.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      controller.abort();
    };
  }, [pagination.page, refreshKey]);

  // ============================================================
  // HELPERS
  // ============================================================

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(price) || 0);
  };

  const formatDate = (date) => {
    if (!date) return "-";

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

  const formatDateTime = (date) => {
    if (!date) return "-";

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

  const formatStatus = (status) => {
    if (!status) return "-";

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatPaymentMethod = (method) => {
    switch (method) {
      case "cod":
        return "Cash on Delivery";

      case "razorpay":
        return "Online Payment";

      default:
        return formatStatus(method);
    }
  };

  const getOrderStatusClasses = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-50 text-blue-600";

      case "processing":
        return "bg-yellow-50 text-yellow-700";

      case "shipped":
        return "bg-purple-50 text-purple-600";

      case "out_for_delivery":
        return "bg-orange-50 text-orange-600";

      case "delivered":
        return "bg-green-50 text-green-600";

      case "cancelled":
        return "bg-red-50 text-red-600";

      case "pending":
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getPaymentStatusClasses = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-50 text-green-600";

      case "failed":
        return "bg-red-50 text-red-600";

      case "refunded":
        return "bg-purple-50 text-purple-600";

      case "pending":
      default:
        return "bg-yellow-50 text-yellow-700";
    }
  };

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

  const canCancelOrder = (order) => {
    if (!order) return false;

    return (
      CANCELLABLE_STATUSES.includes(order.orderStatus) &&
      order.paymentStatus !== "paid"
    );
  };

  // ============================================================
  // TOGGLE ORDER
  // ============================================================

  const toggleOrder = (orderId) => {
    setExpandedOrder((currentOrderId) =>
      currentOrderId === orderId ? null : orderId,
    );
  };

  // ============================================================
  // OPEN CANCEL CONFIRMATION
  // ============================================================

  const openCancelConfirmation = (orderId) => {
    setCancelOrderId(orderId);
    setCancellationReason("");
    setCancelError("");
  };

  // ============================================================
  // CLOSE CANCEL CONFIRMATION
  // ============================================================

  const closeCancelConfirmation = () => {
    if (cancelling) return;

    setCancelOrderId(null);
    setCancellationReason("");
    setCancelError("");
  };

  // ============================================================
  // CANCEL ORDER
  // ============================================================

  const handleCancelOrder = async (orderId) => {
    if (!orderId || cancelling) {
      return;
    }

    try {
      setCancelling(true);
      setCancelError("");

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "cancel",
          cancellationReason: cancellationReason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to cancel your order.");
      }

      if (!data?.order) {
        throw new Error(
          "Order was cancelled, but updated order details were not returned.",
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId ? data.order : order,
        ),
      );

      setCancelOrderId(null);
      setCancellationReason("");
      setCancelError("");

      setExpandedOrder(orderId);
    } catch (error) {
      console.error("Cancel order error:", error);

      setCancelError(
        error?.message || "Something went wrong while cancelling the order.",
      );
    } finally {
      setCancelling(false);
    }
  };

  // ============================================================
  // PAGINATION
  // ============================================================

  const goToPreviousPage = () => {
    setPagination((current) => ({
      ...current,
      page: Math.max(current.page - 1, 1),
    }));

    setExpandedOrder(null);
    setCancelOrderId(null);
  };

  const goToNextPage = () => {
    setPagination((current) => ({
      ...current,
      page: Math.min(current.page + 1, current.totalPages),
    }));

    setExpandedOrder(null);
    setCancelOrderId(null);
  };

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {
    return (
      <section className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <div className="animate-pulse">
            <div className="mb-2 h-7 w-40 rounded bg-gray-200 sm:h-8 sm:w-48" />

            <div className="mb-6 h-4 w-56 rounded bg-gray-200 sm:mb-8 sm:w-72" />

            <div className="space-y-4 sm:space-y-5">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5 md:p-6"
                >
                  <div className="h-5 w-36 rounded bg-gray-200 sm:w-44" />

                  <div className="mt-4 h-4 w-48 rounded bg-gray-200 sm:w-60" />

                  <div className="mt-5 h-10 w-full rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================

  if (error) {
    return (
      <section className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center sm:p-6">
            <h2 className="text-base font-semibold text-red-600 sm:text-lg">
              Unable to load orders
            </h2>

            <p className="mt-2 text-xs leading-5 text-[#7A7A7A] sm:text-sm sm:leading-6">
              {error}
            </p>

            <button
              type="button"
              onClick={() => {
                setRefreshKey((current) => current + 1);
              }}
              className="mt-5 rounded-md bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[#C83D3D] sm:text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // EMPTY STATE
  // ============================================================

  if (orders.length === 0) {
    return (
      <section className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl font-semibold text-[#000000] sm:text-2xl md:text-3xl">
              My Orders
            </h1>

            <p className="mt-2 text-xs text-[#7A7A7A] sm:text-sm">
              Welcome back, {user?.name || "Customer"}.
            </p>
          </div>

          <div className="rounded-xl border border-[#E5E5E5] bg-white px-5 py-10 text-center sm:px-6 sm:py-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF5F5] sm:h-16 sm:w-16">
              <FiShoppingBag size={24} className="text-[#DB4444] sm:hidden" />
              <FiShoppingBag
                size={28}
                className="hidden text-[#DB4444] sm:block"
              />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-[#000000] sm:text-xl">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#7A7A7A] sm:text-sm sm:leading-6">
              You have not placed any orders yet. Start shopping and your orders
              will appear here.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex items-center justify-center rounded-md bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[#C83D3D] sm:px-6 sm:py-3 sm:text-sm"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // ORDERS
  // ============================================================

  return (
    <section className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl font-semibold text-[#000000] sm:text-2xl md:text-3xl">
            My Orders
          </h1>

          <p className="mt-2 text-xs text-[#7A7A7A] sm:text-sm">
            Hello {user?.name || "Customer"}, here are your recent orders.
          </p>
        </div>

        {/* ======================================================
            ORDER COUNT
        ====================================================== */}

        <div className="mb-4 flex items-center gap-2 text-xs text-[#7A7A7A] sm:mb-6 sm:gap-3 sm:text-sm">
          <FiPackage size={16} className="sm:hidden" />
          <FiPackage size={18} className="hidden sm:block" />

          <span>
            {pagination.total} {pagination.total === 1 ? "order" : "orders"}
          </span>
        </div>

        {/* ======================================================
            ORDER LIST
        ====================================================== */}

        <div className="space-y-4 sm:space-y-5">
          {orders.map((order) => {
            const isExpanded = expandedOrder === order.id;

            const isCancelOpen = cancelOrderId === order.id;

            const orderCanBeCancelled = canCancelOrder(order);

            const trackingEvents = Array.isArray(order.trackingEvents)
              ? [...order.trackingEvents].sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime(),
                )
              : [];

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white"
              >
                {/* ==================================================
                    ORDER HEADER
                ================================================== */}

                <div className="p-4 sm:p-5 md:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* LEFT */}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h2 className="text-sm font-semibold text-[#000000] sm:text-base">
                          {order.orderNumber}
                        </h2>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium sm:px-3 sm:py-1 sm:text-xs ${getOrderStatusClasses(
                            order.orderStatus,
                          )}`}
                        >
                          {formatStatus(order.orderStatus)}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-[#7A7A7A] sm:text-sm">
                        Ordered on {formatDate(order.createdAt)}
                      </p>
                    </div>

                    {/* RIGHT */}

                    <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                      <div>
                        <p className="text-[10px] text-[#7A7A7A] sm:text-xs">
                          Total
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#000000] sm:text-base">
                          {formatPrice(order.total)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-[#7A7A7A] sm:text-xs">
                          Payment
                        </p>

                        <p className="mt-1 text-xs font-medium text-[#000000] sm:text-sm">
                          {formatPaymentMethod(order.paymentMethod)}
                        </p>
                      </div>

                      {/* View Details Link */}

                      <Link
                        href={`/account/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs font-medium text-[#000000] transition hover:border-[#DB4444] hover:text-[#DB4444] sm:px-4 sm:py-2.5 sm:text-sm"
                        aria-label={`View full details for order ${order.orderNumber}`}
                      >
                        View Details
                        <FiExternalLink size={13} />
                      </Link>

                      {/* Expand / Collapse */}

                      <button
                        type="button"
                        onClick={() => toggleOrder(order.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E5E5] text-[#000000] transition hover:border-[#DB4444] hover:text-[#DB4444] sm:h-10 sm:w-10"
                        aria-label={
                          isExpanded
                            ? "Hide order details"
                            : "Show order details"
                        }
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <FiChevronUp size={18} />
                        ) : (
                          <FiChevronDown size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ==================================================
                    EXPANDED DETAILS
                ================================================== */}

                {isExpanded && (
                  <div className="border-t border-[#E5E5E5] bg-[#F5F5F5] p-4 sm:p-5 md:p-6">
                    <div className="space-y-5 sm:space-y-6">
                      {/* ==================================================
                          TRACKING SUMMARY
                      ================================================== */}

                      <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <FiTruck
                                size={18}
                                className="text-[#DB4444] sm:hidden"
                              />
                              <FiTruck
                                size={19}
                                className="hidden text-[#DB4444] sm:block"
                              />

                              <h3 className="text-sm font-semibold text-[#000000] sm:text-base">
                                Shipping & Tracking
                              </h3>
                            </div>

                            <p className="mt-1 text-xs text-[#7A7A7A] sm:text-sm">
                              Track the current progress of your order.
                            </p>
                          </div>

                          {order.shippingDetails?.estimatedDeliveryDate && (
                            <div className="rounded-lg bg-[#FFF5F5] px-3 py-2 sm:px-4 sm:py-3">
                              <p className="text-[10px] text-[#7A7A7A] sm:text-xs">
                                Estimated Delivery
                              </p>

                              <p className="mt-1 text-xs font-semibold text-[#DB4444] sm:text-sm">
                                {formatDate(
                                  order.shippingDetails.estimatedDeliveryDate,
                                )}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* SHIPPING DETAILS */}

                        <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                          <div className="rounded-lg bg-[#F5F5F5] p-3 sm:p-4">
                            <p className="text-[10px] text-[#7A7A7A] sm:text-xs">
                              Carrier
                            </p>

                            <p className="mt-1 text-xs font-semibold text-[#000000] sm:text-sm">
                              {order.shippingDetails?.carrier || "Not assigned"}
                            </p>
                          </div>

                          <div className="rounded-lg bg-[#F5F5F5] p-3 sm:p-4">
                            <p className="text-[10px] text-[#7A7A7A] sm:text-xs">
                              Tracking Number
                            </p>

                            <p className="mt-1 break-all text-xs font-semibold text-[#000000] sm:text-sm">
                              {order.shippingDetails?.trackingNumber ||
                                "Not available"}
                            </p>
                          </div>

                          <div className="rounded-lg bg-[#F5F5F5] p-3 sm:p-4">
                            <p className="text-[10px] text-[#7A7A7A] sm:text-xs">
                              Shipped
                            </p>

                            <p className="mt-1 text-xs font-semibold text-[#000000] sm:text-sm">
                              {order.shippingDetails?.shippedAt
                                ? formatDate(order.shippingDetails.shippedAt)
                                : "Not shipped yet"}
                            </p>
                          </div>

                          <div className="rounded-lg bg-[#F5F5F5] p-3 sm:p-4">
                            <p className="text-[10px] text-[#7A7A7A] sm:text-xs">
                              Delivered
                            </p>

                            <p className="mt-1 text-xs font-semibold text-[#000000] sm:text-sm">
                              {order.shippingDetails?.deliveredAt
                                ? formatDate(order.shippingDetails.deliveredAt)
                                : "Not delivered yet"}
                            </p>
                          </div>
                        </div>

                        {/* TRACKING LINK */}

                        {order.shippingDetails?.trackingUrl && (
                          <div className="mt-4 sm:mt-5">
                            <a
                              href={order.shippingDetails.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-lg bg-[#DB4444] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#C83D3D] sm:px-5 sm:py-2.5 sm:text-sm"
                            >
                              Track Shipment
                              <FiExternalLink size={14} />
                            </a>
                          </div>
                        )}

                        {/* TRACKING TIMELINE */}

                        <div className="mt-5 border-t border-[#E5E5E5] pt-5 sm:mt-6 sm:pt-6">
                          <div className="flex items-center gap-2">
                            <FiClock
                              size={16}
                              className="text-[#DB4444] sm:hidden"
                            />
                            <FiClock
                              size={18}
                              className="hidden text-[#DB4444] sm:block"
                            />

                            <h4 className="text-xs font-semibold text-[#000000] sm:text-sm">
                              Tracking Timeline
                            </h4>
                          </div>

                          {trackingEvents.length > 0 ? (
                            <div className="mt-4 sm:mt-5">
                              {trackingEvents.map((event, index) => {
                                const isLast =
                                  index === trackingEvents.length - 1;

                                return (
                                  <div
                                    key={
                                      event.id ||
                                      `${event.status}-${event.timestamp}-${index}`
                                    }
                                    className="relative flex gap-3 sm:gap-4"
                                  >
                                    {/* LINE */}

                                    {!isLast && (
                                      <div className="absolute left-2.25 top-6 h-[calc(100%-4px)] w-px bg-[#E5E5E5]" />
                                    )}

                                    {/* DOT */}

                                    <div
                                      className={`relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-white shadow-sm sm:h-5 sm:w-5 ${getTrackingDotClasses(
                                        event.status,
                                      )}`}
                                    />

                                    {/* CONTENT */}

                                    <div className="min-w-0 flex-1 pb-5 sm:pb-7">
                                      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start sm:gap-2">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <h5 className="text-xs font-semibold text-[#000000] sm:text-sm">
                                              {event.title ||
                                                formatStatus(event.status)}
                                            </h5>

                                            {index ===
                                              trackingEvents.length - 1 && (
                                              <FiCheckCircle
                                                size={14}
                                                className="text-green-600 sm:hidden"
                                              />
                                            )}
                                            {index ===
                                              trackingEvents.length - 1 && (
                                              <FiCheckCircle
                                                size={15}
                                                className="hidden text-green-600 sm:block"
                                              />
                                            )}
                                          </div>

                                          {event.description && (
                                            <p className="mt-1 text-xs leading-5 text-[#7A7A7A] sm:text-sm sm:leading-6">
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
                            <div className="mt-4 rounded-lg bg-[#FAFAFA] px-4 py-6 text-center sm:px-5 sm:py-7">
                              <FiClock
                                size={22}
                                className="mx-auto text-[#999999] sm:hidden"
                              />
                              <FiClock
                                size={24}
                                className="mx-auto hidden text-[#999999] sm:block"
                              />

                              <p className="mt-3 text-xs font-medium text-[#000000] sm:text-sm">
                                Tracking updates are not available yet.
                              </p>

                              <p className="mt-1 text-[10px] leading-5 text-[#7A7A7A] sm:text-xs">
                                Shipment tracking will appear here once your
                                order is updated.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ==================================================
                          CANCEL ORDER
                      ================================================== */}

                      {orderCanBeCancelled && (
                        <div className="rounded-xl border border-red-200 bg-white p-4 sm:p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <FiAlertCircle
                                  size={16}
                                  className="text-[#DB4444] sm:hidden"
                                />
                                <FiAlertCircle
                                  size={18}
                                  className="hidden text-[#DB4444] sm:block"
                                />

                                <h3 className="text-sm font-semibold text-[#000000] sm:text-base">
                                  Cancel Order
                                </h3>
                              </div>

                              <p className="mt-1 text-xs leading-5 text-[#7A7A7A] sm:text-sm sm:leading-6">
                                You can cancel this order before it is shipped.
                              </p>
                            </div>

                            {!isCancelOpen && (
                              <button
                                type="button"
                                onClick={() => openCancelConfirmation(order.id)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 sm:w-auto sm:px-5 sm:py-2.5 sm:text-sm"
                              >
                                <FiXCircle size={15} />
                                Cancel Order
                              </button>
                            )}
                          </div>

                          {/* CANCEL CONFIRMATION */}

                          {isCancelOpen && (
                            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 sm:mt-5 sm:p-5">
                              <div className="flex items-start gap-2 sm:gap-3">
                                <FiAlertCircle
                                  size={18}
                                  className="mt-0.5 shrink-0 text-red-600 sm:hidden"
                                />
                                <FiAlertCircle
                                  size={20}
                                  className="mt-0.5 hidden shrink-0 text-red-600 sm:block"
                                />

                                <div>
                                  <h4 className="text-xs font-semibold text-red-600 sm:text-sm">
                                    Are you sure you want to cancel this order?
                                  </h4>

                                  <p className="mt-1 text-xs leading-5 text-red-600 sm:text-sm sm:leading-6">
                                    Your ordered items will be returned to
                                    available stock.
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 sm:mt-5">
                                <label
                                  htmlFor={`cancellation-${order.id}`}
                                  className="mb-2 block text-xs font-medium text-[#000000] sm:text-sm"
                                >
                                  Cancellation reason
                                  <span className="font-normal text-[#7A7A7A]">
                                    {" "}
                                    (optional)
                                  </span>
                                </label>

                                <textarea
                                  id={`cancellation-${order.id}`}
                                  value={cancellationReason}
                                  onChange={(event) => {
                                    setCancellationReason(event.target.value);
                                    setCancelError("");
                                  }}
                                  maxLength={300}
                                  rows={3}
                                  placeholder="Tell us why you want to cancel this order"
                                  className="w-full resize-none rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-xs text-[#000000] outline-none transition focus:border-[#DB4444] sm:px-4 sm:py-3 sm:text-sm"
                                />

                                <div className="mt-1 flex justify-end">
                                  <span className="text-[10px] text-[#999999] sm:text-xs">
                                    {cancellationReason.length}
                                    /300
                                  </span>
                                </div>
                              </div>

                              {cancelError && (
                                <div className="mt-4 rounded-lg border border-red-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
                                  <p className="text-xs leading-5 text-red-600 sm:text-sm sm:leading-6">
                                    {cancelError}
                                  </p>
                                </div>
                              )}

                              <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:justify-end sm:gap-3">
                                <button
                                  type="button"
                                  onClick={closeCancelConfirmation}
                                  disabled={cancelling}
                                  className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-xs font-medium text-[#000000] transition hover:border-[#DB4444] hover:text-[#DB4444] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5 sm:text-sm"
                                >
                                  Keep Order
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCancelOrder(order.id)}
                                  disabled={cancelling}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#DB4444] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#C83D3D] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5 sm:text-sm"
                                >
                                  {cancelling ? (
                                    <>
                                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-4 sm:w-4" />
                                      Cancelling...
                                    </>
                                  ) : (
                                    <>
                                      <FiXCircle size={15} />
                                      Yes, Cancel Order
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ==================================================
                          MAIN DETAILS GRID
                      ================================================== */}

                      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 lg:gap-6">
                        {/* ==================================================
                            ORDER ITEMS
                        ================================================== */}

                        <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
                          <h3 className="text-sm font-semibold text-[#000000] sm:text-base">
                            Order Items
                          </h3>

                          <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
                            {order.items?.length > 0 ? (
                              order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex gap-3 border-b border-[#E5E5E5] pb-3 last:border-b-0 last:pb-0 sm:gap-4 sm:pb-4"
                                >
                                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-20 sm:w-20">
                                    {item.productImage ? (
                                      <Image
                                        src={item.productImage}
                                        alt={item.productName || "Product"}
                                        fill
                                        sizes="80px"
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-[10px] text-[#7A7A7A] sm:text-xs">
                                        No Image
                                      </div>
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <h4 className="line-clamp-2 text-xs font-medium text-[#000000] sm:text-sm">
                                      {item.productName}
                                    </h4>

                                    <p className="mt-1 text-xs text-[#7A7A7A] sm:text-sm">
                                      {formatPrice(item.price)} ×{" "}
                                      {item.quantity}
                                    </p>

                                    <p className="mt-1 text-xs font-medium text-[#000000] sm:text-sm">
                                      {formatPrice(item.subtotal)}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-[#7A7A7A] sm:text-sm">
                                No items found for this order.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* ==================================================
                            ORDER INFORMATION
                        ================================================== */}

                        <div className="space-y-4 sm:space-y-6">
                          {/* PRICE DETAILS */}

                          <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
                            <h3 className="text-sm font-semibold text-[#000000] sm:text-base">
                              Price Details
                            </h3>

                            <div className="mt-3 space-y-3 text-xs sm:mt-4 sm:text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-[#7A7A7A]">Subtotal</span>

                                <span className="font-medium text-[#000000]">
                                  {formatPrice(order.subtotal)}
                                </span>
                              </div>

                              {order.discount > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-[#7A7A7A]">
                                    Discount
                                  </span>

                                  <span className="font-medium text-green-600">
                                    - {formatPrice(order.discount)}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <span className="text-[#7A7A7A]">Shipping</span>

                                <span className="font-medium text-[#000000]">
                                  {order.shipping > 0
                                    ? formatPrice(order.shipping)
                                    : "Free"}
                                </span>
                              </div>

                              {order.couponCode && (
                                <div className="flex items-center justify-between">
                                  <span className="text-[#7A7A7A]">Coupon</span>

                                  <span className="font-medium text-[#DB4444]">
                                    {order.couponCode}
                                  </span>
                                </div>
                              )}

                              <div className="border-t border-[#E5E5E5] pt-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-[#000000]">
                                    Total
                                  </span>

                                  <span className="text-base font-semibold text-[#DB4444] sm:text-lg">
                                    {formatPrice(order.total)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* PAYMENT INFORMATION */}

                          <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
                            <h3 className="text-sm font-semibold text-[#000000] sm:text-base">
                              Payment Information
                            </h3>

                            <div className="mt-3 space-y-3 text-xs sm:mt-4 sm:text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-[#7A7A7A]">Method</span>

                                <span className="font-medium text-[#000000]">
                                  {formatPaymentMethod(order.paymentMethod)}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-[#7A7A7A]">Status</span>

                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium sm:px-3 sm:py-1 sm:text-xs ${getPaymentStatusClasses(
                                    order.paymentStatus,
                                  )}`}
                                >
                                  {formatStatus(order.paymentStatus)}
                                </span>
                              </div>

                              {order.paidAt && (
                                <div className="flex items-center justify-between">
                                  <span className="text-[#7A7A7A]">
                                    Paid On
                                  </span>

                                  <span className="font-medium text-[#000000]">
                                    {formatDate(order.paidAt)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* DELIVERY ADDRESS */}

                          {order.shippingAddress && (
                            <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
                              <h3 className="text-sm font-semibold text-[#000000] sm:text-base">
                                Delivery Address
                              </h3>

                              <div className="mt-3 text-xs leading-5 text-[#7A7A7A] sm:mt-4 sm:text-sm sm:leading-6">
                                <p className="font-medium text-[#000000]">
                                  {order.shippingAddress.fullName}
                                </p>

                                <p>{order.shippingAddress.addressLine1}</p>

                                {order.shippingAddress.addressLine2 && (
                                  <p>{order.shippingAddress.addressLine2}</p>
                                )}

                                <p>
                                  {order.shippingAddress.city},{" "}
                                  {order.shippingAddress.state}
                                </p>

                                <p>
                                  {order.shippingAddress.postalCode},{" "}
                                  {order.shippingAddress.country}
                                </p>

                                <p className="mt-2">
                                  Phone: {order.shippingAddress.phone}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ==================================================
                          CANCELLATION INFORMATION
                      ================================================== */}

                      {order.orderStatus === "cancelled" &&
                        order.cancellationReason && (
                          <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <FiXCircle
                                size={18}
                                className="mt-0.5 shrink-0 text-red-600 sm:hidden"
                              />
                              <FiXCircle
                                size={20}
                                className="mt-0.5 hidden shrink-0 text-red-600 sm:block"
                              />

                              <div>
                                <h3 className="text-sm font-semibold text-red-600 sm:text-base">
                                  Order Cancelled
                                </h3>

                                <p className="mt-2 text-xs leading-5 text-red-600 sm:text-sm sm:leading-6">
                                  {order.cancellationReason}
                                </p>

                                {order.cancelledAt && (
                                  <p className="mt-2 text-[10px] text-red-500 sm:text-xs">
                                    Cancelled on{" "}
                                    {formatDateTime(order.cancelledAt)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ============================================================
            PAGINATION
        ============================================================ */}

        {pagination.totalPages > 1 && (
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row">
            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={pagination.page <= 1}
              className="w-full rounded-md border border-[#E5E5E5] px-4 py-2 text-xs font-medium text-[#000000] transition hover:border-[#DB4444] hover:text-[#DB4444] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#E5E5E5] disabled:hover:text-[#000000] sm:w-auto sm:text-sm"
            >
              Previous
            </button>

            <span className="order-first text-xs text-[#7A7A7A] sm:order-0 sm:text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              onClick={goToNextPage}
              disabled={pagination.page >= pagination.totalPages}
              className="w-full rounded-md border border-[#E5E5E5] px-4 py-2 text-xs font-medium text-[#000000] transition hover:border-[#DB4444] hover:text-[#DB4444] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#E5E5E5] disabled:hover:text-[#000000] sm:w-auto sm:text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Orders;
