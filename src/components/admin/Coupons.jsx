// FILE LOCATION: src/components/admin/Coupons.jsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
  FiSave,
  FiLoader,
  FiTag,
  FiTrendingUp,
  FiGift,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
} from "react-icons/fi";

// ============================================================
// CONSTANTS
// ============================================================

const PER_PAGE = 20;

const EMPTY_PAGINATION = {
  page: 1,
  limit: PER_PAGE,
  total: 0,
  totalPages: 0,
};

const DISCOUNT_TYPES = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed (₹)" },
];

const COUPON_TYPES = [
  { value: "general", label: "General" },
  { value: "welcome", label: "Welcome" },
];

const STATUS_FILTERS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "expired", label: "Expired" },
  { value: "redeemed", label: "Redeemed" },
];

const TYPE_FILTERS = [
  { value: "", label: "All Types" },
  { value: "general", label: "General" },
  { value: "welcome", label: "Welcome" },
];

// ============================================================
// HELPERS
// ============================================================

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isExpired = (coupon) => {
  if (!coupon?.expiryDate) return false;
  return new Date(coupon.expiryDate).getTime() < Date.now();
};

const isUsageLimitReached = (coupon) => {
  if (!coupon?.usageLimit) return false;
  return Number(coupon.usedCount || 0) >= Number(coupon.usageLimit);
};

const getCouponStatus = (coupon) => {
  if (coupon.redeemed) {
    return {
      label: "Redeemed",
      classes: "bg-purple-100 text-purple-700",
    };
  }

  if (!coupon.isActive) {
    return {
      label: "Inactive",
      classes: "bg-gray-100 text-gray-600",
    };
  }

  if (isExpired(coupon)) {
    return {
      label: "Expired",
      classes: "bg-red-100 text-red-600",
    };
  }

  if (isUsageLimitReached(coupon)) {
    return {
      label: "Limit Reached",
      classes: "bg-orange-100 text-orange-600",
    };
  }

  return {
    label: "Active",
    classes: "bg-green-100 text-green-700",
  };
};

const formatDiscount = (coupon) => {
  if (coupon.discountType === "percentage") {
    return `${coupon.discountValue}%`;
  }
  return formatPrice(coupon.discountValue);
};

// ============================================================
// COMPONENT
// ============================================================

