"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiX,
} from "react-icons/fi";

const STATUS_OPTIONS = [
  {
    value: "",
    label: "All Messages",
  },
  {
    value: "new",
    label: "New",
  },
  {
    value: "read",
    label: "Read",
  },
  {
    value: "replied",
    label: "Replied",
  },
];

const STATUS_STYLES = {
  new: {
    label: "New",
    className: "bg-red-50 text-red-600 border-red-200",
  },
  read: {
    label: "Read",
    className: "bg-yellow-50 text-yellow-600 border-yellow-200",
  },
  replied: {
    label: "Replied",
    className: "bg-green-50 text-green-600 border-green-200",
  },
};

function formatDate(date) {
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
}

function StatusBadge({ status }) {
  const statusInfo = STATUS_STYLES[status] || {
    label: status || "Unknown",
    className: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium sm:text-xs ${statusInfo.className}`}
    >
      {statusInfo.label}
    </span>
  );
}

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);

  const [counts, setCounts] = useState({
    total: 0,
    new: 0,
    read: 0,
    replied: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalMessages: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [updatingId, setUpdatingId] = useState(null);

  const [error, setError] = useState("");

  // ============================================================
  // FETCH CONTACT MESSAGES
  // ============================================================

  const fetchMessages = useCallback(
    async (page = 1, showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params = new URLSearchParams();

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (status) {
          params.set("status", status);
        }

        params.set("page", page.toString());
        params.set("limit", "10");

        const response = await fetch(
          `/api/admin/contact-messages?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load contact messages.");
        }

        setMessages(result?.data?.messages || []);

        setCounts(
          result?.data?.counts || {
            total: 0,
            new: 0,
            read: 0,
            replied: 0,
          },
        );

        setPagination(
          result?.data?.pagination || {
            page: 1,
            limit: 10,
            totalMessages: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        );
      } catch (err) {
        console.error("Fetch contact messages error:", err);

        setError(err.message || "Failed to load contact messages.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, status],
  );

  useEffect(() => {
    fetchMessages(1);
  }, [fetchMessages]);

  // ============================================================
  // SEARCH
  // ============================================================

  const handleSearch = (e) => {
    e.preventDefault();

    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  // ============================================================
  // STATUS FILTER
  // ============================================================

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = () => {
    fetchMessages(pagination.page, true);
  };

  // ============================================================
  // PAGINATION
  // ============================================================

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.page) {
      return;
    }

    fetchMessages(page);
  };

  // ============================================================
  // OPEN MESSAGE
  // ============================================================

  const openMessage = async (message) => {
    /*
     * Open the modal immediately.
     *
     * This is important because even if the detail API takes some time,
     * the user can immediately see that the View button worked.
     */
    setSelectedMessage(message);
    setDetailLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/contact-messages/${message.id}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const result = await response.json();

      // Helpful during development/debugging.
      console.log("Contact message detail response:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load contact message.");
      }

      /*
       * Expected API structure:
       *
       * result.data.message
       *
       * The fallback options make the frontend a little more
       * defensive in case the API response uses another key.
       */
      const detailedMessage =
        result?.data?.message || result?.data?.contactMessage || null;

      if (!detailedMessage || typeof detailedMessage !== "object") {
        throw new Error(
          "Invalid contact message response received from the server.",
        );
      }

      setSelectedMessage(detailedMessage);

      /*
       * Automatically mark a new message as read
       * after opening it.
       */
      if (message.status === "new") {
        await updateMessageStatus(message.id, "read", false);
      }
    } catch (err) {
      console.error("Open contact message error:", err);

      /*
       * Keep the modal open so the user can see the original
       * message and the error can be displayed.
       */
      setError(err.message || "Failed to load contact message.");
    } finally {
      setDetailLoading(false);
    }
  };

  // ============================================================
  // UPDATE MESSAGE STATUS
  // ============================================================

  const updateMessageStatus = async (
    messageId,
    newStatus,
    closeModal = true,
  ) => {
    try {
      setUpdatingId(messageId);
      setError("");

      const response = await fetch(`/api/admin/contact-messages/${messageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update message status.");
      }

      const updatedMessage = result?.data?.message;

      if (!updatedMessage) {
        throw new Error(
          "Invalid response received while updating message status.",
        );
      }

      // Update the message in the table.
      setMessages((previousMessages) =>
        previousMessages.map((item) =>
          item.id === messageId
            ? {
                ...item,
                status: updatedMessage.status,
                readAt: updatedMessage.readAt,
                repliedAt: updatedMessage.repliedAt,
                updatedAt: updatedMessage.updatedAt,
              }
            : item,
        ),
      );

      /*
       * Update counters carefully.
       *
       * We first determine the previous status from the current
       * message list instead of blindly changing every counter.
       */
      setCounts((previousCounts) => {
        const nextCounts = { ...previousCounts };

        const currentMessage = messages.find((item) => item.id === messageId);

        const previousStatus = currentMessage?.status;

        if (previousStatus && previousStatus !== newStatus) {
          if (previousStatus === "new" && nextCounts.new > 0) {
            nextCounts.new -= 1;
          }

          if (previousStatus === "read" && nextCounts.read > 0) {
            nextCounts.read -= 1;
          }

          if (previousStatus === "replied" && nextCounts.replied > 0) {
            nextCounts.replied -= 1;
          }

          if (newStatus === "new") {
            nextCounts.new += 1;
          }

          if (newStatus === "read") {
            nextCounts.read += 1;
          }

          if (newStatus === "replied") {
            nextCounts.replied += 1;
          }
        }

        return nextCounts;
      });

      // Update currently opened message.
      setSelectedMessage((previousMessage) => {
        if (!previousMessage || previousMessage.id !== messageId) {
          return previousMessage;
        }

        return {
          ...previousMessage,
          status: updatedMessage.status,
          readAt: updatedMessage.readAt,
          repliedAt: updatedMessage.repliedAt,
          updatedAt: updatedMessage.updatedAt,
        };
      });

      if (closeModal) {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error("Update contact message status error:", err);

      setError(err.message || "Failed to update message status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ============================================================
  // PAGE NUMBERS
  // ============================================================

  const getPageNumbers = () => {
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (currentPage >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeModal = () => {
    if (detailLoading || updatingId) {
      return;
    }

    setSelectedMessage(null);
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black sm:text-2xl">
            Contact Messages
          </h1>

          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            View and manage messages received from customers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          <FiRefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-5 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 sm:text-sm"
          role="alert"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => fetchMessages(pagination.page, true)}
            className="shrink-0 cursor-pointer font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 sm:text-sm">Total</p>

            <FiMessageSquare size={17} className="text-gray-400" />
          </div>

          <p className="mt-2 text-xl font-semibold text-black sm:text-2xl">
            {counts.total}
          </p>
        </div>

        {/* New */}
        <div className="rounded-lg border border-red-100 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-red-600 sm:text-sm">New</p>

            <FiClock size={17} className="text-red-400" />
          </div>

          <p className="mt-2 text-xl font-semibold text-red-600 sm:text-2xl">
            {counts.new}
          </p>
        </div>

        {/* Read */}
        <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-yellow-600 sm:text-sm">Read</p>

            <FiCheck size={17} className="text-yellow-500" />
          </div>

          <p className="mt-2 text-xl font-semibold text-yellow-600 sm:text-2xl">
            {counts.read}
          </p>
        </div>

        {/* Replied */}
        <div className="rounded-lg border border-green-100 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-green-600 sm:text-sm">Replied</p>

            <FiCheck size={17} className="text-green-500" />
          </div>

          <p className="mt-2 text-xl font-semibold text-green-600 sm:text-2xl">
            {counts.replied}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex w-full max-w-xl">
            <div className="relative flex-1">
              <FiSearch
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name, email, phone or message..."
                className="h-10 w-full rounded-l-md border border-gray-200 bg-white pl-10 pr-3 text-xs text-black outline-none transition focus:border-black sm:text-sm"
              />
            </div>

            <button
              type="submit"
              className="h-10 cursor-pointer rounded-r-md bg-black px-4 text-xs font-medium text-white transition hover:bg-[#DB4444] sm:px-5 sm:text-sm"
            >
              Search
            </button>
          </form>

          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value || "all"}
                type="button"
                onClick={() => handleStatusChange(option.value)}
                className={`cursor-pointer rounded-md border px-3 py-2 text-xs font-medium transition sm:text-sm ${
                  status === option.value
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-black hover:text-black"
                }`}
              >
                {option.label}
              </button>
            ))}

            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="cursor-pointer px-2 text-xs text-gray-500 underline hover:text-black"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="flex min-h-75 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <FiRefreshCw size={18} className="animate-spin" />
              Loading messages...
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-75 flex-col items-center justify-center px-5 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <FiMessageSquare size={24} className="text-gray-400" />
            </div>

            <h3 className="text-sm font-semibold text-black sm:text-base">
              No contact messages found
            </h3>

            <p className="mt-1 max-w-md text-xs text-gray-500 sm:text-sm">
              {search || status
                ? "Try changing your search or filter."
                : "Customer messages submitted through the Contact Us form will appear here."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-212.5">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600">
                      Customer
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600">
                      Contact
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600">
                      Message
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600">
                      Date
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {messages.map((message) => (
                    <tr
                      key={message.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                            <FiUser size={16} className="text-gray-500" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-black">
                              {message.name}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-gray-500">
                              {message.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <a
                            href={`mailto:${message.email}`}
                            className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#DB4444]"
                          >
                            <FiMail size={14} />

                            {message.email}
                          </a>

                          <a
                            href={`tel:${message.phone}`}
                            className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#DB4444]"
                          >
                            <FiPhone size={14} />

                            {message.phone}
                          </a>
                        </div>
                      </td>

                      <td className="max-w-65 px-5 py-4">
                        <p className="line-clamp-2 text-xs leading-5 text-gray-600">
                          {message.message}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={message.status} />
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500">
                        {formatDate(message.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openMessage(message)}
                          className="cursor-pointer rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-black hover:text-black"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-gray-100 md:hidden">
              {messages.map((message) => (
                <div key={message.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <FiUser size={17} className="text-gray-500" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-black">
                          {message.name}
                        </p>

                        <p className="truncate text-xs text-gray-500">
                          {message.email}
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={message.status} />
                  </div>

                  <p className="mt-3 line-clamp-3 text-xs leading-5 text-gray-600">
                    {message.message}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-gray-400">
                      {formatDate(message.createdAt)}
                    </span>

                    <button
                      type="button"
                      onClick={() => openMessage(message)}
                      className="cursor-pointer rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-black hover:text-black"
                    >
                      View Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && messages.length > 0 && pagination.totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronLeft size={15} />
              </button>

              {getPageNumbers().map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => handlePageChange(pageNumber)}
                  className={`flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border px-2 text-xs transition ${
                    pagination.page === pageNumber
                      ? "border-black bg-black text-white"
                      : "border-gray-200 text-gray-600 hover:border-black hover:text-black"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          MESSAGE DETAIL MODAL
          ============================================================ */}

      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-black sm:text-lg">
                    Contact Message
                  </h2>

                  <StatusBadge status={selectedMessage.status} />
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  Received on {formatDate(selectedMessage.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={detailLoading || updatingId}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[calc(90vh-150px)] overflow-y-auto px-5 py-5 sm:px-6">
              {detailLoading ? (
                <div className="flex min-h-62.5 items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-sm text-gray-500">
                    <FiRefreshCw size={20} className="animate-spin" />

                    <span>Loading message details...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Customer */}
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Customer Information
                    </h3>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Name */}
                      <div className="rounded-md border border-gray-200 p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
                          <FiUser size={14} />
                          Name
                        </div>

                        <p className="text-sm font-medium text-black">
                          {selectedMessage.name || "-"}
                        </p>
                      </div>

                      {/* Email */}
                      <div className="rounded-md border border-gray-200 p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
                          <FiMail size={14} />
                          Email
                        </div>

                        {selectedMessage.email ? (
                          <a
                            href={`mailto:${selectedMessage.email}`}
                            className="break-all text-sm font-medium text-black hover:text-[#DB4444]"
                          >
                            {selectedMessage.email}
                          </a>
                        ) : (
                          <p className="text-sm font-medium text-black">-</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="rounded-md border border-gray-200 p-3 sm:col-span-2">
                        <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
                          <FiPhone size={14} />
                          Phone
                        </div>

                        {selectedMessage.phone ? (
                          <a
                            href={`tel:${selectedMessage.phone}`}
                            className="text-sm font-medium text-black hover:text-[#DB4444]"
                          >
                            {selectedMessage.phone}
                          </a>
                        ) : (
                          <p className="text-sm font-medium text-black">-</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Message
                    </h3>

                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                      <p className="wrap-break-words whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {selectedMessage.message || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status Information
                    </h3>

                    <div className="space-y-2 text-xs text-gray-500">
                      {selectedMessage.readAt && (
                        <p>
                          Read:{" "}
                          <span className="text-gray-700">
                            {formatDate(selectedMessage.readAt)}
                          </span>
                        </p>
                      )}

                      {selectedMessage.repliedAt && (
                        <p>
                          Replied:{" "}
                          <span className="text-gray-700">
                            {formatDate(selectedMessage.repliedAt)}
                          </span>
                        </p>
                      )}

                      {!selectedMessage.readAt &&
                        !selectedMessage.repliedAt && (
                          <p className="text-gray-400">
                            No status activity yet.
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!detailLoading && (
              <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                {/* Close */}
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={updatingId}
                  className="w-full cursor-pointer rounded-md border border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:text-sm"
                >
                  Close
                </button>

                {/* Actions */}
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  {selectedMessage.status !== "read" &&
                    selectedMessage.status !== "replied" && (
                      <button
                        type="button"
                        disabled={updatingId === selectedMessage.id}
                        onClick={() =>
                          updateMessageStatus(selectedMessage.id, "read")
                        }
                        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:text-sm"
                      >
                        <FiCheck size={15} />

                        {updatingId === selectedMessage.id
                          ? "Updating..."
                          : "Mark as Read"}
                      </button>
                    )}

                  {selectedMessage.status !== "replied" && (
                    <button
                      type="button"
                      disabled={updatingId === selectedMessage.id}
                      onClick={() =>
                        updateMessageStatus(selectedMessage.id, "replied")
                      }
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#DB4444] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:text-sm"
                    >
                      <FiMail size={15} />

                      {updatingId === selectedMessage.id
                        ? "Updating..."
                        : "Mark as Replied"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
