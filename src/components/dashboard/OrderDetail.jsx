// FILE LOCATION: src/components/dashboard/OrderDetail.jsx

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  FiArrowLeft,
  FiPackage,
  FiTruck,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiPrinter,
  FiDownload,
  FiCreditCard,
  FiShoppingBag,
  FiLoader,
} from "react-icons/fi";

// ============================================================
// CONSTANTS
// ============================================================

const CANCELLABLE_STATUSES = ["pending", "confirmed", "processing"];

// ============================================================
// HELPERS
// ============================================================

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);

const formatDate = (date) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-IN", {
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

// ============================================================
// COMPONENT
// ============================================================

const OrderDetail = ({ orderId }) => {
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // PDF download state
  const [downloading, setDownloading] = useState(false);

  // Reference to the DOM node captured for the PDF
  const invoiceRef = useRef(null);

  // ==========================================================
  // FETCH ORDER
  // ==========================================================

  useEffect(() => {
    if (!orderId) return;

    const controller = new AbortController();

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/orders/${orderId}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch order.");
        }

        if (!data?.order) {
          throw new Error("Order data was not found.");
        }

        setOrder(data.order);
      } catch (err) {
        if (err?.name === "AbortError") return;

        console.error("Fetch order error:", err);

        setError(
          err?.message || "Something went wrong while loading the order.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => controller.abort();
  }, [orderId]);

  // ==========================================================
  // CANCEL ORDER
  // ==========================================================

  const handleCancelOrder = async () => {
    if (!order || cancelling) return;

    try {
      setCancelling(true);
      setCancelError("");

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          cancellationReason: cancellationReason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to cancel your order.");
      }

      setOrder(data.order);
      setCancelOpen(false);
      setCancellationReason("");
      setCancelError("");
    } catch (err) {
      console.error("Cancel order error:", err);
      setCancelError(
        err?.message || "Something went wrong while cancelling the order.",
      );
    } finally {
      setCancelling(false);
    }
  };

  // ==========================================================
  // PRINT INVOICE
  // ==========================================================

  const handlePrint = () => {
    window.print();
  };

  // ==========================================================
  // DOWNLOAD PDF INVOICE
  // ==========================================================

  const handleDownloadPDF = async () => {
    if (!order || downloading) return;

    const element = invoiceRef.current;

    if (!element) {
      alert("Invoice content is not ready. Please try again.");
      return;
    }

    try {
      setDownloading(true);

      // Lazy-load libraries only when the user clicks Download.
      // Keeps the initial page bundle small.
      //
      // NOTE: We use `html2canvas-pro` (not `html2canvas`) because
      // the original html2canvas does not support modern CSS color
      // functions like `lab()` and `oklch()`, which Tailwind CSS v4
      // emits for its default color palette.
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas-pro"),
      ]);

      // Small delay so any layout shift settles before capture
      await new Promise((resolve) => setTimeout(resolve, 60));

      const canvas = await html2canvas(element, {
        scale: 2, // 2x resolution for crisp text
        useCORS: true, // allow Cloudinary images
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // 5 mm margins on all sides
      const margin = 5;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      // Scale canvas to fit usable width
      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Slice tall image across multiple pages if needed
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
        heightLeft -= usableHeight;
      }

      const safeOrderNumber = String(order.orderNumber || "order").replace(
        /[^\w-]/g,
        "",
      );

      pdf.save(`Invoice-${safeOrderNumber}.pdf`);
    } catch (err) {
      console.error("Download invoice error:", err);
      alert(
        "Failed to generate the invoice PDF. Please try the Print option instead.",
      );
    } finally {
      setDownloading(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

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

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error || !order) {
    return (
      <section className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center sm:p-6">
            <FiAlertCircle className="mx-auto h-8 w-8 text-red-600 sm:h-10 sm:w-10" />

            <h2 className="mt-3 text-base font-semibold text-red-600 sm:text-lg">
              Unable to load order
            </h2>

            <p className="mt-2 text-xs leading-5 text-[#7A7A7A] sm:text-sm sm:leading-6">
              {error || "Order not found."}
            </p>

            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push("/account/orders")}
                className="w-full rounded-md border border-[#E5E5E5] bg-white px-5 py-2.5 text-xs font-medium text-black transition hover:border-[#DB4444] hover:text-[#DB4444] sm:w-auto sm:text-sm"
              >
                Back to Orders
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full rounded-md bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[#C83D3D] sm:w-auto sm:text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================
  // DATA PREP
  // ==========================================================

  const isCancellable =
    CANCELLABLE_STATUSES.includes(order.orderStatus) &&
    order.paymentStatus !== "paid";

  const trackingEvents = Array.isArray(order.trackingEvents)
    ? order.trackingEvents
    : [];

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <section className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        {/* BREADCRUMB */}

        <button
          type="button"
          onClick={() => router.push("/account/orders")}
          className="no-print mb-5 inline-flex items-center gap-2 text-xs text-[#7A7A7A] transition hover:text-[#DB4444] sm:mb-6 sm:text-sm"
        >
          <FiArrowLeft size={16} />
          Back to My Orders
        </button>

        {/* ACTION BUTTONS */}

        <div className="no-print mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-xs font-medium text-black transition hover:border-[#DB4444] hover:text-[#DB4444] sm:px-5 sm:text-sm"
          >
            <FiPrinter size={15} />
            Print
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#DB4444] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#C83D3D] disabled:cursor-not-allowed disabled:opacity-70 sm:px-5 sm:text-sm"
          >
            {downloading ? (
              <>
                <FiLoader size={15} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FiDownload size={15} />
                Download PDF
              </>
            )}
          </button>

          {order.shippingDetails?.trackingUrl && (
            <a
              href={order.shippingDetails.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-xs font-medium text-black transition hover:border-[#DB4444] hover:text-[#DB4444] sm:px-5 sm:text-sm"
            >
              <FiTruck size={15} />
              Track
            </a>
          )}
        </div>

        {/* INVOICE CAPTURE AREA */}

        <div
          ref={invoiceRef}
          className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5 lg:p-6"
        >
          {/* INVOICE HEADER */}

          <div className="mb-6 border-b border-[#E5E5E5] pb-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#DB4444] sm:text-3xl">
                  Exclusive
                </h1>

                <p className="mt-1 text-xs text-[#7A7A7A] sm:text-sm">
                  Tax Invoice / Order Receipt
                </p>
              </div>

              <div className="text-left text-xs text-[#7A7A7A] sm:text-right sm:text-sm">
                <p>
                  Invoice Date:{" "}
                  <strong className="text-black">
                    {formatDate(order.createdAt)}
                  </strong>
                </p>
                <p className="mt-1">
                  Order No.:{" "}
                  <strong className="text-black">{order.orderNumber}</strong>
                </p>
                <p className="mt-1">
                  Status:{" "}
                  <strong className="text-black">
                    {formatStatus(order.orderStatus)}
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {/* MAIN GRID */}

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {/* LEFT */}

            <div className="space-y-4 sm:space-y-5 lg:col-span-2 lg:space-y-6">
              {/* TRACKING */}

              <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <FiTruck size={18} className="text-[#DB4444] sm:hidden" />
                  <FiTruck
                    size={19}
                    className="hidden text-[#DB4444] sm:block"
                  />

                  <h2 className="text-sm font-semibold text-black sm:text-base">
                    Order Tracking
                  </h2>
                </div>

                <p className="mt-1 text-xs text-[#7A7A7A] sm:text-sm">
                  Follow your order&apos;s journey from confirmation to
                  delivery.
                </p>

                {trackingEvents.length > 0 ? (
                  <div className="mt-5 sm:mt-6">
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
                                  <h3 className="text-xs font-semibold text-black sm:text-sm">
                                    {event.title || formatStatus(event.status)}
                                  </h3>

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

                    <p className="mt-3 text-xs font-medium text-black sm:text-sm">
                      Tracking updates are not available yet.
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-[#7A7A7A] sm:text-xs">
                      Shipment tracking will appear here once your order is
                      updated.
                    </p>
                  </div>
                )}
              </div>

              {/* ORDER ITEMS */}

              <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <FiPackage size={18} className="text-[#DB4444] sm:hidden" />
                  <FiPackage
                    size={19}
                    className="hidden text-[#DB4444] sm:block"
                  />

                  <h2 className="text-sm font-semibold text-black sm:text-base">
                    Order Items ({order.items?.length || 0})
                  </h2>
                </div>

                <div className="mt-4 space-y-4 sm:mt-5">
                  {order.items?.length > 0 ? (
                    order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 border-b border-[#E5E5E5] pb-4 last:border-b-0 last:pb-0 sm:gap-4"
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
                          <h3 className="line-clamp-2 text-xs font-medium text-black sm:text-sm">
                            {item.productName}
                          </h3>

                          <p className="mt-1 text-xs text-[#7A7A7A] sm:text-sm">
                            {formatPrice(item.price)} × {item.quantity}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-black sm:text-sm">
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

              {/* SHIPPING ADDRESS */}

              {order.shippingAddress && (
                <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <FiMapPin size={18} className="text-[#DB4444] sm:hidden" />
                    <FiMapPin
                      size={19}
                      className="hidden text-[#DB4444] sm:block"
                    />

                    <h2 className="text-sm font-semibold text-black sm:text-base">
                      Delivery Address
                    </h2>
                  </div>

                  <div className="mt-3 text-xs leading-5 text-[#7A7A7A] sm:mt-4 sm:text-sm sm:leading-6">
                    <p className="font-medium text-black">
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
                    <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT */}

            <div className="space-y-4 sm:space-y-5 lg:space-y-6">
              {/* PRICE SUMMARY */}

              <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <FiCreditCard
                    size={18}
                    className="text-[#DB4444] sm:hidden"
                  />
                  <FiCreditCard
                    size={19}
                    className="hidden text-[#DB4444] sm:block"
                  />

                  <h2 className="text-sm font-semibold text-black sm:text-base">
                    Price Details
                  </h2>
                </div>

                <div className="mt-4 space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#7A7A7A]">Subtotal</span>
                    <span className="font-medium text-black">
                      {formatPrice(order.subtotal)}
                    </span>
                  </div>

                  {order.discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#7A7A7A]">Discount</span>
                      <span className="font-medium text-green-600">
                        − {formatPrice(order.discount)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[#7A7A7A]">Shipping</span>
                    <span className="font-medium text-black">
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
                      <span className="font-semibold text-black">Total</span>
                      <span className="text-base font-semibold text-[#DB4444] sm:text-lg">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PAYMENT INFO */}

              <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <FiShoppingBag
                    size={18}
                    className="text-[#DB4444] sm:hidden"
                  />
                  <FiShoppingBag
                    size={19}
                    className="hidden text-[#DB4444] sm:block"
                  />

                  <h2 className="text-sm font-semibold text-black sm:text-base">
                    Payment
                  </h2>
                </div>

                <div className="mt-4 space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#7A7A7A]">Method</span>
                    <span className="font-medium text-black">
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
                      <span className="text-[#7A7A7A]">Paid On</span>
                      <span className="font-medium text-black">
                        {formatDate(order.paidAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* SHIPPING DETAILS */}

              {order.shippingDetails?.carrier ||
              order.shippingDetails?.trackingNumber ||
              order.shippingDetails?.estimatedDeliveryDate ? (
                <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <FiTruck size={18} className="text-[#DB4444] sm:hidden" />
                    <FiTruck
                      size={19}
                      className="hidden text-[#DB4444] sm:block"
                    />

                    <h2 className="text-sm font-semibold text-black sm:text-base">
                      Shipping
                    </h2>
                  </div>

                  <div className="mt-4 space-y-3 text-xs sm:text-sm">
                    {order.shippingDetails?.carrier && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[#7A7A7A]">Carrier</span>
                        <span className="text-right font-medium text-black">
                          {order.shippingDetails.carrier}
                        </span>
                      </div>
                    )}

                    {order.shippingDetails?.trackingNumber && (
                      <div className="flex items-start justify-between gap-3">
                        <span className="shrink-0 text-[#7A7A7A]">
                          Tracking No.
                        </span>
                        <span className="break-all text-right font-medium text-black">
                          {order.shippingDetails.trackingNumber}
                        </span>
                      </div>
                    )}

                    {order.shippingDetails?.estimatedDeliveryDate && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[#7A7A7A]">Est. Delivery</span>
                        <span className="text-right font-medium text-[#DB4444]">
                          {formatDate(
                            order.shippingDetails.estimatedDeliveryDate,
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* CANCEL ORDER (excluded from PDF) */}

              {isCancellable && (
                <div className="no-print rounded-xl border border-red-200 bg-white p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                    <div>
                      <h2 className="text-sm font-semibold text-black sm:text-base">
                        Cancel Order
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-[#7A7A7A] sm:text-sm sm:leading-6">
                        You can cancel this order before it is shipped.
                      </p>
                    </div>
                  </div>

                  {!cancelOpen ? (
                    <button
                      type="button"
                      onClick={() => setCancelOpen(true)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600 transition hover:bg-red-100 sm:text-sm"
                    >
                      <FiXCircle size={15} />
                      Cancel Order
                    </button>
                  ) : (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-xs font-semibold text-red-600 sm:text-sm">
                        Are you sure you want to cancel this order?
                      </p>

                      <div className="mt-3">
                        <label
                          htmlFor="cancellation-reason"
                          className="mb-2 block text-xs font-medium text-black sm:text-sm"
                        >
                          Reason{" "}
                          <span className="font-normal text-[#7A7A7A]">
                            (optional)
                          </span>
                        </label>

                        <textarea
                          id="cancellation-reason"
                          value={cancellationReason}
                          onChange={(e) => {
                            setCancellationReason(e.target.value);
                            setCancelError("");
                          }}
                          maxLength={300}
                          rows={3}
                          placeholder="Tell us why you want to cancel this order"
                          className="w-full resize-none rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-xs text-black outline-none transition focus:border-[#DB4444] sm:px-4 sm:py-3 sm:text-sm"
                        />

                        <div className="mt-1 flex justify-end">
                          <span className="text-[10px] text-[#999999] sm:text-xs">
                            {cancellationReason.length}/300
                          </span>
                        </div>
                      </div>

                      {cancelError && (
                        <div className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
                          <p className="text-xs leading-5 text-red-600 sm:text-sm sm:leading-6">
                            {cancelError}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCancelOpen(false);
                            setCancellationReason("");
                            setCancelError("");
                          }}
                          disabled={cancelling}
                          className="w-full rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-xs font-medium text-black transition hover:border-[#DB4444] hover:text-[#DB4444] disabled:opacity-50 sm:w-auto sm:text-sm"
                        >
                          Keep Order
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelOrder}
                          disabled={cancelling}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#DB4444] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#C83D3D] disabled:opacity-60 sm:w-auto sm:text-sm"
                        >
                          {cancelling ? (
                            <>
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
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

              {/* CANCELLATION INFO (excluded from PDF) */}

              {order.orderStatus === "cancelled" &&
                order.cancellationReason && (
                  <div className="no-print rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <FiXCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                      <div>
                        <h2 className="text-sm font-semibold text-red-600 sm:text-base">
                          Order Cancelled
                        </h2>

                        <p className="mt-2 text-xs leading-5 text-red-600 sm:text-sm sm:leading-6">
                          {order.cancellationReason}
                        </p>

                        {order.cancelledAt && (
                          <p className="mt-2 text-[10px] text-red-500 sm:text-xs">
                            Cancelled on {formatDateTime(order.cancelledAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* INVOICE FOOTER */}

          <div className="mt-6 border-t border-[#E5E5E5] pt-5">
            <p className="text-center text-[10px] text-[#7A7A7A] sm:text-xs">
              This is a computer-generated invoice. For queries, contact{" "}
              <strong className="text-black">support@exclusive.test</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderDetail;