const Coupons = () => {
  // ----------------------------------------
  // Data state
  // ----------------------------------------

  const [coupons, setCoupons] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ----------------------------------------
  // Filters
  // ----------------------------------------

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ----------------------------------------
  // Modal state
  // ----------------------------------------

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  // ----------------------------------------
  // Delete state
  // ----------------------------------------

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ----------------------------------------
  // Toggle active state
  // ----------------------------------------

  const [togglingId, setTogglingId] = useState(null);

  // ----------------------------------------
  // Abort controller for list fetches
  // ----------------------------------------

  const listAbortRef = useRef(null);

  // ==========================================================
  // FETCH COUPONS (DEBOUNCED + ABORTABLE)
  // ==========================================================

  const fetchCoupons = useCallback(async () => {
    // Cancel previous in-flight request
    if (listAbortRef.current) {
      listAbortRef.current.abort();
    }

    const controller = new AbortController();
    listAbortRef.current = controller;

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);

      params.set("page", String(currentPage));
      params.set("limit", String(PER_PAGE));

      const response = await fetch(`/api/admin/coupons?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch coupons.");
      }

      setCoupons(Array.isArray(data?.coupons) ? data.coupons : []);

      setPagination(
        data?.pagination || {
          page: currentPage,
          limit: PER_PAGE,
          total: 0,
          totalPages: 0,
        },
      );
    } catch (err) {
      if (err?.name === "AbortError") return;

      console.error("Fetch coupons error:", err);
      setError(err?.message || "Failed to fetch coupons.");
      setCoupons([]);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [searchTerm, statusFilter, typeFilter, currentPage]);

  useEffect(() => {
    const timer = setTimeout(fetchCoupons, 300);
    return () => clearTimeout(timer);
  }, [fetchCoupons]);

  // ==========================================================
  // STATS
  // ==========================================================

  const stats = useMemo(() => {
    const total = pagination.total;
    const active = coupons.filter(
      (c) =>
        c.isActive && !isExpired(c) && !c.redeemed && !isUsageLimitReached(c),
    ).length;
    const redeemed = coupons.filter((c) => c.redeemed).length;
    const expired = coupons.filter((c) => isExpired(c) && !c.redeemed).length;

    return { total, active, redeemed, expired };
  }, [coupons, pagination.total]);

  // ==========================================================
  // HANDLERS - FILTERS
  // ==========================================================

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  // ==========================================================
  // HANDLERS - OPEN MODALS
  // ==========================================================

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCoupon(null);
  };

  // ==========================================================
  // HANDLERS - TOGGLE ACTIVE
  // ==========================================================

  const handleToggleActive = async (coupon) => {
    if (togglingId) return;

    // Optimistic update
    const previous = [...coupons];
    setCoupons((list) =>
      list.map((c) =>
        c._id === coupon._id ? { ...c, isActive: !c.isActive } : c,
      ),
    );
    setTogglingId(coupon._id);

    try {
      const response = await fetch(`/api/admin/coupons/${coupon._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update status.");
      }

      // Replace with server response
      setCoupons((list) =>
        list.map((c) => (c._id === coupon._id ? data.coupon : c)),
      );
    } catch (err) {
      console.error("Toggle active error:", err);
      // Revert
      setCoupons(previous);
      alert(err?.message || "Failed to update coupon status.");
    } finally {
      setTogglingId(null);
    }
  };

  // ==========================================================
  // HANDLERS - DELETE
  // ==========================================================

  const handleOpenDelete = (coupon) => {
    setDeleteTarget(coupon);
    setDeleteError("");
  };

  const handleCloseDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(`/api/admin/coupons/${deleteTarget._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete coupon.");
      }

      // Remove from list
      setCoupons((list) => list.filter((c) => c._id !== deleteTarget._id));

      setPagination((prev) => ({
        ...prev,
        total: Math.max(prev.total - 1, 0),
      }));

      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete coupon error:", err);
      setDeleteError(err?.message || "Failed to delete coupon.");
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================================
  // HANDLERS - SAVE (CREATE OR UPDATE)
  // ==========================================================

  const handleSaveCoupon = async (payload) => {
    const isEditing = Boolean(editingCoupon?._id);

    const url = isEditing
      ? `/api/admin/coupons/${editingCoupon._id}`
      : `/api/admin/coupons`;

    const method = isEditing ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || "Failed to save coupon.");
    }

    // Refresh the list to keep ordering/pagination consistent
    await fetchCoupons();

    return data.coupon;
  };

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const goToNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="font-poppins">
      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="mb-5 flex flex-col gap-4 sm:mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-1.5 text-xl font-semibold tracking-[0.02em] text-black sm:text-2xl lg:text-[28px] xl:text-[32px]">
            Coupons
          </h1>

          <p className="text-xs text-[#7A7A7A] sm:text-[13px] lg:text-[15px]">
            Manage discount coupons and welcome offers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex w-fit items-center gap-2 rounded-lg bg-[#DB4444] px-4 py-2.5 text-xs font-medium text-white shadow-lg shadow-[#DB4444]/30 transition-colors hover:bg-[#c73d3d] sm:px-5 sm:py-3 sm:text-[13px] md:text-[14px]"
        >
          <FiPlus size={16} />
          Create Coupon
        </button>
      </div>

      {/* ================================================== */}
      {/* STATS */}
      {/* ================================================== */}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Coupons"
          value={stats.total}
          icon={FiTag}
          color="#DB4444"
        />
        <StatCard
          label="Active (Page)"
          value={stats.active}
          icon={FiTrendingUp}
          color="#27AE60"
        />
        <StatCard
          label="Redeemed (Page)"
          value={stats.redeemed}
          icon={FiGift}
          color="#8E44AD"
        />
        <StatCard
          label="Expired (Page)"
          value={stats.expired}
          icon={FiClock}
          color="#E67E22"
        />
      </div>

      {/* ================================================== */}
      {/* FILTERS */}
      {/* ================================================== */}

      <div className="mb-4 rounded-xl border border-[#E5E5E5] bg-white p-3.5 sm:mb-5 sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          {/* Search */}

          <div className="relative flex-1">
            <FiSearch
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7A7A]"
            />

            <input
              type="text"
              placeholder="Search by code or owner email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full rounded-lg bg-[#F5F5F5] py-2.5 pl-10 pr-4 text-xs outline-none transition-all placeholder:text-[#7A7A7A] focus:ring-2 focus:ring-[#DB4444]/20 sm:text-[13px]"
            />
          </div>

          {/* Type filter */}

          <div className="flex items-center gap-2 rounded-lg bg-[#F5F5F5] px-3 py-2.5 sm:px-4">
            <FiFilter size={16} className="shrink-0 text-[#7A7A7A]" />

            <select
              value={typeFilter}
              onChange={handleTypeChange}
              className="w-full cursor-pointer bg-transparent text-xs outline-none sm:text-[13px]"
            >
              {TYPE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}

          <div className="flex items-center gap-2 rounded-lg bg-[#F5F5F5] px-3 py-2.5 sm:px-4">
            <FiFilter size={16} className="shrink-0 text-[#7A7A7A]" />

            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="w-full cursor-pointer bg-transparent text-xs outline-none sm:text-[13px]"
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 sm:text-sm">
          {error}
        </div>
      )}

      {/* ================================================== */}
      {/* TABLE */}
      {/* ================================================== */}

      <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-225">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <Th>Code</Th>
                <Th>Type</Th>
                <Th>Discount</Th>
                <Th>Min Order</Th>
                <Th>Usage</Th>
                <Th>Expiry</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>

            <tbody>
              {/* Loading */}

              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-[#7A7A7A]"
                  >
                    Loading coupons...
                  </td>
                </tr>
              )}

              {/* Empty */}

              {!loading && coupons.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <FiTag size={28} className="mx-auto mb-3 text-[#B5B5B5]" />

                    <p className="text-sm font-medium text-black">
                      No coupons found
                    </p>

                    <p className="mt-1 text-xs text-[#7A7A7A]">
                      {searchTerm || statusFilter || typeFilter
                        ? "Try adjusting your filters."
                        : "Create your first coupon to get started."}
                    </p>
                  </td>
                </tr>
              )}

              {/* Rows */}

              {!loading &&
                coupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  const isToggling = togglingId === coupon._id;

                  return (
                    <tr
                      key={coupon._id}
                      className="border-b border-[#F5F5F5] transition-colors hover:bg-[#FAFAFA]"
                    >
                      {/* Code */}

                      <td className="px-4 py-3 sm:px-5 sm:py-4">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-black sm:text-[13px]">
                            {coupon.code}
                          </p>

                          {coupon.couponType === "welcome" &&
                            coupon.ownerEmail && (
                              <p className="mt-0.5 truncate text-[10px] text-[#7A7A7A] sm:text-[11px]">
                                {coupon.ownerEmail}
                              </p>
                            )}
                        </div>
                      </td>

                      {/* Type */}

                      <td className="px-4 py-3 sm:px-5 sm:py-4">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium sm:px-2.5 sm:py-1 sm:text-[11px] ${
                            coupon.couponType === "welcome"
                              ? "bg-pink-100 text-pink-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {coupon.couponType === "welcome"
                            ? "Welcome"
                            : "General"}
                        </span>
                      </td>

                      {/* Discount */}

                      <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-[#DB4444] sm:px-5 sm:py-4 sm:text-[13px]">
                        {formatDiscount(coupon)}
                        {coupon.maximumDiscount && (
                          <p className="mt-0.5 text-[10px] font-normal text-[#7A7A7A] sm:text-[11px]">
                            max {formatPrice(coupon.maximumDiscount)}
                          </p>
                        )}
                      </td>

                      {/* Min Order */}

                      <td className="whitespace-nowrap px-4 py-3 text-xs text-black sm:px-5 sm:py-4 sm:text-[13px]">
                        {coupon.minimumOrderAmount > 0
                          ? formatPrice(coupon.minimumOrderAmount)
                          : "—"}
                      </td>

                      {/* Usage */}

                      <td className="whitespace-nowrap px-4 py-3 text-xs text-black sm:px-5 sm:py-4 sm:text-[13px]">
                        {coupon.usageLimit
                          ? `${coupon.usedCount} / ${coupon.usageLimit}`
                          : `${coupon.usedCount} / ∞`}
                      </td>

                      {/* Expiry */}

                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#7A7A7A] sm:px-5 sm:py-4 sm:text-[13px]">
                        {coupon.expiryDate
                          ? formatDate(coupon.expiryDate)
                          : "Never"}
                      </td>

                      {/* Status */}

                      <td className="px-4 py-3 sm:px-5 sm:py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(coupon)}
                          disabled={isToggling || coupon.redeemed}
                          title={
                            coupon.redeemed
                              ? "Redeemed coupons cannot be toggled"
                              : "Click to toggle"
                          }
                          className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity sm:px-2.5 sm:py-1 sm:text-[11px] ${
                            status.classes
                          } ${
                            coupon.redeemed
                              ? "cursor-not-allowed"
                              : "cursor-pointer hover:opacity-80"
                          } ${isToggling ? "opacity-50" : ""}`}
                        >
                          {isToggling ? "Updating..." : status.label}
                        </button>
                      </td>

                      {/* Actions */}

                      <td className="px-4 py-3 sm:px-5 sm:py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(coupon)}
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 sm:h-9 sm:w-9"
                            aria-label={`Edit ${coupon.code}`}
                          >
                            <FiEdit2 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDelete(coupon)}
                            disabled={coupon.redeemed}
                            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors sm:h-9 sm:w-9 ${
                              coupon.redeemed
                                ? "cursor-not-allowed bg-gray-50 text-gray-300"
                                : "bg-red-50 text-red-600 hover:bg-red-100"
                            }`}
                            aria-label={`Delete ${coupon.code}`}
                            title={
                              coupon.redeemed
                                ? "Redeemed coupons cannot be deleted"
                                : "Delete coupon"
                            }
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ================================================== */}
        {/* PAGINATION */}
        {/* ================================================== */}

        {pagination.totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E5E5E5] px-4 py-3.5 sm:flex-row sm:px-5">
            <p className="text-xs text-[#7A7A7A] sm:text-[13px]">
              Showing {(currentPage - 1) * PER_PAGE + 1}–
              {Math.min(currentPage * PER_PAGE, pagination.total)} of{" "}
              {pagination.total}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={currentPage <= 1 || loading}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E5E5E5] transition-colors hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
                aria-label="Previous page"
              >
                <FiChevronLeft size={16} />
              </button>

              <span className="text-xs font-medium text-black sm:text-[13px]">
                {currentPage} / {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={goToNextPage}
                disabled={currentPage >= pagination.totalPages || loading}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E5E5E5] transition-colors hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
                aria-label="Next page"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* MODALS */}
      {/* ================================================== */}

      {modalOpen && (
        <CouponModal
          coupon={editingCoupon}
          onClose={handleCloseModal}
          onSave={handleSaveCoupon}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          coupon={deleteTarget}
          onCancel={handleCloseDelete}
          onConfirm={handleConfirmDelete}
          loading={deleting}
          error={deleteError}
        />
      )}
    </div>
  );
};

// ============================================================
// SUB-COMPONENT — STAT CARD
// ============================================================

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 lg:p-5">
    <div
      className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
      style={{ backgroundColor: `${color}15` }}
    >
      <Icon size={20} style={{ color }} />
    </div>

    <p className="mb-1 text-[11px] text-[#7A7A7A] sm:text-[12px] lg:text-[13px]">
      {label}
    </p>

    <p className="text-lg font-semibold text-black sm:text-xl">
      {typeof value === "number" ? value.toLocaleString("en-IN") : value}
    </p>
  </div>
);

// ============================================================
// SUB-COMPONENT — TABLE HEADER CELL
// ============================================================

const Th = ({ children, align = "left" }) => (
  <th
    className={`whitespace-nowrap px-4 py-3 text-${align} text-[10px] font-semibold text-[#7A7A7A] sm:px-5 sm:py-4 sm:text-[11px] lg:text-[12px]`}
  >
    {children}
  </th>
);

