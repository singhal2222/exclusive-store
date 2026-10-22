// FILE LOCATION: src/components/admin/Reviews.jsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  FiSearch,
  FiFilter,
  FiEye,
  FiTrash2,
  FiX,
  FiCheck,
  FiXCircle,
  FiLoader,
  FiStar,
  FiAlertCircle,
  FiClock,
  FiThumbsUp,
  FiChevronLeft,
  FiChevronRight,
  FiSave,
} from "react-icons/fi";
import { FaStar, FaRegStar } from "react-icons/fa";

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

const STATUS_FILTERS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const RATING_FILTERS = [
  { value: "", label: "All Ratings" },
  { value: "5", label: "5 Stars" },
  { value: "4", label: "4 Stars" },
  { value: "3", label: "3 Stars" },
  { value: "2", label: "2 Stars" },
  { value: "1", label: "1 Star" },
];

const VERIFIED_FILTERS = [
  { value: "", label: "All Reviews" },
  { value: "true", label: "Verified Only" },
  { value: "false", label: "Unverified Only" },
];

// ============================================================
// HELPERS
// ============================================================

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

const getStatusBadge = (status) => {
  switch (status) {
    case "approved":
      return {
        label: "Approved",
        classes: "bg-green-100 text-green-700",
      };

    case "rejected":
      return {
        label: "Rejected",
        classes: "bg-red-100 text-red-600",
      };

    case "pending":
    default:
      return {
        label: "Pending",
        classes: "bg-yellow-100 text-yellow-700",
      };
  }
};

// ============================================================
// COMPONENT
// ============================================================

