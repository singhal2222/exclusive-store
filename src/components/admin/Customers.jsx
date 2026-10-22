"use client";

import React, { useEffect, useState } from "react";

import {
  FiSearch,
  FiMail,
  FiPhone,
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

const Customers = () => {
  // ============================================================
  // STATES
  // ============================================================

  const [customers, setCustomers] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  // ============================================================
  // FETCH CUSTOMERS
  // ============================================================

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      // --------------------------------------------------------
      // BUILD QUERY
      // --------------------------------------------------------

      const params = new URLSearchParams();

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      params.set("page", String(currentPage));

      params.set("limit", "12");

      // --------------------------------------------------------
      // API REQUEST
      // --------------------------------------------------------

      const response = await fetch(
        `/api/admin/customers?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      const data = await response.json();

      // --------------------------------------------------------
      // API ERROR
      // --------------------------------------------------------

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch customers.");
      }

      // --------------------------------------------------------
      // SAVE DATA
      // --------------------------------------------------------

      setCustomers(Array.isArray(data?.customers) ? data.customers : []);

      setPagination(
        data?.pagination || {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 1,
        },
      );
    } catch (error) {
      console.error("Fetch customers error:", error);

      setError(
        error?.message || "Something went wrong while loading customers.",
      );

      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FETCH WHEN SEARCH/PAGE CHANGES
  // ============================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm, currentPage]);

  // ============================================================
  // SEARCH
  // ============================================================

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatJoinedDate = (date) => {
    if (!date) {
      return "—";
    }

    const formattedDate = new Date(date);

    if (Number.isNaN(formattedDate.getTime())) {
      return "—";
    }

    return formattedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // USER INITIAL
  // ============================================================

  const getInitial = (name) => {
    return name?.charAt(0)?.toUpperCase() || "U";
  };

  // ============================================================
  // PREVIOUS PAGE
  // ============================================================

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((previousPage) => previousPage - 1);
    }
  };

  // ============================================================
  // NEXT PAGE
  // ============================================================

  const handleNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage((previousPage) => previousPage + 1);
    }
  };

  // ============================================================
  // LOADING UI
  // ============================================================

  if (loading) {
    return (
      <div className="font-poppins">
        {/* Header */}

        <div className="mb-5 sm:mb-8">
          <h1 className="mb-1.5 text-2xl font-semibold tracking-[2%] text-black sm:mb-2 sm:text-3xl lg:text-[36px]">
            Customers
          </h1>

          <p className="text-xs text-[#7A7A7A] sm:text-sm md:text-[15px] lg:text-[16px]">
            View and manage your customer base
          </p>
        </div>

        {/* Search Skeleton */}

        <div className="mb-4 rounded-xl border border-[#E5E5E5] bg-white p-4 sm:mb-6 sm:p-5">
          <div className="h-10 animate-pulse rounded-lg bg-[#F5F5F5] sm:h-12" />
        </div>

        {/* Customer Skeletons */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5 lg:p-6"
            >
              <div className="mb-4 flex items-center gap-3 sm:mb-5 sm:gap-4">
                <div className="h-12 w-12 shrink-0 rounded-full bg-[#F5F5F5] sm:h-14 sm:w-14 lg:h-16 lg:w-16" />

                <div className="min-w-0 flex-1">
                  <div className="mb-2 h-4 w-24 rounded bg-gray-200 sm:h-5 sm:w-32" />

                  <div className="h-3.5 w-20 rounded bg-gray-200 sm:h-4 sm:w-24" />
                </div>
              </div>

              <div className="mb-4 space-y-3 sm:mb-5">
                <div className="h-3.5 w-full rounded bg-gray-200 sm:h-4" />

                <div className="h-3.5 w-4/5 rounded bg-gray-200 sm:h-4" />

                <div className="h-3.5 w-3/5 rounded bg-gray-200 sm:h-4" />
              </div>

              <div className="border-t border-[#E5E5E5] pt-3.5 sm:pt-4">
                <div className="flex justify-between">
                  <div className="h-8 w-14 rounded bg-gray-200 sm:h-10 sm:w-16" />

                  <div className="h-8 w-16 rounded bg-gray-200 sm:h-10 sm:w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="font-poppins">
      {/* ====================================================== */}
      {/* PAGE HEADER */}
      {/* ====================================================== */}

      <div className="mb-5 sm:mb-8">
        <h1 className="mb-1.5 text-2xl font-semibold tracking-[2%] text-black sm:mb-2 sm:text-3xl lg:text-[36px]">
          Customers
        </h1>

        <p className="text-xs text-[#7A7A7A] sm:text-sm md:text-[15px] lg:text-[16px]">
          View and manage your customer base ({pagination.total} total)
        </p>
      </div>

      {/* ====================================================== */}
      {/* SEARCH */}
      {/* ====================================================== */}

      <div className="mb-4 rounded-xl border border-[#E5E5E5] bg-white p-3.5 sm:mb-6 sm:p-5">
        <div className="relative">
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
            placeholder="Search customers by name, email or phone..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full rounded-lg bg-[#F5F5F5] py-2.5 pl-10 pr-3 text-xs outline-none placeholder:text-[#7A7A7A] focus:ring-2 focus:ring-[#DB4444]/30 sm:py-3 sm:pl-12 sm:pr-4 sm:text-[14px] lg:text-[15px]"
          />
        </div>
      </div>

      {/* ====================================================== */}
      {/* ERROR */}
      {/* ====================================================== */}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-600 sm:mb-6 sm:px-5 sm:py-4 sm:text-sm">
          {error}
        </div>
      )}

      {/* ====================================================== */}
      {/* EMPTY STATE */}
      {/* ====================================================== */}

      {!error && customers.length === 0 && (
        <div className="rounded-xl border border-[#E5E5E5] bg-white px-4 py-12 text-center sm:px-5 sm:py-16">
          <p className="text-xs text-[#7A7A7A] sm:text-[14px]">
            {searchTerm.trim()
              ? "No customers found for your search."
              : "No customers found."}
          </p>
        </div>
      )}

      {/* ====================================================== */}
      {/* CUSTOMER CARDS */}
      {/* ====================================================== */}

      {customers.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="rounded-xl border border-[#E5E5E5] bg-white p-4 transition-shadow hover:shadow-lg sm:p-5 lg:p-6"
            >
              {/* ========================================== */}
              {/* CUSTOMER HEADER */}
              {/* ========================================== */}

              <div className="mb-4 flex items-center gap-3 sm:mb-5 sm:gap-4">
                {/* Initial */}

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#DB4444] text-base font-semibold text-white sm:h-14 sm:w-14 sm:text-lg lg:h-16 lg:w-16 lg:text-[22px]">
                  {getInitial(customer.name)}
                </div>

                {/* Name + Joined */}

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-black sm:text-base lg:text-[18px]">
                    {customer.name}
                  </h3>

                  <p className="text-[11px] text-[#7A7A7A] sm:text-[12px] lg:text-[13px]">
                    Joined {formatJoinedDate(customer.joined)}
                  </p>
                </div>
              </div>

              {/* ========================================== */}
              {/* CUSTOMER CONTACT INFO */}
              {/* ========================================== */}

              <div className="mb-4 space-y-2.5 sm:mb-5 sm:space-y-3">
                {/* Email */}

                <div className="flex items-center gap-2.5 text-xs text-[#7A7A7A] sm:gap-3 sm:text-[13px] lg:text-[14px]">
                  <FiMail size={15} className="shrink-0 sm:hidden" />
                  <FiMail size={16} className="hidden shrink-0 sm:block" />

                  <span className="truncate">{customer.email || "—"}</span>
                </div>

                {/* Phone */}

                <div className="flex items-center gap-2.5 text-xs text-[#7A7A7A] sm:gap-3 sm:text-[13px] lg:text-[14px]">
                  <FiPhone size={15} className="shrink-0 sm:hidden" />
                  <FiPhone size={16} className="hidden shrink-0 sm:block" />

                  <span className="truncate">{customer.phone || "—"}</span>
                </div>

                {/* Location */}

                <div className="flex items-center gap-2.5 text-xs text-[#7A7A7A] sm:gap-3 sm:text-[13px] lg:text-[14px]">
                  <FiMapPin size={15} className="shrink-0 sm:hidden" />
                  <FiMapPin size={16} className="hidden shrink-0 sm:block" />

                  <span className="truncate">{customer.location || "—"}</span>
                </div>
              </div>

              {/* ========================================== */}
              {/* CUSTOMER SUMMARY */}
              {/* ========================================== */}

              <div className="flex items-center justify-between gap-3 border-t border-[#E5E5E5] pt-3.5 sm:pt-4">
                {/* Orders */}

                <div>
                  <p className="text-[11px] text-[#7A7A7A] sm:text-[12px] lg:text-[13px]">
                    Orders
                  </p>

                  <p className="text-sm font-semibold text-black sm:text-base lg:text-[18px]">
                    {customer.orders ?? "—"}
                  </p>
                </div>

                {/* Total Spent */}

                <div className="text-right">
                  <p className="text-[11px] text-[#7A7A7A] sm:text-[12px] lg:text-[13px]">
                    Total Spent
                  </p>

                  <p className="text-sm font-semibold text-[#DB4444] sm:text-base lg:text-[18px]">
                    {customer.spent ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====================================================== */}
      {/* PAGINATION */}
      {/* ====================================================== */}

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#E5E5E5] bg-white px-4 py-3.5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
        <p className="text-xs text-[#7A7A7A] sm:text-[13px] lg:text-[14px]">
          {pagination.total === 0
            ? "Showing 0 customers"
            : `Showing ${
                (pagination.page - 1) * pagination.limit + 1
              }-${Math.min(
                pagination.page * pagination.limit,
                pagination.total,
              )} of ${pagination.total} customers`}
        </p>

        <div className="flex items-center justify-center gap-2 sm:justify-end">
          {/* Previous */}

          <button
            type="button"
            onClick={handlePreviousPage}
            disabled={currentPage <= 1}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E5E5] transition-colors hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
            aria-label="Previous page"
          >
            <FiChevronLeft size={16} className="sm:hidden" />
            <FiChevronLeft size={18} className="hidden sm:block" />
          </button>

          {/* Current Page */}

          <button
            type="button"
            className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#DB4444] px-3 text-xs font-medium text-white sm:h-10 sm:min-w-10 sm:text-sm"
          >
            {currentPage}
          </button>

          {/* Next */}

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= pagination.totalPages}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E5E5] transition-colors hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
            aria-label="Next page"
          >
            <FiChevronRight size={16} className="sm:hidden" />
            <FiChevronRight size={18} className="hidden sm:block" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Customers;