// ============================================================
// SUB-COMPONENT — COUPON MODAL (CREATE / EDIT)
// ============================================================

const CouponModal = ({ coupon, onClose, onSave }) => {
  const isEditing = Boolean(coupon?._id);

  const [formData, setFormData] = useState({
    code: coupon?.code || "",
    couponType: coupon?.couponType || "general",
    discountType: coupon?.discountType || "percentage",
    discountValue:
      coupon?.discountValue !== undefined && coupon?.discountValue !== null
        ? String(coupon.discountValue)
        : "",
    minimumOrderAmount:
      coupon?.minimumOrderAmount !== undefined &&
      coupon?.minimumOrderAmount !== null
        ? String(coupon.minimumOrderAmount)
        : "",
    maximumDiscount:
      coupon?.maximumDiscount !== null && coupon?.maximumDiscount !== undefined
        ? String(coupon.maximumDiscount)
        : "",
    expiryDate: coupon?.expiryDate
      ? new Date(coupon.expiryDate).toISOString().slice(0, 10)
      : "",
    usageLimit:
      coupon?.usageLimit !== null && coupon?.usageLimit !== undefined
        ? String(coupon.usageLimit)
        : "",
    isActive: typeof coupon?.isActive === "boolean" ? coupon.isActive : true,
    ownerEmail: coupon?.ownerEmail || "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ----------------------------------------
  // Change handler
  // ----------------------------------------

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSubmitError("");
  };

  // ----------------------------------------
  // Validation
  // ----------------------------------------

  const validate = () => {
    const e = {};

    const code = formData.code.trim().toUpperCase();

    if (!code) {
      e.code = "Coupon code is required";
    } else if (code.length < 3 || code.length > 30) {
      e.code = "Code must be between 3 and 30 characters";
    }

    if (formData.couponType === "welcome" && !formData.ownerEmail.trim()) {
      e.ownerEmail = "Welcome coupons require an owner email";
    } else if (
      formData.ownerEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail.trim())
    ) {
      e.ownerEmail = "Enter a valid email";
    }

    if (
      formData.discountType !== "percentage" &&
      formData.discountType !== "fixed"
    ) {
      e.discountType = "Select a discount type";
    }

    const dv = Number(formData.discountValue);

    if (formData.discountValue === "" || !Number.isFinite(dv) || dv <= 0) {
      e.discountValue = "Enter a positive number";
    } else if (formData.discountType === "percentage" && dv > 100) {
      e.discountValue = "Percentage cannot exceed 100";
    }

    if (formData.minimumOrderAmount !== "") {
      const mo = Number(formData.minimumOrderAmount);
      if (!Number.isFinite(mo) || mo < 0) {
        e.minimumOrderAmount = "Enter a valid amount";
      }
    }

    if (formData.maximumDiscount !== "") {
      const md = Number(formData.maximumDiscount);
      if (!Number.isFinite(md) || md < 0) {
        e.maximumDiscount = "Enter a valid amount";
      }
    }

    if (formData.usageLimit !== "") {
      const ul = Number(formData.usageLimit);
      if (!Number.isInteger(ul) || ul < 1) {
        e.usageLimit = "Enter a whole number ≥ 1";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ----------------------------------------
  // Submit
  // ----------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;
    if (!validate()) return;

    try {
      setSubmitting(true);
      setSubmitError("");

      const payload = {
        code: formData.code.trim().toUpperCase(),
        couponType: formData.couponType,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minimumOrderAmount:
          formData.minimumOrderAmount === ""
            ? 0
            : Number(formData.minimumOrderAmount),
        maximumDiscount:
          formData.maximumDiscount === ""
            ? null
            : Number(formData.maximumDiscount),
        expiryDate: formData.expiryDate
          ? new Date(formData.expiryDate).toISOString()
          : null,
        usageLimit:
          formData.usageLimit === "" ? null : Number(formData.usageLimit),
        isActive: formData.isActive,
        ownerEmail:
          formData.couponType === "welcome"
            ? formData.ownerEmail.trim().toLowerCase()
            : null,
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error("Save coupon error:", err);
      setSubmitError(err?.message || "Failed to save coupon.");
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------------------------------
  // Render
  // ----------------------------------------

  return (
    <ModalShell onClose={submitting ? null : onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#E5E5E5] bg-white p-5 sm:p-6">
        {/* Header */}

        <div className="mb-5 flex items-start justify-between gap-3 border-b border-[#E5E5E5] pb-4">
          <div>
            <h2 className="text-base font-semibold text-black sm:text-lg">
              {isEditing ? "Edit Coupon" : "Create Coupon"}
            </h2>

            <p className="mt-1 text-xs text-[#7A7A7A] sm:text-[13px]">
              {isEditing
                ? "Update the coupon details below."
                : "Fill in the details to create a new coupon."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#7A7A7A] transition-colors hover:bg-[#F5F5F5] hover:text-black disabled:opacity-40"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Form */}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code + Type */}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Coupon Code *" error={errors.code}>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. SAVE20"
                maxLength={30}
                disabled={isEditing && coupon?.redeemed}
                className={inputClass(errors.code)}
              />
            </Field>

            <Field label="Coupon Type *">
              <select
                name="couponType"
                value={formData.couponType}
                onChange={handleChange}
                disabled={isEditing && coupon?.redeemed}
                className={inputClass()}
              >
                {COUPON_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Owner email (welcome only) */}

          {formData.couponType === "welcome" && (
            <Field label="Owner Email *" error={errors.ownerEmail}>
              <input
                type="email"
                name="ownerEmail"
                value={formData.ownerEmail}
                onChange={handleChange}
                placeholder="customer@example.com"
                className={inputClass(errors.ownerEmail)}
              />
            </Field>
          )}

          {/* Discount Type + Value */}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Discount Type *">
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
                className={inputClass()}
              >
                {DISCOUNT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Discount Value *" error={errors.discountValue}>
              <input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder={
                  formData.discountType === "percentage" ? "20" : "200"
                }
                className={inputClass(errors.discountValue)}
              />
            </Field>
          </div>

          {/* Min order + Max discount */}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Minimum Order Amount (₹)"
              error={errors.minimumOrderAmount}
            >
              <input
                type="number"
                name="minimumOrderAmount"
                value={formData.minimumOrderAmount}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="500"
                className={inputClass(errors.minimumOrderAmount)}
              />
            </Field>

            <Field label="Maximum Discount (₹)" error={errors.maximumDiscount}>
              <input
                type="number"
                name="maximumDiscount"
                value={formData.maximumDiscount}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="Optional"
                className={inputClass(errors.maximumDiscount)}
              />
            </Field>
          </div>

          {/* Expiry + Usage limit */}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Expiry Date">
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className={inputClass()}
              />
            </Field>

            <Field label="Usage Limit" error={errors.usageLimit}>
              <input
                type="number"
                name="usageLimit"
                value={formData.usageLimit}
                onChange={handleChange}
                min="1"
                step="1"
                placeholder="Unlimited"
                className={inputClass(errors.usageLimit)}
              />
            </Field>
          </div>

          {/* Active toggle */}

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 cursor-pointer accent-[#DB4444]"
            />

            <div>
              <p className="text-xs font-medium text-black sm:text-[13px]">
                Active
              </p>

              <p className="mt-0.5 text-[10px] text-[#7A7A7A] sm:text-[11px]">
                Inactive coupons cannot be applied at checkout.
              </p>
            </div>
          </label>

          {/* Submit error */}

          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 sm:text-[13px]">
              {submitError}
            </div>
          )}

          {/* Footer */}

          <div className="flex flex-col-reverse gap-2 border-t border-[#E5E5E5] pt-4 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full rounded-lg border border-[#E5E5E5] bg-white px-5 py-2.5 text-xs font-medium text-black transition-colors hover:bg-[#F5F5F5] disabled:opacity-50 sm:w-auto sm:py-3 sm:text-[13px]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#c73d3d] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-3 sm:text-[13px]"
            >
              {submitting ? (
                <>
                  <FiLoader size={15} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave size={15} />
                  {isEditing ? "Update Coupon" : "Create Coupon"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
};

// ============================================================
// SUB-COMPONENT — DELETE CONFIRM MODAL
// ============================================================

const DeleteConfirmModal = ({
  coupon,
  onCancel,
  onConfirm,
  loading,
  error,
}) => (
  <ModalShell onClose={loading ? null : onCancel}>
    <div className="w-full max-w-md rounded-xl border border-[#E5E5E5] bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50">
          <FiAlertCircle size={22} className="text-red-600" />
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-semibold text-black sm:text-lg">
            Delete Coupon
          </h2>

          <p className="mt-1 text-xs leading-5 text-[#7A7A7A] sm:text-[13px] sm:leading-6">
            Are you sure you want to delete the coupon{" "}
            <strong className="text-black">{coupon.code}</strong>? This action
            cannot be undone.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 sm:text-[13px]">
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[#E5E5E5] pt-4 sm:flex-row sm:justify-end sm:gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="w-full rounded-lg border border-[#E5E5E5] bg-white px-5 py-2.5 text-xs font-medium text-black transition-colors hover:bg-[#F5F5F5] disabled:opacity-50 sm:w-auto sm:py-3 sm:text-[13px]"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-3 sm:text-[13px]"
        >
          {loading ? (
            <>
              <FiLoader size={15} className="animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <FiTrash2 size={15} />
              Delete Coupon
            </>
          )}
        </button>
      </div>
    </div>
  </ModalShell>
);

// ============================================================
// SUB-COMPONENT — MODAL SHELL (BACKDROP)
// ============================================================

const ModalShell = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
    onClick={(e) => {
      if (e.target === e.currentTarget && onClose) {
        onClose();
      }
    }}
  >
    {children}
  </div>
);

// ============================================================
// SUB-COMPONENT — FORM FIELD WRAPPER
// ============================================================

const Field = ({ label, error, children }) => (
  <div>
    <label className="mb-2 block text-[11px] font-medium text-[#555] sm:text-[12px]">
      {label}
    </label>

    {children}

    {error && (
      <p className="mt-1.5 text-[10px] text-red-500 sm:text-[11px]">{error}</p>
    )}
  </div>
);

// ============================================================
// UTILITY — INPUT CLASS
// ============================================================

function inputClass(error) {
  return `w-full rounded-lg border px-3 py-2.5 text-xs outline-none transition-all sm:px-4 sm:py-3 sm:text-[13px] ${
    error
      ? "border-red-500 focus:border-red-500"
      : "border-[#E5E5E5] focus:border-[#DB4444]"
  }`;
}

export default Coupons;
