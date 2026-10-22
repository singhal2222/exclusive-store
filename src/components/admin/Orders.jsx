"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  FiSearch,
  FiEye,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiX,
  FiPackage,
  FiMapPin,
  FiUser,
  FiCreditCard,
  FiTruck,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiMonitor,
  FiShoppingBag,
} from "react-icons/fi";

const ORDERS_PER_PAGE = 10;

const DEFAULT_UPDATE_FORM = {
  orderStatus: "pending",
  paymentStatus: "pending",
  carrier: "",
  trackingNumber: "",
  trackingUrl: "",
  estimatedDeliveryDate: "",
  trackingDescription: "",
  trackingLocation: "",
};

const Orders = () => {
  // ============================================================
  // ORDERS LIST
  // ============================================================

  const [orders, setOrders] = useState([]);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: ORDERS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // ORDER DETAILS
  // ============================================================

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  // ============================================================
  // ORDER UPDATE
  // ============================================================

  const [updateForm, setUpdateForm] = useState(DEFAULT_UPDATE_FORM);

  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  // ============================================================
  // REFRESH
  // ============================================================

  const [refreshKey, setRefreshKey] = useState(0);

  // ============================================================
  // STATUS OPTIONS
  // ============================================================

  const statusOptions = [
    { value: "All", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // ============================================================
  // PAYMENT OPTIONS
  // ============================================================

  const paymentOptions = [
    { value: "All", label: "All Payments" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
    { value: "failed", label: "Failed" },
    { value: "refunded", label: "Refunded" },
  ];

  // ============================================================
  // UPDATE STATUS OPTIONS
  // ============================================================

  const updateStatusOptions = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // ============================================================
  // UPDATE PAYMENT STATUS OPTIONS
  // ============================================================

  const updatePaymentOptions = [
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
    { value: "failed", label: "Failed" },
    { value: "refunded", label: "Refunded" },
  ];

  // ============================================================
  // SEARCH DEBOUNCE
  // ============================================================

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPagination((current) => ({
        ...current,
        page: 1,
      }));

      setSearchTerm(searchInput.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  // ============================================================
  // FETCH ADMIN ORDERS
  // ============================================================

  useEffect(() => {
    const controller = new AbortController();

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: ORDERS_PER_PAGE.toString(),
        });

        if (searchTerm) {
          params.set("search", searchTerm);
        }

        if (statusFilter !== "All") {
          params.set("status", statusFilter);
        }

        if (paymentFilter !== "All") {
          params.set("paymentStatus", paymentFilter);
        }

        const response = await fetch(`/api/admin/orders?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        let data = null;

        try {
          data = await response.json();
        } catch {
          throw new Error("Invalid response received from the server.");
        }

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch orders.");
        }

        setOrders(Array.isArray(data?.orders) ? data.orders : []);

        setPagination(
          data?.pagination || {
            page: 1,
            limit: ORDERS_PER_PAGE,
            total: 0,
            totalPages: 0,
          },
        );
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("Admin orders fetch error:", error);

        setError(
          error?.message || "Something went wrong while loading orders.",
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
  }, [pagination.page, searchTerm, statusFilter, paymentFilter, refreshKey]);

  // ============================================================
  // DATE INPUT FORMAT
  // ============================================================

  const formatDateInput = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const year = parsedDate.getFullYear();

    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");

    const day = String(parsedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // ============================================================
  // SYNC UPDATE FORM WITH SELECTED ORDER
  // ============================================================

  useEffect(() => {
    if (!selectedOrder) {
      return;
    }

    setUpdateForm({
      orderStatus: selectedOrder.orderStatus || "pending",

      paymentStatus: selectedOrder.paymentStatus || "pending",

      carrier: selectedOrder.shippingDetails?.carrier || "",

      trackingNumber: selectedOrder.shippingDetails?.trackingNumber || "",

      trackingUrl: selectedOrder.shippingDetails?.trackingUrl || "",

      estimatedDeliveryDate: formatDateInput(
        selectedOrder.shippingDetails?.estimatedDeliveryDate,
      ),

      trackingDescription: "",

      trackingLocation: selectedOrder.shippingAddress?.city || "",
    });

    setUpdateError("");
    setUpdateSuccess("");
  }, [selectedOrder]);

  // ============================================================
  // CLOSE ORDER DETAILS
  // ============================================================

  const closeOrderDetails = () => {
    setDetailsOpen(false);

    setSelectedOrder(null);
    setSelectedOrderId("");

    setDetailsError("");

    setUpdateError("");
    setUpdateSuccess("");

    setUpdateLoading(false);

    setUpdateForm({
      ...DEFAULT_UPDATE_FORM,
    });
  };

  // ============================================================
  // ESCAPE KEY + BODY SCROLL
  // ============================================================

  useEffect(() => {
    if (!detailsOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeOrderDetails();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);

      document.body.style.overflow = "";
    };
  }, [detailsOpen]);

  // ============================================================
  // FETCH SINGLE ORDER DETAILS
  // ============================================================

  const handleViewOrder = async (orderId) => {
    if (!orderId) {
      return;
    }

    try {
      setDetailsOpen(true);

      setSelectedOrderId(orderId);

      setDetailsLoading(true);
      setDetailsError("");

      setUpdateError("");
      setUpdateSuccess("");

      setSelectedOrder(null);

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid response received from the server.");
      }

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch order details.");
      }

      if (!data?.order) {
        throw new Error("Order details were not returned by the server.");
      }

      setSelectedOrder(data.order);
    } catch (error) {
      console.error("Order details fetch error:", error);

      setDetailsError(
        error?.message || "Something went wrong while loading order details.",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // ============================================================
  // RETRY ORDER DETAILS
  // ============================================================

  const handleRetryOrderDetails = () => {
    if (!selectedOrderId) {
      return;
    }

    handleViewOrder(selectedOrderId);
  };

  // ============================================================
  // UPDATE FORM HANDLER
  // ============================================================

  const handleUpdateFormChange = (event) => {
    const { name, value } = event.target;

    setUpdateForm((current) => ({
      ...current,
      [name]: value,
    }));

    setUpdateError("");
    setUpdateSuccess("");
  };

  // ============================================================
  // UPDATE ORDER
  // ============================================================

  const handleUpdateOrder = async (event) => {
    event.preventDefault();

    if (!selectedOrder?.id) {
      setUpdateError("Order information is unavailable.");
      return;
    }

    try {
      setUpdateLoading(true);

      setUpdateError("");
      setUpdateSuccess("");

      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderStatus: updateForm.orderStatus,

          paymentStatus: updateForm.paymentStatus,

          carrier: updateForm.carrier.trim(),

          trackingNumber: updateForm.trackingNumber.trim(),

          trackingUrl: updateForm.trackingUrl.trim(),

          estimatedDeliveryDate: updateForm.estimatedDeliveryDate || null,

          trackingDescription: updateForm.trackingDescription.trim(),

          trackingLocation: updateForm.trackingLocation.trim(),
        }),
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid response received from the server.");
      }

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update order.");
      }

      if (data?.order) {
        setSelectedOrder(data.order);
      }

      setUpdateSuccess(data?.message || "Order updated successfully.");

      setRefreshKey((current) => current + 1);
    } catch (error) {
      console.error("Update order error:", error);

      setUpdateError(
        error?.message || "Something went wrong while updating the order.",
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  // ============================================================
  // FORMAT PRICE
  // ============================================================

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
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
  // FORMAT DATE + TIME
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
      return "-";
    }

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // ============================================================
  // PAYMENT METHOD (POS aware)
  // ============================================================

  const formatPaymentMethod = (paymentMethod) => {
    switch (paymentMethod) {
      case "cod":
        return "Cash on Delivery";

      case "razorpay":
        return "Online Payment";

      case "cash":
        return "Cash (POS)";

      case "card":
        return "Card (POS)";

      case "upi":
        return "UPI (POS)";

      default:
        return formatStatus(paymentMethod);
    }
  };

  // ============================================================
  // POS HELPERS
  // ============================================================

  const isPosOrder = (order) => order?.source === "pos";

  const getCustomerTypeBadgeClasses = (customerType) => {
    switch (customerType) {
      case "wholesale":
        return "bg-amber-100 text-amber-700";
      case "retail":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPosCustomerLabel = (order) => {
    const meta = order?.posMetadata || {};

    const name = meta.customerName?.trim();
    const phone = meta.customerPhone?.trim();

    if (name || phone) {
      return {
        name: name || "POS Customer",
        phone: phone || "",
        email: "",
      };
    }

    return {
      name: "Walk-in Customer",
      phone: "",
      email: "",
    };
  };

  // ============================================================
  // ORDER STATUS COLORS
  // ============================================================

  const getOrderStatusClasses = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "confirmed":
        return "bg-blue-100 text-blue-700";

      case "processing":
        return "bg-indigo-100 text-indigo-700";

      case "shipped":
        return "bg-purple-100 text-purple-700";

      case "out_for_delivery":
        return "bg-orange-100 text-orange-700";

      case "delivered":
        return "bg-green-100 text-green-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ============================================================
  // TRACKING EVENT COLORS
  // ============================================================

  const getTrackingDotClasses = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-500";

      case "cancelled":
        return "bg-red-500";

      case "out_for_delivery":
        return "bg-orange-500";

      case "shipped":
        return "bg-purple-500";

      case "processing":
        return "bg-indigo-500";

      case "confirmed":
        return "bg-blue-500";

      default:
        return "bg-gray-400";
    }
  };

  // ============================================================
  // PAYMENT STATUS COLORS
  // ============================================================

  const getPaymentStatusClasses = (status) => {
    switch (status) {
      case "paid":
        return "text-green-600";

      case "failed":
        return "text-red-600";

      case "refunded":
        return "text-purple-600";

      case "pending":
        return "text-yellow-600";

      default:
        return "text-[#7A7A7A]";
    }
  };

  // ============================================================
  // RESET FILTERS
  // ============================================================

  const resetFilters = () => {
    setSearchInput("");
    setSearchTerm("");

    setStatusFilter("All");
    setPaymentFilter("All");

    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  // ============================================================
  // RETRY ORDERS LIST
  // ============================================================

  const handleRetry = () => {
    setRefreshKey((current) => current + 1);
  };

  // ============================================================
  // PAGINATION
  // ============================================================

  const goToPreviousPage = () => {
    if (pagination.page <= 1) {
      return;
    }

    setPagination((current) => ({
      ...current,
      page: current.page - 1,
    }));
  };

  const goToNextPage = () => {
    if (pagination.page >= pagination.totalPages) {
      return;
    }

    setPagination((current) => ({
      ...current,
      page: current.page + 1,
    }));
  };

  // ============================================================
  // FILTER HANDLERS
  // ============================================================

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);

    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const handlePaymentChange = (event) => {
    setPaymentFilter(event.target.value);

    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  // ============================================================
  // SORT TRACKING EVENTS
  // ============================================================

  const trackingEvents = [...(selectedOrder?.trackingEvents || [])].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <div className="font-poppins">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-5 flex flex-col justify-between gap-3 sm:mb-8 sm:gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="mb-1.5 text-2xl font-semibold tracking-[2%] text-black sm:mb-2 sm:text-3xl lg:text-[36px]">
              Orders
            </h1>

            <p className="text-xs text-[#7A7A7A] sm:text-sm md:text-[15px] lg:text-[16px]">
              Manage and track all customer orders ({pagination.total} total)
            </p>
          </div>
        </div>

        {/* ======================================================
            FILTERS
        ====================================================== */}

        <div className="mb-4 rounded-xl border border-[#E5E5E5] bg-white p-3.5 sm:mb-6 sm:p-5">
          <div className="flex flex-col gap-3 sm:gap-4 xl:flex-row">
            <div className="relative flex-1">
              <FiSearch
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7A7A] sm:hidden"
              />

              <FiSearch
                size={20}
                className="absolute left-4 top-1/2 hidden -translate-y-1/2 text-[#7A7A7A] sm:block"
              />

              <input
                type="text"
                placeholder="Search orders..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="w-full rounded-lg bg-[#F5F5F5] py-2.5 pl-10 pr-3 text-xs outline-none placeholder:text-[#7A7A7A] transition-all focus:ring-2 focus:ring-[#DB4444]/30 sm:py-3 sm:pl-12 sm:pr-4 sm:text-[14px] lg:text-[15px]"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:flex xl:items-center xl:gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-[#F5F5F5] px-3 py-2.5 sm:px-4 sm:py-3">
                <FiFilter
                  size={16}
                  className="shrink-0 text-[#7A7A7A] sm:hidden"
                />

                <FiFilter
                  size={18}
                  className="hidden shrink-0 text-[#7A7A7A] sm:block"
                />

                <select
                  value={statusFilter}
                  onChange={handleStatusChange}
                  className="w-full cursor-pointer bg-transparent text-xs outline-none sm:text-[14px] lg:text-[15px]"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-[#F5F5F5] px-3 py-2.5 sm:px-4 sm:py-3">
                <FiFilter
                  size={16}
                  className="shrink-0 text-[#7A7A7A] sm:hidden"
                />

                <FiFilter
                  size={18}
                  className="hidden shrink-0 text-[#7A7A7A] sm:block"
                />

                <select
                  value={paymentFilter}
                  onChange={handlePaymentChange}
                  className="w-full cursor-pointer bg-transparent text-xs outline-none sm:text-[14px] lg:text-[15px]"
                >
                  {paymentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {(searchInput ||
                statusFilter !== "All" ||
                paymentFilter !== "All") && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center justify-center gap-2 rounded-lg border border-[#E5E5E5] px-4 py-2.5 text-xs font-medium text-black transition hover:border-[#DB4444] hover:text-[#DB4444] sm:px-5 sm:py-3 sm:text-[14px] lg:text-[15px]"
                >
                  <FiRefreshCw size={15} className="sm:hidden" />
                  <FiRefreshCw size={16} className="hidden sm:block" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================
            ORDERS TABLE
        ====================================================== */}

        <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-250">
              <thead className="bg-[#F5F5F5]">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[13px] lg:text-[14px]">
                    Order ID
                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[13px] lg:text-[14px]">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[13px] lg:text-[14px]">
                    Items
                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[13px] lg:text-[14px]">
                    Amount
                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[13px] lg:text-[14px]">
                    Payment
                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[13px] lg:text-[14px]">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[13px] lg:text-[14px]">
                    Date
                  </th>

                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[13px] lg:text-[14px]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* LOADING */}

                {loading &&
                  [1, 2, 3, 4].map((item) => (
                    <tr key={item} className="border-b border-[#F5F5F5]">
                      <td colSpan="8" className="px-4 py-4 sm:px-6 sm:py-5">
                        <div className="animate-pulse">
                          <div className="flex items-center gap-3 sm:gap-6">
                            <div className="h-3.5 w-20 rounded bg-gray-200 sm:h-4 sm:w-28" />

                            <div className="h-3.5 w-24 rounded bg-gray-200 sm:h-4 sm:w-40" />

                            <div className="h-3.5 w-8 rounded bg-gray-200 sm:h-4 sm:w-10" />

                            <div className="h-3.5 w-16 rounded bg-gray-200 sm:h-4 sm:w-24" />

                            <div className="hidden h-4 w-28 rounded bg-gray-200 md:block" />

                            <div className="hidden h-6 w-20 rounded-full bg-gray-200 lg:block" />

                            <div className="hidden h-4 w-24 rounded bg-gray-200 lg:block" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}

                {/* ERROR */}

                {!loading && error && (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-12 text-center sm:px-6 sm:py-14"
                    >
                      <p className="text-sm font-medium text-red-600 sm:text-base">
                        Unable to load orders
                      </p>

                      <p className="mt-2 text-xs text-[#7A7A7A] sm:text-sm">
                        {error}
                      </p>

                      <button
                        type="button"
                        onClick={handleRetry}
                        className="mt-5 rounded-lg bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[#C83D3D] sm:text-sm"
                      >
                        Try Again
                      </button>
                    </td>
                  </tr>
                )}

                {/* EMPTY */}

                {!loading && !error && orders.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-12 text-center sm:px-6 sm:py-16"
                    >
                      <div className="mx-auto max-w-md">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF5F5] sm:h-14 sm:w-14">
                          <FiSearch
                            size={22}
                            className="text-[#DB4444] sm:hidden"
                          />

                          <FiSearch
                            size={24}
                            className="hidden text-[#DB4444] sm:block"
                          />
                        </div>

                        <h3 className="mt-4 text-base font-semibold text-black sm:text-lg">
                          No orders found
                        </h3>

                        <p className="mt-2 text-xs leading-5 text-[#7A7A7A] sm:text-sm sm:leading-6">
                          No orders match your current search or filters.
                        </p>

                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-5 rounded-lg border border-[#E5E5E5] px-5 py-2.5 text-xs font-medium text-black transition hover:border-[#DB4444] hover:text-[#DB4444] sm:text-sm"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* ORDERS */}

                {!loading &&
                  !error &&
                  orders.length > 0 &&
                  orders.map((order) => {
                    const pos = isPosOrder(order);
                    const posCustomer = pos ? getPosCustomerLabel(order) : null;

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-[#F5F5F5] transition-colors hover:bg-[#FAFAFA]"
                      >
                        <td className="px-4 py-3.5 text-xs font-medium text-black sm:px-6 sm:py-4 sm:text-[14px] lg:text-[15px]">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="whitespace-nowrap">
                              #{order.orderNumber}
                            </span>

                            {pos && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#DB4444]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#DB4444] sm:text-[10px]">
                                <FiShoppingBag size={9} />
                                POS
                              </span>
                            )}

                            {pos && order.customerType && (
                              <span
                                className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide sm:text-[10px] ${getCustomerTypeBadgeClasses(
                                  order.customerType,
                                )}`}
                              >
                                {order.customerType}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 sm:px-6 sm:py-4">
                          <div className="min-w-40">
                            <p className="text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                              {pos
                                ? posCustomer.name
                                : order.customer?.name || "Unknown Customer"}
                            </p>

                            {pos && posCustomer.phone && (
                              <p className="mt-0.5 text-[10px] text-[#999999] sm:text-[11px] lg:text-[12px]">
                                {posCustomer.phone}
                              </p>
                            )}

                            {!pos && order.customer?.email && (
                              <p className="mt-1 text-[11px] text-[#7A7A7A] sm:text-[12px] lg:text-[13px]">
                                {order.customer.email}
                              </p>
                            )}

                            {!pos && order.customer?.phone && (
                              <p className="mt-0.5 text-[10px] text-[#999999] sm:text-[11px] lg:text-[12px]">
                                {order.customer.phone}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-black sm:px-6 sm:py-4 sm:text-[14px] lg:text-[15px]">
                          {order.itemsCount}
                        </td>

                        <td className="px-4 py-3.5 text-xs font-semibold text-[#DB4444] sm:px-6 sm:py-4 sm:text-[14px] lg:text-[15px]">
                          {formatPrice(order.total)}
                        </td>

                        <td className="px-4 py-3.5 sm:px-6 sm:py-4">
                          <div className="min-w-25">
                            <p className="text-xs font-medium text-black sm:text-[13px] lg:text-[14px]">
                              {formatPaymentMethod(order.paymentMethod)}
                            </p>

                            <p
                              className={`mt-1 text-[11px] font-medium sm:text-[12px] lg:text-[13px] ${getPaymentStatusClasses(
                                order.paymentStatus,
                              )}`}
                            >
                              {formatStatus(order.paymentStatus)}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 sm:px-6 sm:py-4">
                          <span
                            className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-medium sm:px-2.5 sm:py-1.5 sm:text-[11px] lg:px-3 lg:text-[13px] ${getOrderStatusClasses(
                              order.orderStatus,
                            )}`}
                          >
                            {formatStatus(order.orderStatus)}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[14px] lg:text-[15px]">
                          <span className="whitespace-nowrap">
                            {formatDate(order.createdAt)}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 sm:px-6 sm:py-4">
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              title="View order details"
                              aria-label={`View details for ${order.orderNumber}`}
                              onClick={() => handleViewOrder(order.id)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 sm:h-10 sm:w-10"
                            >
                              <FiEye size={16} className="sm:hidden" />

                              <FiEye size={18} className="hidden sm:block" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* ====================================================
              FOOTER / PAGINATION
          ==================================================== */}

          {!loading && !error && (
            <div className="flex flex-col gap-3 border-t border-[#E5E5E5] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
              <p className="text-xs text-[#7A7A7A] sm:text-[13px] lg:text-[14px]">
                {pagination.total === 0
                  ? "Showing 0 orders"
                  : `Showing ${
                      (pagination.page - 1) * pagination.limit + 1
                    }-${Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )} of ${pagination.total} orders`}
              </p>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={goToPreviousPage}
                    disabled={pagination.page <= 1}
                    aria-label="Previous page"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E5E5] text-black transition hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
                  >
                    <FiChevronLeft size={16} className="sm:hidden" />

                    <FiChevronLeft size={18} className="hidden sm:block" />
                  </button>

                  <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#DB4444] px-3 text-xs font-medium text-white sm:h-10 sm:min-w-10 sm:text-sm">
                    {pagination.page}
                  </div>

                  <button
                    type="button"
                    onClick={goToNextPage}
                    disabled={pagination.page >= pagination.totalPages}
                    aria-label="Next page"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E5E5] text-black transition hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
                  >
                    <FiChevronRight size={16} className="sm:hidden" />

                    <FiChevronRight size={18} className="hidden sm:block" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          ORDER DETAILS MODAL
      ============================================================ */}

      {detailsOpen && (
        <div
          className="fixed inset-0 z-999 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeOrderDetails();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-details-title"
            className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* ==================================================
                MODAL HEADER
            ================================================== */}

            <div className="flex items-center justify-between gap-3 border-b border-[#E5E5E5] px-4 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="order-details-title"
                    className="text-base font-semibold text-black sm:text-lg lg:text-xl"
                  >
                    Order Details
                  </h2>

                  {isPosOrder(selectedOrder) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#DB4444]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#DB4444]">
                      <FiShoppingBag size={10} />
                      POS
                    </span>
                  )}
                </div>

                {selectedOrder?.orderNumber && (
                  <p className="mt-0.5 truncate text-xs text-[#7A7A7A] sm:mt-1 sm:text-sm">
                    #{selectedOrder.orderNumber}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={closeOrderDetails}
                aria-label="Close order details"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition hover:bg-[#F5F5F5] hover:text-black sm:h-10 sm:w-10"
              >
                <FiX size={19} className="sm:hidden" />

                <FiX size={21} className="hidden sm:block" />
              </button>
            </div>

            {/* ==================================================
                MODAL CONTENT
            ================================================== */}

            <div className="overflow-y-auto p-4 sm:p-5 lg:p-6">
              {detailsLoading && (
                <div className="flex min-h-75 items-center justify-center sm:min-h-100">
                  <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#DB4444]" />

                    <p className="mt-4 text-xs text-[#7A7A7A] sm:text-sm">
                      Loading order details...
                    </p>
                  </div>
                </div>
              )}

              {!detailsLoading && detailsError && (
                <div className="flex min-h-75 items-center justify-center sm:min-h-100">
                  <div className="max-w-md text-center">
                    <h3 className="text-base font-semibold text-red-600 sm:text-lg">
                      Unable to load order
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-[#7A7A7A] sm:text-sm sm:leading-6">
                      {detailsError}
                    </p>

                    <button
                      type="button"
                      onClick={handleRetryOrderDetails}
                      disabled={!selectedOrderId || detailsLoading}
                      className="mt-5 rounded-lg bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[#C83D3D] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {!detailsLoading && !detailsError && selectedOrder && (
                <div className="space-y-4 sm:space-y-6">
                  {/* ==================================================
                      POS SALE BANNER
                  ================================================== */}

                  {isPosOrder(selectedOrder) && (
                    <div className="rounded-xl border border-[#DB4444]/20 bg-[#FFF5F5] p-3.5 sm:p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#DB4444] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          <FiShoppingBag size={10} />
                          POS Sale
                        </span>

                        {selectedOrder.customerType && (
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${getCustomerTypeBadgeClasses(
                              selectedOrder.customerType,
                            )}`}
                          >
                            {selectedOrder.customerType}
                          </span>
                        )}

                        {selectedOrder.posMetadata?.billNumber && (
                          <span className="text-[11px] text-[#7A7A7A] sm:text-[12px]">
                            Bill:{" "}
                            <span className="font-semibold text-black">
                              {selectedOrder.posMetadata.billNumber}
                            </span>
                          </span>
                        )}

                        {selectedOrder.posMetadata?.walkInCustomer && (
                          <span className="inline-block rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-[#7A7A7A] ring-1 ring-[#E5E5E5]">
                            Walk-in
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2.5 text-[11px] sm:grid-cols-2 sm:text-[12px]">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-[#999999] sm:text-[11px]">
                            Customer
                          </p>
                          <p className="mt-0.5 font-medium text-black">
                            {selectedOrder.posMetadata?.customerName?.trim() ||
                              "Walk-in Customer"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-[#999999] sm:text-[11px]">
                            Phone
                          </p>
                          <p className="mt-0.5 font-medium text-black">
                            {selectedOrder.posMetadata?.customerPhone?.trim() ||
                              "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-[#999999] sm:text-[11px]">
                            Cashier
                          </p>
                          <p className="mt-0.5 font-medium text-black">
                            {selectedOrder.posMetadata?.cashierName || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-[#999999] sm:text-[11px]">
                            Payment
                          </p>
                          <p className="mt-0.5 font-medium capitalize text-black">
                            {selectedOrder.posMetadata?.paymentMethod ||
                              selectedOrder.paymentMethod ||
                              "—"}
                          </p>
                        </div>

                        {selectedOrder.customerType === "wholesale" &&
                          (selectedOrder.posMetadata?.totalWholesaleDiscount ||
                            0) > 0 && (
                            <div className="sm:col-span-2">
                              <p className="text-[10px] uppercase tracking-wide text-[#999999] sm:text-[11px]">
                                Total Wholesale Discount
                              </p>
                              <p className="mt-0.5 text-sm font-semibold text-[#DB4444]">
                                {formatPrice(
                                  selectedOrder.posMetadata
                                    .totalWholesaleDiscount,
                                )}
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* ==================================================
                      TOP SUMMARY
                  ================================================== */}

                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                    <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-3.5 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 sm:h-10 sm:w-10">
                          <FiPackage size={17} className="sm:hidden" />

                          <FiPackage size={19} className="hidden sm:block" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] text-[#7A7A7A] sm:text-xs">
                            Order Status
                          </p>

                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium sm:px-2.5 sm:py-1 sm:text-xs ${getOrderStatusClasses(
                              selectedOrder.orderStatus,
                            )}`}
                          >
                            {formatStatus(selectedOrder.orderStatus)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-3.5 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 sm:h-10 sm:w-10">
                          <FiCreditCard size={17} className="sm:hidden" />

                          <FiCreditCard size={19} className="hidden sm:block" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] text-[#7A7A7A] sm:text-xs">
                            Payment
                          </p>

                          <p className="mt-1 truncate text-xs font-semibold text-black sm:text-sm">
                            {formatPaymentMethod(selectedOrder.paymentMethod)}
                          </p>

                          <p
                            className={`mt-0.5 text-[10px] font-medium sm:text-xs ${getPaymentStatusClasses(
                              selectedOrder.paymentStatus,
                            )}`}
                          >
                            {formatStatus(selectedOrder.paymentStatus)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-3.5 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 sm:h-10 sm:w-10">
                          <FiUser size={17} className="sm:hidden" />

                          <FiUser size={19} className="hidden sm:block" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] text-[#7A7A7A] sm:text-xs">
                            Customer
                          </p>

                          <p className="mt-1 truncate text-xs font-semibold text-black sm:text-sm">
                            {isPosOrder(selectedOrder)
                              ? selectedOrder.posMetadata?.customerName?.trim() ||
                                "Walk-in"
                              : selectedOrder.customer?.name ||
                                "Unknown Customer"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-3.5 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF5F5] text-[#DB4444] sm:h-10 sm:w-10">
                          <FiCalendar size={17} className="sm:hidden" />

                          <FiCalendar size={19} className="hidden sm:block" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] text-[#7A7A7A] sm:text-xs">
                            Order Date
                          </p>

                          <p className="mt-1 text-xs font-semibold text-black sm:text-sm">
                            {formatDate(selectedOrder.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ==================================================
                      SHIPPING / FULFILLMENT (hidden for POS)
                  ================================================== */}

                  {!isPosOrder(selectedOrder) && (
                    <div className="rounded-xl border border-[#E5E5E5] bg-white">
                      <div className="border-b border-[#E5E5E5] px-4 py-3.5 sm:px-5 sm:py-4">
                        <div className="flex items-center gap-2">
                          <FiTruck
                            size={17}
                            className="shrink-0 text-[#DB4444] sm:hidden"
                          />

                          <FiTruck
                            size={19}
                            className="hidden shrink-0 text-[#DB4444] sm:block"
                          />

                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-black sm:text-base">
                              Shipping & Fulfillment
                            </h3>

                            <p className="mt-1 text-[11px] text-[#7A7A7A] sm:text-xs">
                              Update order progress and shipment information.
                            </p>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleUpdateOrder} className="p-4 sm:p-5">
                        <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                          <div>
                            <label
                              htmlFor="orderStatus"
                              className="mb-2 block text-xs font-medium text-black sm:text-sm"
                            >
                              Order Status
                            </label>

                            <select
                              id="orderStatus"
                              name="orderStatus"
                              value={updateForm.orderStatus}
                              onChange={handleUpdateFormChange}
                              disabled={updateLoading}
                              className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-xs outline-none transition focus:border-[#DB4444] focus:ring-2 focus:ring-[#DB4444]/10 disabled:cursor-not-allowed disabled:bg-[#F5F5F5] sm:px-4 sm:py-3 sm:text-sm"
                            >
                              {updateStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor="paymentStatus"
                              className="mb-2 block text-xs font-medium text-black sm:text-sm"
                            >
                              Payment Status
                            </label>

                            <select
                              id="paymentStatus"
                              name="paymentStatus"
                              value={updateForm.paymentStatus}
                              onChange={handleUpdateFormChange}
                              disabled={updateLoading}
                              className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-xs outline-none transition focus:border-[#DB4444] focus:ring-2 focus:ring-[#DB4444]/10 disabled:cursor-not-allowed disabled:bg-[#F5F5F5] sm:px-4 sm:py-3 sm:text-sm"
                            >
                              {updatePaymentOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor="carrier"
                              className="mb-2 block text-xs font-medium text-black sm:text-sm"
                            >
                              Shipping Carrier
                            </label>

                            <input
                              id="carrier"
                              name="carrier"
                              type="text"
                              placeholder="e.g. Delhivery"
                              value={updateForm.carrier}
                              onChange={handleUpdateFormChange}
                              disabled={updateLoading}
                              className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-xs outline-none placeholder:text-[#999999] transition focus:border-[#DB4444] focus:ring-2 focus:ring-[#DB4444]/10 disabled:cursor-not-allowed disabled:bg-[#F5F5F5] sm:px-4 sm:py-3 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="trackingNumber"
                              className="mb-2 block text-xs font-medium text-black sm:text-sm"
                            >
                              Tracking Number
                            </label>

                            <input
                              id="trackingNumber"
                              name="trackingNumber"
                              type="text"
                              placeholder="e.g. DL123456789"
                              value={updateForm.trackingNumber}
                              onChange={handleUpdateFormChange}
                              disabled={updateLoading}
                              className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-xs outline-none placeholder:text-[#999999] transition focus:border-[#DB4444] focus:ring-2 focus:ring-[#DB4444]/10 disabled:cursor-not-allowed disabled:bg-[#F5F5F5] sm:px-4 sm:py-3 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="trackingUrl"
                              className="mb-2 block text-xs font-medium text-black sm:text-sm"
                            >
                              Tracking URL
                            </label>

                            <input
                              id="trackingUrl"
                              name="trackingUrl"
                              type="url"
                              placeholder="https://..."
                              value={updateForm.trackingUrl}
                              onChange={handleUpdateFormChange}
                              disabled={updateLoading}
                              className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-xs outline-none placeholder:text-[#999999] transition focus:border-[#DB4444] focus:ring-2 focus:ring-[#DB4444]/10 disabled:cursor-not-allowed disabled:bg-[#F5F5F5] sm:px-4 sm:py-3 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="estimatedDeliveryDate"
                              className="mb-2 block text-xs font-medium text-black sm:text-sm"
                            >
                              Estimated Delivery
                            </label>

                            <input
                              id="estimatedDeliveryDate"
                              name="estimatedDeliveryDate"
                              type="date"
                              value={updateForm.estimatedDeliveryDate}
                              onChange={handleUpdateFormChange}
                              disabled={updateLoading}
                              className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-xs outline-none transition focus:border-[#DB4444] focus:ring-2 focus:ring-[#DB4444]/10 disabled:cursor-not-allowed disabled:bg-[#F5F5F5] sm:px-4 sm:py-3 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="trackingLocation"
                              className="mb-2 block text-xs font-medium text-black sm:text-sm"
                            >
                              Tracking Location
                            </label>

                            <input
                              id="trackingLocation"
                              name="trackingLocation"
                              type="text"
                              placeholder="e.g. Delhi Hub"
                              value={updateForm.trackingLocation}
                              onChange={handleUpdateFormChange}
                              disabled={updateLoading}
                              className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-xs outline-none placeholder:text-[#999999] transition focus:border-[#DB4444] focus:ring-2 focus:ring-[#DB4444]/10 disabled:cursor-not-allowed disabled:bg-[#F5F5F5] sm:px-4 sm:py-3 sm:text-sm"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label
                              htmlFor="trackingDescription"
                              className="mb-2 block text-xs font-medium text-black sm:text-sm"
                            >
                              Tracking Update Note
                            </label>

                            <textarea
                              id="trackingDescription"
                              name="trackingDescription"
                              rows={3}
                              placeholder="Example: Shipment has been handed over to the courier partner."
                              value={updateForm.trackingDescription}
                              onChange={handleUpdateFormChange}
                              disabled={updateLoading}
                              className="w-full resize-none rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-xs outline-none placeholder:text-[#999999] transition focus:border-[#DB4444] focus:ring-2 focus:ring-[#DB4444]/10 disabled:cursor-not-allowed disabled:bg-[#F5F5F5] sm:px-4 sm:py-3 sm:text-sm"
                            />
                          </div>
                        </div>

                        {updateError && (
                          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 sm:mt-5 sm:gap-3 sm:px-4 sm:py-3">
                            <FiAlertCircle
                              size={16}
                              className="mt-0.5 shrink-0 text-red-600 sm:hidden"
                            />

                            <FiAlertCircle
                              size={18}
                              className="mt-0.5 hidden shrink-0 text-red-600 sm:block"
                            />

                            <p className="text-xs leading-5 text-red-600 sm:text-sm sm:leading-6">
                              {updateError}
                            </p>
                          </div>
                        )}

                        {updateSuccess && (
                          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 sm:mt-5 sm:gap-3 sm:px-4 sm:py-3">
                            <FiCheckCircle
                              size={16}
                              className="mt-0.5 shrink-0 text-green-600 sm:hidden"
                            />

                            <FiCheckCircle
                              size={18}
                              className="mt-0.5 hidden shrink-0 text-green-600 sm:block"
                            />

                            <p className="text-xs leading-5 text-green-600 sm:text-sm sm:leading-6">
                              {updateSuccess}
                            </p>
                          </div>
                        )}

                        <div className="mt-4 flex justify-end sm:mt-5">
                          <button
                            type="submit"
                            disabled={updateLoading}
                            className="inline-flex w-full min-w-35 items-center justify-center gap-2 rounded-lg bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[#C83D3D] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-37.5 sm:py-3 sm:text-sm"
                          >
                            {updateLoading ? (
                              <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                Updating...
                              </>
                            ) : (
                              "Update Order"
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* ==================================================
                      TRACKING TIMELINE
                  ================================================== */}

                  <div className="rounded-xl border border-[#E5E5E5] bg-white">
                    <div className="border-b border-[#E5E5E5] px-4 py-3.5 sm:px-5 sm:py-4">
                      <div className="flex items-center gap-2">
                        <FiClock
                          size={17}
                          className="shrink-0 text-[#DB4444] sm:hidden"
                        />

                        <FiClock
                          size={19}
                          className="hidden shrink-0 text-[#DB4444] sm:block"
                        />

                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-black sm:text-base">
                            Tracking Timeline
                          </h3>

                          <p className="mt-1 text-[11px] text-[#7A7A7A] sm:text-xs">
                            Order progress and shipment updates.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5">
                      {trackingEvents.length > 0 ? (
                        <div className="relative">
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
                                  className={`relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-white shadow-sm sm:h-4.75 sm:w-4.75 ${getTrackingDotClasses(
                                    event.status,
                                  )}`}
                                />

                                <div className="min-w-0 flex-1 pb-5 sm:pb-7">
                                  <div className="flex flex-col justify-between gap-1.5 sm:flex-row sm:items-start sm:gap-2">
                                    <div className="min-w-0">
                                      <h4 className="text-xs font-semibold text-black sm:text-sm">
                                        {event.title ||
                                          formatStatus(event.status)}
                                      </h4>

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
                        <div className="rounded-lg bg-[#FAFAFA] px-4 py-6 text-center sm:px-5 sm:py-8">
                          <FiClock
                            size={22}
                            className="mx-auto text-[#999999] sm:hidden"
                          />

                          <FiClock
                            size={24}
                            className="mx-auto hidden text-[#999999] sm:block"
                          />

                          <p className="mt-3 text-xs font-medium text-black sm:text-sm">
                            No tracking events yet
                          </p>

                          <p className="mt-1 text-[10px] leading-5 text-[#7A7A7A] sm:text-xs">
                            Tracking events will appear here when the order
                            status is updated.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ==================================================
                      MAIN GRID
                  ================================================== */}

                  <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                    {/* ORDER ITEMS */}

                    <div className="rounded-xl border border-[#E5E5E5] bg-white lg:col-span-2">
                      <div className="border-b border-[#E5E5E5] px-4 py-3.5 sm:px-5 sm:py-4">
                        <h3 className="text-sm font-semibold text-black sm:text-base">
                          Ordered Products
                        </h3>

                        <p className="mt-1 text-[11px] text-[#7A7A7A] sm:text-xs">
                          {selectedOrder.items?.length || 0} product
                          {(selectedOrder.items?.length || 0) === 1 ? "" : "s"}
                        </p>
                      </div>

                      <div className="divide-y divide-[#E5E5E5]">
                        {selectedOrder.items?.length > 0 ? (
                          selectedOrder.items.map((item) => {
                            const showWholesale =
                              selectedOrder.customerType === "wholesale" &&
                              item.mrp &&
                              item.wholesaleDiscountPercentage > 0;

                            return (
                              <div
                                key={item.id}
                                className="flex gap-3 p-4 sm:gap-4 sm:p-5"
                              >
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#F5F5F5] sm:h-20 sm:w-20">
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
                                  <h4 className="line-clamp-2 text-xs font-semibold text-black sm:text-sm">
                                    {item.productName}
                                  </h4>

                                  {showWholesale ? (
                                    <div className="mt-1 space-y-0.5">
                                      <p className="text-[11px] text-[#7A7A7A] sm:text-xs">
                                        MRP:{" "}
                                        <span className="line-through">
                                          {formatPrice(item.mrp)}
                                        </span>
                                      </p>

                                      <p className="text-[11px] text-[#7A7A7A] sm:text-xs">
                                        Unit Price:{" "}
                                        <span className="font-semibold text-black">
                                          {formatPrice(
                                            item.unitPrice ?? item.price,
                                          )}
                                        </span>{" "}
                                        <span className="ml-1 rounded-full bg-[#FFF5F5] px-1.5 py-0.5 text-[9px] font-medium text-[#DB4444] sm:text-[10px]">
                                          {item.wholesaleDiscountPercentage}%
                                          off
                                        </span>
                                      </p>

                                      <p className="text-[11px] text-[#7A7A7A] sm:text-xs">
                                        Quantity: {item.quantity}
                                      </p>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="mt-1 text-[11px] text-[#7A7A7A] sm:text-xs">
                                        Price: {formatPrice(item.price)}
                                      </p>

                                      <p className="mt-1 text-[11px] text-[#7A7A7A] sm:text-xs">
                                        Quantity: {item.quantity}
                                      </p>
                                    </>
                                  )}
                                </div>

                                <div className="shrink-0 text-right">
                                  <p className="text-xs font-semibold text-[#DB4444] sm:text-sm">
                                    {formatPrice(item.subtotal)}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-6 text-center text-xs text-[#7A7A7A] sm:p-8 sm:text-sm">
                            No order items found.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CUSTOMER INFORMATION */}

                    <div className="space-y-4 sm:space-y-6">
                      <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
                        <h3 className="text-sm font-semibold text-black sm:text-base">
                          Customer Information
                        </h3>

                        <div className="mt-3 space-y-3 text-xs sm:mt-4 sm:text-sm">
                          <div>
                            <p className="text-[11px] text-[#7A7A7A] sm:text-xs">
                              Name
                            </p>

                            <p className="mt-1 font-medium text-black">
                              {isPosOrder(selectedOrder)
                                ? selectedOrder.posMetadata?.customerName?.trim() ||
                                  "Walk-in Customer"
                                : selectedOrder.customer?.name ||
                                  "Unknown Customer"}
                            </p>
                          </div>

                          {!isPosOrder(selectedOrder) && (
                            <div>
                              <p className="text-[11px] text-[#7A7A7A] sm:text-xs">
                                Email
                              </p>

                              <p className="mt-1 break-all font-medium text-black">
                                {selectedOrder.customer?.email || "-"}
                              </p>
                            </div>
                          )}

                          <div>
                            <p className="text-[11px] text-[#7A7A7A] sm:text-xs">
                              Phone
                            </p>

                            <p className="mt-1 font-medium text-black">
                              {isPosOrder(selectedOrder)
                                ? selectedOrder.posMetadata?.customerPhone?.trim() ||
                                  "—"
                                : selectedOrder.customer?.phone || "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* DELIVERY ADDRESS (hidden for POS) */}

                      {!isPosOrder(selectedOrder) && (
                        <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
                          <div className="flex items-center gap-2">
                            <FiMapPin
                              size={16}
                              className="shrink-0 text-[#DB4444] sm:hidden"
                            />

                            <FiMapPin
                              size={18}
                              className="hidden shrink-0 text-[#DB4444] sm:block"
                            />

                            <h3 className="text-sm font-semibold text-black sm:text-base">
                              Delivery Address
                            </h3>
                          </div>

                          {selectedOrder.shippingAddress ? (
                            <div className="mt-3 text-xs leading-5 text-[#7A7A7A] sm:mt-4 sm:text-sm sm:leading-6">
                              <p className="font-medium text-black">
                                {selectedOrder.shippingAddress.fullName}
                              </p>

                              <p>
                                {selectedOrder.shippingAddress.addressLine1}
                              </p>

                              {selectedOrder.shippingAddress.addressLine2 && (
                                <p>
                                  {selectedOrder.shippingAddress.addressLine2}
                                </p>
                              )}

                              <p>
                                {selectedOrder.shippingAddress.city},{" "}
                                {selectedOrder.shippingAddress.state}
                              </p>

                              <p>
                                {selectedOrder.shippingAddress.postalCode},{" "}
                                {selectedOrder.shippingAddress.country}
                              </p>

                              <p className="mt-2">
                                Phone: {selectedOrder.shippingAddress.phone}
                              </p>
                            </div>
                          ) : (
                            <p className="mt-3 text-xs text-[#7A7A7A] sm:mt-4 sm:text-sm">
                              No shipping address found.
                            </p>
                          )}
                        </div>
                      )}

                      {/* CURRENT SHIPPING DETAILS (hidden for POS) */}

                      {!isPosOrder(selectedOrder) && (
                        <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
                          <div className="flex items-center gap-2">
                            <FiTruck
                              size={16}
                              className="shrink-0 text-[#DB4444] sm:hidden"
                            />

                            <FiTruck
                              size={18}
                              className="hidden shrink-0 text-[#DB4444] sm:block"
                            />

                            <h3 className="text-sm font-semibold text-black sm:text-base">
                              Current Shipment
                            </h3>
                          </div>

                          <div className="mt-3 space-y-2.5 text-xs sm:mt-4 sm:space-y-3 sm:text-sm">
                            <div className="flex justify-between gap-3">
                              <span className="text-[#7A7A7A]">Carrier</span>

                              <span className="text-right font-medium text-black">
                                {selectedOrder.shippingDetails?.carrier || "-"}
                              </span>
                            </div>

                            <div className="flex justify-between gap-3">
                              <span className="text-[#7A7A7A]">
                                Tracking No.
                              </span>

                              <span className="break-all text-right font-medium text-black">
                                {selectedOrder.shippingDetails
                                  ?.trackingNumber || "-"}
                              </span>
                            </div>

                            <div className="flex justify-between gap-3">
                              <span className="text-[#7A7A7A]">
                                Est. Delivery
                              </span>

                              <span className="text-right font-medium text-black">
                                {selectedOrder.shippingDetails
                                  ?.estimatedDeliveryDate
                                  ? formatDate(
                                      selectedOrder.shippingDetails
                                        .estimatedDeliveryDate,
                                    )
                                  : "-"}
                              </span>
                            </div>

                            {selectedOrder.shippingDetails?.trackingUrl && (
                              <a
                                href={selectedOrder.shippingDetails.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex text-xs font-medium text-[#DB4444] hover:underline sm:text-sm"
                              >
                                Open Tracking Link
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ==================================================
                      PRICE SUMMARY
                  ================================================== */}

                  <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
                      <h3 className="text-sm font-semibold text-black sm:text-base">
                        Price Summary
                      </h3>

                      <div className="mt-3 space-y-2.5 text-xs sm:mt-4 sm:space-y-3 sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#7A7A7A]">Subtotal</span>

                          <span className="font-medium text-black">
                            {formatPrice(selectedOrder.subtotal)}
                          </span>
                        </div>

                        {selectedOrder.discount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-[#7A7A7A]">
                              {isPosOrder(selectedOrder) &&
                              selectedOrder.customerType === "wholesale"
                                ? "Wholesale Discount"
                                : "Discount"}
                            </span>

                            <span className="font-medium text-green-600">
                              - {formatPrice(selectedOrder.discount)}
                            </span>
                          </div>
                        )}

                        {!isPosOrder(selectedOrder) && (
                          <div className="flex justify-between">
                            <span className="text-[#7A7A7A]">Shipping</span>

                            <span className="font-medium text-black">
                              {selectedOrder.shipping > 0
                                ? formatPrice(selectedOrder.shipping)
                                : "Free"}
                            </span>
                          </div>
                        )}

                        {selectedOrder.couponCode && (
                          <div className="flex justify-between">
                            <span className="text-[#7A7A7A]">Coupon</span>

                            <span className="font-medium text-[#DB4444]">
                              {selectedOrder.couponCode}
                            </span>
                          </div>
                        )}

                        <div className="border-t border-[#E5E5E5] pt-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-black">
                              Total
                            </span>

                            <span className="text-base font-semibold text-[#DB4444] sm:text-lg">
                              {formatPrice(selectedOrder.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ORDER INFORMATION */}

                    <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
                      <h3 className="text-sm font-semibold text-black sm:text-base">
                        Order Information
                      </h3>

                      <div className="mt-3 space-y-2.5 text-xs sm:mt-4 sm:space-y-3 sm:text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="text-[#7A7A7A]">Order Number</span>

                          <span className="text-right font-medium text-black">
                            #{selectedOrder.orderNumber}
                          </span>
                        </div>

                        {isPosOrder(selectedOrder) &&
                          selectedOrder.posMetadata?.billNumber && (
                            <div className="flex justify-between gap-3">
                              <span className="text-[#7A7A7A]">Bill No.</span>

                              <span className="text-right font-medium text-black">
                                {selectedOrder.posMetadata.billNumber}
                              </span>
                            </div>
                          )}

                        <div className="flex justify-between gap-3">
                          <span className="text-[#7A7A7A]">Created</span>

                          <span className="text-right font-medium text-black">
                            {formatDateTime(selectedOrder.createdAt)}
                          </span>
                        </div>

                        <div className="flex justify-between gap-3">
                          <span className="text-[#7A7A7A]">Payment Method</span>

                          <span className="text-right font-medium text-black">
                            {formatPaymentMethod(selectedOrder.paymentMethod)}
                          </span>
                        </div>

                        <div className="flex justify-between gap-3">
                          <span className="text-[#7A7A7A]">Payment Status</span>

                          <span
                            className={`text-right font-medium ${getPaymentStatusClasses(
                              selectedOrder.paymentStatus,
                            )}`}
                          >
                            {formatStatus(selectedOrder.paymentStatus)}
                          </span>
                        </div>

                        {selectedOrder.paidAt && (
                          <div className="flex justify-between gap-3">
                            <span className="text-[#7A7A7A]">Paid At</span>

                            <span className="text-right font-medium text-black">
                              {formatDateTime(selectedOrder.paidAt)}
                            </span>
                          </div>
                        )}

                        {selectedOrder.couponCode && (
                          <div className="flex justify-between gap-3">
                            <span className="text-[#7A7A7A]">Coupon</span>

                            <span className="text-right font-medium text-[#DB4444]">
                              {selectedOrder.couponCode}
                            </span>
                          </div>
                        )}

                        {selectedOrder.shippingDetails?.shippedAt && (
                          <div className="flex justify-between gap-3">
                            <span className="text-[#7A7A7A]">Shipped At</span>

                            <span className="text-right font-medium text-black">
                              {formatDateTime(
                                selectedOrder.shippingDetails.shippedAt,
                              )}
                            </span>
                          </div>
                        )}

                        {selectedOrder.shippingDetails?.outForDeliveryAt && (
                          <div className="flex justify-between gap-3">
                            <span className="text-[#7A7A7A]">
                              Out for Delivery
                            </span>

                            <span className="text-right font-medium text-black">
                              {formatDateTime(
                                selectedOrder.shippingDetails.outForDeliveryAt,
                              )}
                            </span>
                          </div>
                        )}

                        {selectedOrder.shippingDetails?.deliveredAt && (
                          <div className="flex justify-between gap-3">
                            <span className="text-[#7A7A7A]">Delivered At</span>

                            <span className="text-right font-medium text-black">
                              {formatDateTime(
                                selectedOrder.shippingDetails.deliveredAt,
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ==================================================
                      CANCELLATION
                  ================================================== */}

                  {selectedOrder.orderStatus === "cancelled" &&
                    selectedOrder.cancellationReason && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5">
                        <h3 className="text-sm font-semibold text-red-600 sm:text-base">
                          Cancellation Reason
                        </h3>

                        <p className="mt-2 text-xs leading-5 text-red-600 sm:text-sm sm:leading-6">
                          {selectedOrder.cancellationReason}
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* ==================================================
                MODAL FOOTER
            ================================================== */}

            <div className="flex justify-end border-t border-[#E5E5E5] bg-white px-4 py-3.5 sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={closeOrderDetails}
                className="w-full rounded-lg border border-[#E5E5E5] px-5 py-2.5 text-xs font-medium text-black transition hover:border-[#DB4444] hover:text-[#DB4444] sm:w-auto sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Orders;