const Reviews = () => {
  // ----------------------------------------
  // Data state
  // ----------------------------------------

  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ----------------------------------------
  // Filters
  // ----------------------------------------

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ----------------------------------------
  // Modal state
  // ----------------------------------------

  const [selectedReview, setSelectedReview] = useState(null);

  // ----------------------------------------
  // Delete state
  // ----------------------------------------

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ----------------------------------------
  // Inline status update
  // ----------------------------------------

  const [updatingId, setUpdatingId] = useState(null);

  // ----------------------------------------
  // Abort controller
  // ----------------------------------------

  const listAbortRef = useRef(null);

  // ==========================================================
  // FETCH REVIEWS
  // ==========================================================

  const fetchReviews = useCallback(async () => {
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
      if (ratingFilter) params.set("rating", ratingFilter);
      if (verifiedFilter) params.set("verified", verifiedFilter);

      params.set("page", String(currentPage));
      params.set("limit", String(PER_PAGE));

      const response = await fetch(`/api/admin/reviews?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch reviews.");
      }

      setReviews(Array.isArray(data?.reviews) ? data.reviews : []);

      setPagination(
        data?.pagination || {
          page: currentPage,
          limit: PER_PAGE,
          total: 0,
          totalPages: 0,
        },
      );

      setStats(
        data?.stats || {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        },
      );
    } catch (err) {
      if (err?.name === "AbortError") return;

      console.error("Fetch reviews error:", err);
      setError(err?.message || "Failed to fetch reviews.");
      setReviews([]);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [searchTerm, statusFilter, ratingFilter, verifiedFilter, currentPage]);

  useEffect(() => {
    const timer = setTimeout(fetchReviews, 300);
    return () => clearTimeout(timer);
  }, [fetchReviews]);

  // ==========================================================
  // HANDLERS
  // ==========================================================

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleRatingChange = (e) => {
    setRatingFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleVerifiedChange = (e) => {
    setVerifiedFilter(e.target.value);
    setCurrentPage(1);
  };

  // ==========================================================
  // UPDATE STATUS (INLINE)
  // ==========================================================

  const handleUpdateStatus = async (review, newStatus) => {
    if (updatingId) return;

    const previous = [...reviews];

    // Optimistic update
    setReviews((list) =>
      list.map((r) =>
        r._id === review._id
          ? {
              ...r,
              status: newStatus,
            }
          : r,
      ),
    );

    setUpdatingId(review._id);

    try {
      const response = await fetch(`/api/admin/reviews/${review._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update review.");
      }

      // Replace with server response
      setReviews((list) =>
        list.map((r) => (r._id === review._id ? data.review : r)),
      );

      // Update stats counters
      setStats((prev) => {
        const next = { ...prev };

        if (review.status !== newStatus) {
          next[review.status] = Math.max(0, (next[review.status] || 0) - 1);
          next[newStatus] = (next[newStatus] || 0) + 1;
        }

        return next;
      });

      // If a modal is open for this review, update it
      if (selectedReview?._id === review._id) {
        setSelectedReview(data.review);
      }
    } catch (err) {
      console.error("Update status error:", err);
      setReviews(previous);
      alert(err?.message || "Failed to update review.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleOpenDelete = (review) => {
    setDeleteTarget(review);
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
      const response = await fetch(`/api/admin/reviews/${deleteTarget._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete review.");
      }

      // Remove locally
      setReviews((list) => list.filter((r) => r._id !== deleteTarget._id));

      // Update stats
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        [deleteTarget.status]: Math.max(
          0,
          (prev[deleteTarget.status] || 0) - 1,
        ),
      }));

      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));

      setDeleteTarget(null);

      // If the modal is open for the deleted review, close it
      if (selectedReview?._id === deleteTarget._id) {
        setSelectedReview(null);
      }
    } catch (err) {
      console.error("Delete review error:", err);
      setDeleteError(err?.message || "Failed to delete review.");
    } finally {
      setDeleting(false);
    }
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

      <div className="mb-5 flex flex-col gap-2 sm:mb-6">
        <h1 className="text-xl font-semibold tracking-[0.02em] text-black sm:text-2xl lg:text-[28px] xl:text-[32px]">
          Reviews
        </h1>

        <p className="text-xs text-[#7A7A7A] sm:text-[13px] lg:text-[15px]">
          Moderate customer reviews before they appear on the storefront.
        </p>
      </div>

      {/* ================================================== */}
      {/* STATS */}
      {/* ================================================== */}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Reviews"
          value={stats.total}
          icon={FiThumbsUp}
          color="#DB4444"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={FiClock}
          color="#E67E22"
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={FiCheck}
          color="#27AE60"
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon={FiXCircle}
          color="#DC2626"
        />
      </div>

      {/* ================================================== */}
      {/* FILTERS */}
      {/* ================================================== */}

      <div className="mb-4 rounded-xl border border-[#E5E5E5] bg-white p-3.5 sm:mb-5 sm:p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* Search */}

          <div className="relative lg:col-span-1">
            <FiSearch
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7A7A]"
            />

            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full rounded-lg bg-[#F5F5F5] py-2.5 pl-10 pr-3 text-xs outline-none transition-all placeholder:text-[#7A7A7A] focus:ring-2 focus:ring-[#DB4444]/20 sm:text-[13px]"
            />
          </div>

          {/* Status */}

          <div className="flex items-center gap-2 rounded-lg bg-[#F5F5F5] px-3 py-2.5 sm:px-4">
            <FiFilter size={15} className="shrink-0 text-[#7A7A7A]" />

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

          {/* Rating */}

          <div className="flex items-center gap-2 rounded-lg bg-[#F5F5F5] px-3 py-2.5 sm:px-4">
            <FiStar size={15} className="shrink-0 text-[#7A7A7A]" />

            <select
              value={ratingFilter}
              onChange={handleRatingChange}
              className="w-full cursor-pointer bg-transparent text-xs outline-none sm:text-[13px]"
            >
              {RATING_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Verified */}

          <div className="flex items-center gap-2 rounded-lg bg-[#F5F5F5] px-3 py-2.5 sm:px-4">
            <FiCheck size={15} className="shrink-0 text-[#7A7A7A]" />

            <select
              value={verifiedFilter}
              onChange={handleVerifiedChange}
              className="w-full cursor-pointer bg-transparent text-xs outline-none sm:text-[13px]"
            >
              {VERIFIED_FILTERS.map((option) => (
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
          <table className="w-full min-w-250">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <Th>Product</Th>
                <Th>Customer</Th>
                <Th>Rating</Th>
                <Th>Review</Th>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>

            <tbody>
              {/* Loading */}

              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-[#7A7A7A]"
                  >
                    Loading reviews...
                  </td>
                </tr>
              )}

              {/* Empty */}

              {!loading && reviews.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <FiStar size={28} className="mx-auto mb-3 text-[#B5B5B5]" />

                    <p className="text-sm font-medium text-black">
                      No reviews found
                    </p>

                    <p className="mt-1 text-xs text-[#7A7A7A]">
                      {searchTerm ||
                      statusFilter ||
                      ratingFilter ||
                      verifiedFilter
                        ? "Try adjusting your filters."
                        : "Reviews from customers will appear here."}
                    </p>
                  </td>
                </tr>
              )}

              {/* Rows */}

              {!loading &&
                reviews.map((review) => {
                  const statusInfo = getStatusBadge(review.status);
                  const isUpdating = updatingId === review._id;

                  return (
                    <tr
                      key={review._id}
                      className="border-b border-[#F5F5F5] transition-colors hover:bg-[#FAFAFA]"
                    >
                      {/* Product */}

                      <td className="px-4 py-3 sm:px-5 sm:py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F5F5F5]">
                            {review.product?.image ? (
                              <img
                                src={review.product.image}
                                alt={review.product.name}
                                className="max-h-full max-w-full object-contain p-1"
                              />
                            ) : (
                              <FiStar size={18} className="text-[#B5B5B5]" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-black sm:text-[13px]">
                              {review.product?.name || "Unknown Product"}
                            </p>

                            {review.verifiedPurchase && (
                              <p className="mt-0.5 text-[10px] font-medium text-green-700 sm:text-[11px]">
                                ✓ Verified Purchase
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Customer */}

                      <td className="px-4 py-3 sm:px-5 sm:py-4">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-black sm:text-[13px]">
                            {review.user?.name || "Anonymous"}
                          </p>

                          {review.user?.email && (
                            <p className="truncate text-[10px] text-[#7A7A7A] sm:text-[11px]">
                              {review.user.email}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Rating */}

                      <td className="whitespace-nowrap px-4 py-3 sm:px-5 sm:py-4">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, index) =>
                            index < review.rating ? (
                              <FaStar
                                key={index}
                                size={13}
                                className="text-[#FFAD33]"
                              />
                            ) : (
                              <FaRegStar
                                key={index}
                                size={13}
                                className="text-gray-300"
                              />
                            ),
                          )}
                        </div>

                        <p className="mt-1 text-[10px] text-[#7A7A7A] sm:text-[11px]">
                          {review.rating}/5
                        </p>
                      </td>

                      {/* Review */}

                      <td className="max-w-xs px-4 py-3 sm:px-5 sm:py-4">
                        {review.title && (
                          <p className="mb-1 truncate text-xs font-medium text-black sm:text-[13px]">
                            {review.title}
                          </p>
                        )}

                        <p className="line-clamp-2 text-xs text-[#7A7A7A] sm:text-[12px]">
                          {review.comment}
                        </p>
                      </td>

                      {/* Status */}

                      <td className="px-4 py-3 sm:px-5 sm:py-4">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium sm:px-2.5 sm:py-1 sm:text-[11px] ${statusInfo.classes}`}
                        >
                          {isUpdating ? "Updating..." : statusInfo.label}
                        </span>
                      </td>

                      {/* Date */}

                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#7A7A7A] sm:px-5 sm:py-4 sm:text-[12px]">
                        {formatDate(review.createdAt)}
                      </td>

                      {/* Actions */}

                      <td className="px-4 py-3 sm:px-5 sm:py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve */}

                          {review.status !== "approved" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStatus(review, "approved")
                              }
                              disabled={isUpdating}
                              className="flex h-8 w-8 items-center justify-center rounded-md bg-green-50 text-green-600 transition-colors hover:bg-green-100 disabled:opacity-50 sm:h-9 sm:w-9"
                              aria-label="Approve review"
                              title="Approve"
                            >
                              <FiCheck size={15} />
                            </button>
                          )}

                          {/* Reject */}

                          {review.status !== "rejected" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStatus(review, "rejected")
                              }
                              disabled={isUpdating}
                              className="flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 sm:h-9 sm:w-9"
                              aria-label="Reject review"
                              title="Reject"
                            >
                              <FiXCircle size={15} />
                            </button>
                          )}

                          {/* View */}

                          <button
                            type="button"
                            onClick={() => setSelectedReview(review)}
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 sm:h-9 sm:w-9"
                            aria-label="View review details"
                            title="View details"
                          >
                            <FiEye size={15} />
                          </button>

                          {/* Delete */}

                          <button
                            type="button"
                            onClick={() => handleOpenDelete(review)}
                            disabled={isUpdating}
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 sm:h-9 sm:w-9"
                            aria-label="Delete review"
                            title="Delete"
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

      {selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onUpdateStatus={handleUpdateStatus}
          onDelete={() => handleOpenDelete(selectedReview)}
          updatingId={updatingId}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          review={deleteTarget}
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
// SUB-COMPONENT — REVIEW DETAIL MODAL
// ============================================================

const ReviewDetailModal = ({
  review,
  onClose,
  onUpdateStatus,
  onDelete,
  updatingId,
}) => {
  const [adminNote, setAdminNote] = useState(review.adminNote || "");
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [noteSuccess, setNoteSuccess] = useState("");

  const statusInfo = getStatusBadge(review.status);
  const isUpdating = updatingId === review._id;

  const handleSaveNote = async () => {
    if (savingNote) return;

    try {
      setSavingNote(true);
      setNoteError("");
      setNoteSuccess("");

      const response = await fetch(`/api/admin/reviews/${review._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: adminNote.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to save note.");
      }

      setNoteSuccess("Admin note saved.");
      setTimeout(() => setNoteSuccess(""), 2000);
    } catch (err) {
      console.error("Save admin note error:", err);
      setNoteError(err?.message || "Failed to save note.");
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#E5E5E5] bg-white p-5 sm:p-6">
        {/* Header */}

        <div className="mb-5 flex items-start justify-between gap-3 border-b border-[#E5E5E5] pb-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-black sm:text-lg">
              Review Details
            </h2>

            <p className="mt-1 text-xs text-[#7A7A7A] sm:text-[13px]">
              Submitted on {formatDateTime(review.createdAt)}
              {review.editedAt && ` · Edited on ${formatDate(review.editedAt)}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#7A7A7A] transition-colors hover:bg-[#F5F5F5] hover:text-black"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Status + rating + verified */}

        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-[#F5F5F5] p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#7A7A7A] sm:text-[11px]">
              Status
            </p>

            <span
              className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${statusInfo.classes}`}
            >
              {statusInfo.label}
            </span>
          </div>

          <div className="rounded-lg bg-[#F5F5F5] p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#7A7A7A] sm:text-[11px]">
              Rating
            </p>

            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) =>
                index < review.rating ? (
                  <FaStar key={index} size={16} className="text-[#FFAD33]" />
                ) : (
                  <FaRegStar key={index} size={16} className="text-gray-300" />
                ),
              )}

              <span className="ml-2 text-sm font-medium text-black">
                {review.rating}/5
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-[#F5F5F5] p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#7A7A7A] sm:text-[11px]">
              Verified Purchase
            </p>

            <p
              className={`mt-2 text-sm font-semibold ${
                review.verifiedPurchase ? "text-green-600" : "text-gray-500"
              }`}
            >
              {review.verifiedPurchase ? "Yes" : "No"}
            </p>
          </div>
        </div>

        {/* Product + customer */}

        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[#E5E5E5] p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#7A7A7A] sm:text-[11px]">
              Product
            </p>

            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F5F5F5]">
                {review.product?.image ? (
                  <img
                    src={review.product.image}
                    alt={review.product.name}
                    className="max-h-full max-w-full object-contain p-1"
                  />
                ) : (
                  <FiStar size={18} className="text-[#B5B5B5]" />
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-black sm:text-[13px]">
                  {review.product?.name || "Unknown Product"}
                </p>

                {review.product?.slug && (
                  <a
                    href={`/product/${review.product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#DB4444] hover:underline sm:text-[11px]"
                  >
                    View on store →
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#E5E5E5] p-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#7A7A7A] sm:text-[11px]">
              Customer
            </p>

            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DB4444] text-sm font-semibold text-white">
                {review.user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-black sm:text-[13px]">
                  {review.user?.name || "Anonymous"}
                </p>

                {review.user?.email && (
                  <p className="truncate text-[10px] text-[#7A7A7A] sm:text-[11px]">
                    {review.user.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Review content */}

        <div className="mb-5 rounded-lg border border-[#E5E5E5] p-4">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#7A7A7A] sm:text-[11px]">
            Review Content
          </p>

          {review.title && (
            <h3 className="mt-2 text-sm font-semibold text-black sm:text-base">
              {review.title}
            </h3>
          )}

          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
            {review.comment}
          </p>
        </div>

        {/* Admin note */}

        <div className="mb-5 rounded-lg border border-[#E5E5E5] p-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[#7A7A7A] sm:text-[11px]">
            Admin Note (Internal)
          </p>

          <textarea
            value={adminNote}
            onChange={(e) => {
              setAdminNote(e.target.value);
              setNoteError("");
              setNoteSuccess("");
            }}
            rows={3}
            maxLength={500}
            placeholder="Add an internal note about this review..."
            className="w-full resize-none rounded-lg border border-[#E5E5E5] px-3 py-2.5 text-xs outline-none transition focus:border-[#DB4444] sm:text-[13px]"
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[10px] text-[#999999] sm:text-[11px]">
              {adminNote.length}/500
            </p>

            <button
              type="button"
              onClick={handleSaveNote}
              disabled={savingNote}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#DB4444] px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-[#C83D3D] disabled:opacity-60 sm:px-4 sm:py-2 sm:text-xs"
            >
              {savingNote ? (
                <>
                  <FiLoader size={12} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave size={12} />
                  Save Note
                </>
              )}
            </button>
          </div>

          {noteError && (
            <p className="mt-2 text-[10px] text-red-500 sm:text-[11px]">
              {noteError}
            </p>
          )}

          {noteSuccess && (
            <p className="mt-2 text-[10px] text-green-600 sm:text-[11px]">
              {noteSuccess}
            </p>
          )}
        </div>

        {/* Action buttons */}

        <div className="flex flex-col gap-2 border-t border-[#E5E5E5] pt-4 sm:flex-row sm:justify-end sm:gap-3">
          {review.status !== "approved" && (
            <button
              type="button"
              onClick={() => onUpdateStatus(review, "approved")}
              disabled={isUpdating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-60 sm:w-auto sm:text-[13px]"
            >
              <FiCheck size={14} />
              {isUpdating ? "Updating..." : "Approve"}
            </button>
          )}

          {review.status !== "rejected" && (
            <button
              type="button"
              onClick={() => onUpdateStatus(review, "rejected")}
              disabled={isUpdating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-yellow-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-yellow-700 disabled:opacity-60 sm:w-auto sm:text-[13px]"
            >
              <FiXCircle size={14} />
              {isUpdating ? "Updating..." : "Reject"}
            </button>
          )}

          {review.status !== "pending" && (
            <button
              type="button"
              onClick={() => onUpdateStatus(review, "pending")}
              disabled={isUpdating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#E5E5E5] bg-white px-4 py-2.5 text-xs font-medium text-black transition hover:border-[#DB4444] hover:text-[#DB4444] disabled:opacity-60 sm:w-auto sm:text-[13px]"
            >
              <FiClock size={14} />
              Reset to Pending
            </button>
          )}

          <button
            type="button"
            onClick={onDelete}
            disabled={isUpdating}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-60 sm:w-auto sm:text-[13px]"
          >
            <FiTrash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SUB-COMPONENT — DELETE CONFIRM MODAL
// ============================================================

const DeleteConfirmModal = ({
  review,
  onCancel,
  onConfirm,
  loading,
  error,
}) => (
  <div
    className="fixed inset-0 z-110 flex items-center justify-center bg-black/50 p-4"
    onClick={(e) => {
      if (e.target === e.currentTarget && !loading) onCancel();
    }}
  >
    <div className="w-full max-w-md rounded-xl border border-[#E5E5E5] bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50">
          <FiAlertCircle size={22} className="text-red-600" />
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-semibold text-black sm:text-lg">
            Delete Review
          </h2>

          <p className="mt-1 text-xs leading-5 text-[#7A7A7A] sm:text-[13px] sm:leading-6">
            Are you sure you want to permanently delete this review? This action
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
              Delete Review
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

export default Reviews;
