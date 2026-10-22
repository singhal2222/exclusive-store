"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiX,
} from "react-icons/fi";

const Products = () => {
  const [products, setProducts] = useState([]);

  // Product search
  const [searchTerm, setSearchTerm] = useState("");

  // Selected category
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Show inactive products (admin-only behavior, enforced by API)
  const [showInactive, setShowInactive] = useState(true);

  // Dynamic categories
  const [categories, setCategories] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Errors
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Track which product is currently being deleted / toggled
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Inline delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Abort controller for the in-flight products request
  const productsAbortRef = useRef(null);

  // ==========================================================
  // Fetch categories
  // ==========================================================

  useEffect(() => {
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        setCategoryError("");

        const response = await fetch("/api/categories", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch categories");
        }

        setCategories(Array.isArray(data?.categories) ? data.categories : []);
      } catch (err) {
        if (err?.name === "AbortError") return;

        console.error("Fetch categories error:", err);

        setCategoryError(
          err?.message || "Something went wrong while loading categories.",
        );
        setCategories([]);
      } finally {
        if (!controller.signal.aborted) {
          setCategoriesLoading(false);
        }
      }
    };

    fetchCategories();

    return () => controller.abort();
  }, []);

  // ==========================================================
  // Fetch products (debounced + abortable)
  // ==========================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      // Cancel any previous in-flight request
      if (productsAbortRef.current) {
        productsAbortRef.current.abort();
      }

      const controller = new AbortController();
      productsAbortRef.current = controller;

      const fetchProducts = async () => {
        try {
          setLoading(true);
          setError("");

          const params = new URLSearchParams();

          if (searchTerm.trim()) {
            params.set("search", searchTerm.trim());
          }

          if (selectedCategory !== "All") {
            params.set("category", selectedCategory);
          }

          params.set("page", String(currentPage));
          params.set("limit", "10");

          if (showInactive) {
            params.set("includeInactive", "true");
          }

          const response = await fetch(`/api/products?${params.toString()}`, {
            method: "GET",
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
          });

          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(data?.message || "Failed to fetch products");
          }

          setProducts(Array.isArray(data?.products) ? data.products : []);

          setPagination(
            data?.pagination || {
              page: currentPage,
              limit: 10,
              total: 0,
              totalPages: 1,
            },
          );
        } catch (err) {
          if (err?.name === "AbortError") return;

          console.error("Fetch products error:", err);

          setError(
            err?.message || "Something went wrong while loading products.",
          );
          setProducts([]);
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      };

      fetchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, currentPage, showInactive]);

  // ==========================================================
  // Search
  // ==========================================================

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // ==========================================================
  // Category filter
  // ==========================================================

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  // ==========================================================
  // Toggle active / inactive
  // ==========================================================

  const handleToggleActive = async (product) => {
    if (togglingId) return;

    const nextIsActive = !product.isActive;

    try {
      setTogglingId(product._id);
      setError("");

      const response = await fetch(`/api/products/${product._id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: nextIsActive }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update product status");
      }

      // Optimistic update for smoother UX
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id
            ? {
                ...p,
                isActive: data?.product?.isActive ?? nextIsActive,
              }
            : p,
        ),
      );
    } catch (err) {
      console.error("Toggle product status error:", err);
      alert(err?.message || "Failed to update product status.");
    } finally {
      setTogglingId(null);
    }
  };

  // ==========================================================
  // Delete product
  // ==========================================================

  const handleDeleteConfirmed = async (id) => {
    try {
      setDeletingId(id);
      setError("");

      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      // 404 is fine — treat as already deleted
      const isSuccess = response.ok || response.status === 404;

      if (!isSuccess) {
        throw new Error(data?.message || "Failed to delete product.");
      }

      setProducts((prev) => prev.filter((product) => product._id !== id));

      setPagination((prev) => ({
        ...prev,
        total: Math.max(prev.total - 1, 0),
      }));

      setConfirmDeleteId(null);

      // If we just deleted the last item on this page, step back
      if (products.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (err) {
      console.error("Delete product error:", err);
      alert(err?.message || "Something went wrong while deleting the product.");
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================================
  // Pagination
  // ==========================================================

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // ==========================================================
  // Format price
  // ==========================================================

  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return "—";
    }

    return `$${Number(price).toFixed(2)}`;
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="font-poppins">
      {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <div className="mb-5 flex flex-col justify-between gap-4 sm:mb-6 md:mb-8 md:flex-row md:items-center">
        <div>
          <h1 className="mb-1.5 text-2xl font-semibold tracking-[2%] text-black sm:mb-2 sm:text-3xl lg:text-[36px]">
            Products
          </h1>

          <p className="text-xs text-[#7A7A7A] sm:text-sm md:text-[15px] lg:text-[16px]">
            Manage your product inventory ({pagination.total} products)
          </p>
        </div>

        <Link
          href="/admin/products/add-product"
          className="flex w-fit items-center gap-2 rounded-lg bg-[#DB4444] px-4 py-2.5 text-xs font-medium text-white shadow-lg shadow-[#DB4444]/30 transition-colors hover:bg-[#c73d3d] sm:px-5 sm:py-3 sm:text-[14px] md:px-6 md:py-3.5 md:text-[15px]"
        >
          <FiPlus size={18} className="sm:hidden" />
          <FiPlus size={20} className="hidden sm:block" />
          Add New Product
        </Link>
      </div>

      {/* ============================================== */}
      {/* FILTERS */}
      {/* ============================================== */}

      <div className="mb-4 rounded-xl border border-[#E5E5E5] bg-white p-3.5 sm:mb-6 sm:p-5">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row">
          {/* Search */}
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
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full rounded-lg bg-[#F5F5F5] py-2.5 pl-10 pr-3 text-xs outline-none placeholder:text-[#7A7A7A] transition-all focus:ring-2 focus:ring-[#DB4444]/30 sm:py-3 sm:pl-12 sm:pr-4 sm:text-[14px] lg:text-[15px]"
            />
          </div>

          {/* Category */}
          <div className="flex items-center gap-3">
            <div className="flex w-full items-center gap-2 rounded-lg bg-[#F5F5F5] px-3 py-2.5 sm:px-4 sm:py-3 md:w-auto">
              <FiFilter
                size={16}
                className="shrink-0 text-[#7A7A7A] sm:hidden"
              />
              <FiFilter
                size={18}
                className="hidden shrink-0 text-[#7A7A7A] sm:block"
              />

              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                disabled={categoriesLoading}
                className="w-full cursor-pointer bg-transparent text-xs outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:text-[14px] lg:text-[15px] md:w-auto"
              >
                <option value="All">All</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Show inactive toggle */}
          <label className="flex cursor-pointer select-none items-center gap-2 rounded-lg bg-[#F5F5F5] px-3 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px]">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => {
                setShowInactive(e.target.checked);
                setCurrentPage(1);
              }}
              className="h-4 w-4 cursor-pointer accent-[#DB4444]"
            />
            <span className="whitespace-nowrap text-black">Show inactive</span>
          </label>
        </div>

        {categoryError && (
          <p className="mt-3 text-xs text-red-500 sm:text-[13px]">
            {categoryError}
          </p>
        )}
      </div>

      {/* ============================================== */}
      {/* ERROR */}
      {/* ============================================== */}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 sm:mb-6 sm:px-4 sm:py-3">
          <p className="text-xs text-red-600 sm:text-[14px]">{error}</p>
        </div>
      )}

      {/* ============================================== */}
      {/* PRODUCTS TABLE */}
      {/* ============================================== */}

      <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-225">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[13px] lg:text-[14px]">
                  Product
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[13px] lg:text-[14px]">
                  Price
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[13px] lg:text-[14px]">
                  Original Price
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[13px] lg:text-[14px]">
                  Stock
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[13px] lg:text-[14px]">
                  Rating
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[13px] lg:text-[14px]">
                  Sale
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[13px] lg:text-[14px]">
                  Status
                </th>

                <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[13px] lg:text-[14px]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Loading */}
              {loading && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-10 text-center text-xs text-[#7A7A7A] sm:px-6 sm:py-12 sm:text-[14px]"
                  >
                    Loading products...
                  </td>
                </tr>
              )}

              {/* No Products */}
              {!loading && products.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-10 text-center text-xs text-[#7A7A7A] sm:px-6 sm:py-12 sm:text-[14px]"
                  >
                    {searchTerm || selectedCategory !== "All"
                      ? "No products found for your search or filter."
                      : "No products available."}
                  </td>
                </tr>
              )}

              {/* Products */}
              {!loading &&
                products.map((product) => {
                  const isConfirming = confirmDeleteId === product._id;
                  const isInactive = product.isActive === false;

                  return (
                    <tr
                      key={product._id}
                      className={`border-b border-[#F5F5F5] transition-colors hover:bg-[#FAFAFA] ${
                        isInactive ? "opacity-60" : ""
                      }`}
                    >
                      {/* Product */}
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F5F5F5] sm:h-14 sm:w-14">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="max-h-full max-w-full object-contain p-1"
                              />
                            ) : (
                              <span className="text-[10px] text-[#999] sm:text-[11px]">
                                No Image
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <span className="block truncate text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                              {product.name}
                            </span>

                            <span className="text-[10px] text-[#7A7A7A] sm:text-[11px] lg:text-[12px]">
                              {product.category?.name || "No Category"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-[#DB4444] sm:px-6 sm:py-4 sm:text-[14px] lg:text-[15px]">
                        {formatPrice(product.price)}
                      </td>

                      {/* Original Price */}
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#7A7A7A] sm:px-6 sm:py-4 sm:text-[14px] lg:text-[15px]">
                        {product.originalPrice !== null &&
                        product.originalPrice !== undefined ? (
                          <span className="line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Stock */}
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-black sm:px-6 sm:py-4 sm:text-[14px] lg:text-[15px]">
                        {typeof product.stock === "number"
                          ? product.stock
                          : "—"}
                      </td>

                      {/* Rating */}
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-black sm:px-6 sm:py-4 sm:text-[14px] lg:text-[15px]">
                        ⭐ {Number(product.rating || 0).toFixed(1)}
                      </td>

                      {/* Sale Badge */}
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        {product.saleBadge ? (
                          <span className="inline-block whitespace-nowrap rounded-md bg-[#DB4444] px-2 py-1 text-[10px] font-medium text-white sm:px-3 sm:py-1.5 sm:text-[12px] lg:text-[13px]">
                            {product.saleBadge}
                          </span>
                        ) : (
                          <span className="text-xs text-[#999] sm:text-[13px]">
                            —
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(product)}
                          disabled={togglingId === product._id}
                          aria-label={
                            isInactive
                              ? `Activate ${product.name}`
                              : `Deactivate ${product.name}`
                          }
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-1.5 sm:text-[12px] lg:text-[13px] ${
                            isInactive
                              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {isInactive ? (
                            <>
                              <FiEyeOff size={12} />
                              Inactive
                            </>
                          ) : (
                            <>
                              <FiEye size={12} />
                              Active
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                          {isConfirming ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteConfirmed(product._id)
                                }
                                disabled={deletingId === product._id}
                                aria-label={`Confirm delete ${product.name}`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white transition-colors hover:bg-red-700 disabled:opacity-50 sm:h-10 sm:w-10"
                              >
                                <FiCheck size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={deletingId === product._id}
                                aria-label={`Cancel delete ${product.name}`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E5E5] bg-white text-black transition-colors hover:bg-[#F5F5F5] disabled:opacity-50 sm:h-10 sm:w-10"
                              >
                                <FiX size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Edit */}
                              <Link
                                href={`/admin/products/edit-product/${product._id}`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 sm:h-10 sm:w-10"
                                aria-label={`Edit ${product.name}`}
                              >
                                <FiEdit2 size={16} className="sm:hidden" />
                                <FiEdit2
                                  size={18}
                                  className="hidden sm:block"
                                />
                              </Link>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(product._id)}
                                disabled={deletingId === product._id}
                                aria-label={`Delete ${product.name}`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10"
                              >
                                <FiTrash2 size={16} className="sm:hidden" />
                                <FiTrash2
                                  size={18}
                                  className="hidden sm:block"
                                />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ============================================== */}
        {/* PAGINATION */}
        {/* ============================================== */}

        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E5E5E5] px-4 py-3.5 sm:flex-row sm:gap-4 sm:px-6 sm:py-4">
          <p className="text-xs text-[#7A7A7A] sm:text-[13px] lg:text-[14px]">
            {pagination.total === 0
              ? "Showing 0 products"
              : `Showing ${(currentPage - 1) * pagination.limit + 1}-${Math.min(
                  currentPage * pagination.limit,
                  pagination.total,
                )} of ${pagination.total} products`}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || loading}
              aria-label="Previous page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E5E5] transition-colors hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
            >
              <FiChevronLeft size={16} className="sm:hidden" />
              <FiChevronLeft size={18} className="hidden sm:block" />
            </button>

            <button
              type="button"
              className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#DB4444] px-3 text-xs font-medium text-white sm:h-10 sm:min-w-10 sm:text-sm"
            >
              {currentPage}
            </button>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= pagination.totalPages || loading}
              aria-label="Next page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E5E5] transition-colors hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
            >
              <FiChevronRight size={16} className="sm:hidden" />
              <FiChevronRight size={18} className="hidden sm:block" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
