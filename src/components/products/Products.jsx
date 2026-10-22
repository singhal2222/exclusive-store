// FILE LOCATION: src/components/products/Products.jsx

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  FiEye,
  FiHeart,
  FiChevronDown,
  FiSmartphone,
  FiMonitor,
  FiWatch,
  FiCamera,
  FiHeadphones,
  FiShoppingBag,
  FiUser,
  FiHome,
  FiActivity,
  FiGift,
  FiShoppingCart,
  FiStar,
} from "react-icons/fi";

import { BsController, BsTablet } from "react-icons/bs";

import Stars from "@/components/Stars";

// ============================================================
// SLUGIFY CATEGORY NAME
// ============================================================

const slugify = (value) => {
  return (
    value
      ?.toString()
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || ""
  );
};

// ============================================================
// PRODUCTS COMPONENT
// ============================================================

const Products = () => {
  // ============================================================
  // ROUTER + URL
  // ============================================================

  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryFromUrl = searchParams.get("category") || "";

  // ============================================================
  // STATES
  // ============================================================

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  const [categoriesError, setCategoriesError] = useState("");
  const [productsError, setProductsError] = useState("");

  const [selectedCategorySlug, setSelectedCategorySlug] =
    useState(categoryFromUrl);

  const [cartMessage, setCartMessage] = useState("");
  const [addingProductId, setAddingProductId] = useState(null);

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);

  // ============================================================
  // WISHLIST STATES
  // ============================================================

  const [wishlistProductIds, setWishlistProductIds] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [wishlistActionProductId, setWishlistActionProductId] = useState(null);
  const [wishlistMessage, setWishlistMessage] = useState("");

  // ============================================================
  // CATEGORY ICONS
  // ============================================================

  const icons = {
    phone: FiSmartphone,
    computer: FiMonitor,
    watch: FiWatch,
    camera: FiCamera,
    headphone: FiHeadphones,
    gamepad: BsController,
    tablet: BsTablet,
    women: FiShoppingBag,
    men: FiUser,
    electronics: FiSmartphone,
    lifestyle: FiHome,
    medicine: FiHeart,
    sports: FiActivity,
    baby: FiGift,
    grocery: FiShoppingCart,
    health: FiStar,
  };

  // ============================================================
  // KEEP CATEGORY SLUG IN SYNC WITH URL
  // ============================================================

  useEffect(() => {
    setSelectedCategorySlug(categoryFromUrl);
    setPage(1);
  }, [categoryFromUrl]);

  // ============================================================
  // FETCH CATEGORIES
  // ============================================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError("");

        const response = await fetch("/api/categories", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch categories.");
        }

        setCategories(Array.isArray(data?.categories) ? data.categories : []);
      } catch (error) {
        console.error("Shop categories fetch error:", error);

        setCategoriesError(
          error?.message || "Something went wrong while loading categories.",
        );

        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // ============================================================
  // FIND SELECTED CATEGORY FROM URL SLUG
  // ============================================================

  const selectedCategoryObject = categories.find(
    (category) => slugify(category?.name) === selectedCategorySlug,
  );

  // ============================================================
  // GET MONGODB CATEGORY ID
  // ============================================================

  const selectedCategoryId = selectedCategoryObject?._id?.toString() || "";

  // ============================================================
  // SELECTED CATEGORY NAME
  // ============================================================

  const selectedCategoryName = selectedCategoryObject?.name || "All Products";

  // ============================================================
  // FETCH PRODUCTS
  // ============================================================

  useEffect(() => {
    if (selectedCategorySlug && categoriesLoading) {
      return;
    }

    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError("");

        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("limit", "12");

        // --------------------------------------------------------
        // CATEGORY FILTER
        // --------------------------------------------------------

        if (selectedCategorySlug) {
          if (!selectedCategoryId) {
            setProducts([]);

            setPagination({
              page: 1,
              limit: 12,
              total: 0,
              totalPages: 1,
            });

            setProductsError("The selected category was not found.");

            setProductsLoading(false);

            return;
          }

          params.set("category", selectedCategoryId);
        }

        // --------------------------------------------------------
        // FETCH PRODUCTS
        // --------------------------------------------------------

        const response = await fetch(`/api/products?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch products.");
        }

        setProducts(Array.isArray(data?.products) ? data.products : []);

        setPagination(
          data?.pagination || {
            page: 1,
            limit: 12,
            total: 0,
            totalPages: 1,
          },
        );
      } catch (error) {
        console.error("Shop products fetch error:", error);

        setProductsError(
          error?.message || "Something went wrong while loading products.",
        );

        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategorySlug, selectedCategoryId, categoriesLoading, page]);

  // ============================================================
  // FETCH WISHLIST
  // ============================================================

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setWishlistLoading(true);

        const response = await fetch("/api/wishlist", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const data = await response.json();

        // --------------------------------------------------------
        // USER IS NOT LOGGED IN
        // --------------------------------------------------------

        if (response.status === 401) {
          setWishlistProductIds([]);
          return;
        }

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch wishlist.");
        }

        const wishlistProducts = Array.isArray(data?.wishlist?.products)
          ? data.wishlist.products
          : [];

        const ids = wishlistProducts
          .map((product) => product?._id?.toString())
          .filter(Boolean);

        setWishlistProductIds(ids);
      } catch (error) {
        console.error("Shop wishlist fetch error:", error);

        setWishlistProductIds([]);
      } finally {
        setWishlistLoading(false);
      }
    };

    fetchWishlist();
  }, []);

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
  // CATEGORY CLICK
  // ============================================================

  const handleCategoryChange = (category) => {
    setPage(1);

    // ----------------------------------------------------------
    // ALL PRODUCTS
    // ----------------------------------------------------------

    if (!category) {
      router.push("/shop");
      return;
    }

    // ----------------------------------------------------------
    // CATEGORY SLUG
    // ----------------------------------------------------------

    const categorySlug = slugify(category?.name);

    if (!categorySlug) {
      return;
    }

    router.push(`/shop?category=${encodeURIComponent(categorySlug)}`);
  };

  // ============================================================
  // ADD TO WISHLIST
  // ============================================================

  const addToWishlist = async (productId) => {
    if (!productId || wishlistActionProductId) {
      return;
    }

    try {
      setWishlistActionProductId(productId);
      setWishlistMessage("");
      setProductsError("");

      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId,
        }),
      });

      const data = await response.json();

      // --------------------------------------------------------
      // LOGIN REQUIRED
      // --------------------------------------------------------

      if (response.status === 401) {
        router.push("/auth/login");
        return;
      }

      // --------------------------------------------------------
      // ALREADY EXISTS
      // --------------------------------------------------------

      if (response.status === 409) {
        setWishlistProductIds((current) =>
          current.includes(productId) ? current : [...current, productId],
        );

        return;
      }

      // --------------------------------------------------------
      // API ERROR
      // --------------------------------------------------------

      if (!response.ok) {
        throw new Error(data?.message || "Failed to add product to wishlist.");
      }

      // --------------------------------------------------------
      // UPDATE LOCAL WISHLIST STATE
      // --------------------------------------------------------

      const wishlistProducts = Array.isArray(data?.wishlist?.products)
        ? data.wishlist.products
        : [];

      const updatedIds = wishlistProducts
        .map((product) => product?._id?.toString())
        .filter(Boolean);

      setWishlistProductIds(updatedIds);

      setWishlistMessage("Product added to wishlist.");

      window.dispatchEvent(new Event("wishlist:updated"));

      window.setTimeout(() => {
        setWishlistMessage("");
      }, 2000);
    } catch (error) {
      console.error("Add to wishlist error:", error);

      setProductsError(
        error?.message ||
          "Something went wrong while adding the product to wishlist.",
      );
    } finally {
      setWishlistActionProductId(null);
    }
  };

  // ============================================================
  // REMOVE FROM WISHLIST
  // ============================================================

  const removeFromWishlist = async (productId) => {
    if (!productId || wishlistActionProductId) {
      return;
    }

    try {
      setWishlistActionProductId(productId);
      setWishlistMessage("");
      setProductsError("");

      const response = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId,
        }),
      });

      const data = await response.json();

      // --------------------------------------------------------
      // LOGIN REQUIRED
      // --------------------------------------------------------

      if (response.status === 401) {
        router.push("/auth/login");
        return;
      }

      // --------------------------------------------------------
      // API ERROR
      // --------------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to remove product from wishlist.",
        );
      }

      // --------------------------------------------------------
      // UPDATE LOCAL WISHLIST STATE
      // --------------------------------------------------------

      const wishlistProducts = Array.isArray(data?.wishlist?.products)
        ? data.wishlist.products
        : [];

      const updatedIds = wishlistProducts
        .map((product) => product?._id?.toString())
        .filter(Boolean);

      setWishlistProductIds(updatedIds);

      setWishlistMessage("Product removed from wishlist.");

      window.dispatchEvent(new Event("wishlist:updated"));

      window.setTimeout(() => {
        setWishlistMessage("");
      }, 2000);
    } catch (error) {
      console.error("Remove from wishlist error:", error);

      setProductsError(
        error?.message ||
          "Something went wrong while removing the product from wishlist.",
      );
    } finally {
      setWishlistActionProductId(null);
    }
  };

  // ============================================================
  // TOGGLE WISHLIST
  // ============================================================

  const toggleWishlist = (productId) => {
    if (!productId) {
      return;
    }

    const isWishlisted = wishlistProductIds.includes(productId);

    if (isWishlisted) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  };

  // ============================================================
  // ADD TO CART
  // ============================================================

  const addToCart = async (productId) => {
    if (!productId) {
      return;
    }

    try {
      setAddingProductId(productId);
      setProductsError("");
      setCartMessage("");

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      const data = await response.json();

      // --------------------------------------------------------
      // LOGIN REQUIRED
      // --------------------------------------------------------

      if (response.status === 401) {
        router.push("/auth/login");
        return;
      }

      // --------------------------------------------------------
      // API ERROR
      // --------------------------------------------------------

      if (!response.ok) {
        throw new Error(data?.message || "Failed to add product to cart.");
      }

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      setCartMessage("Product added to cart successfully.");

      window.dispatchEvent(new Event("cart:updated"));

      window.setTimeout(() => {
        setCartMessage("");
      }, 2000);
    } catch (error) {
      console.error("Shop add to cart error:", error);

      setProductsError(
        error?.message ||
          "Something went wrong while adding the product to cart.",
      );
    } finally {
      setAddingProductId(null);
    }
  };

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <section className="w-full bg-white pb-16 pt-6 font-poppins sm:pb-20 sm:pt-8 lg:pb-24 lg:pt-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ================================================== */}
        {/* BREADCRUMB */}
        {/* ================================================== */}

        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs sm:mb-8 sm:text-sm lg:mb-10">
          <Link
            href="/"
            className="text-[#7A7A7A] transition-colors hover:text-[#DB4444]"
          >
            Home
          </Link>

          <span className="text-[#7A7A7A]">/</span>

          <span className="text-black">Shop</span>
        </div>

        {/* ================================================== */}
        {/* PAGE TITLE */}
        {/* ================================================== */}

        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="mb-4 flex items-center gap-3 sm:mb-5 sm:gap-4 lg:mb-6">
            <span className="h-6 w-3 rounded-md bg-[#DB4444] sm:h-7 sm:w-3.5 lg:h-8 lg:w-4" />

            <p className="text-sm font-semibold text-[#DB4444] sm:text-[15px] lg:text-base">
              Shop
            </p>
          </div>

          <h1 className="text-2xl font-semibold tracking-[4%] text-black sm:text-3xl lg:text-[36px]">
            {selectedCategoryName}
          </h1>
        </div>

        {/* ================================================== */}
        {/* CART MESSAGE */}
        {/* ================================================== */}

        {cartMessage && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-600 sm:px-4 sm:py-3 sm:text-sm">
            {cartMessage}
          </div>
        )}

        {/* ================================================== */}
        {/* WISHLIST MESSAGE */}
        {/* ================================================== */}

        {wishlistMessage && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-600 sm:mb-6 sm:px-4 sm:py-3 sm:text-sm">
            {wishlistMessage}
          </div>
        )}

        {/* ================================================== */}
        {/* MAIN SHOP LAYOUT */}
        {/* ================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
          {/* ================================================= */}
          {/* CATEGORY SIDEBAR */}
          {/* ================================================= */}

          <aside className="w-full">
            {/* Mobile Category Button */}

            <button
              type="button"
              onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
              className="flex w-full items-center justify-between rounded-md border border-[#E5E5E5] bg-white px-4 py-3 text-left text-sm font-medium lg:hidden"
            >
              <span>Categories</span>

              <FiChevronDown
                size={20}
                className={`transition-transform ${
                  mobileCategoryOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`${
                mobileCategoryOpen ? "mt-4 block" : "hidden"
              } lg:mt-0 lg:block`}
            >
              <div className="rounded-md border border-[#E5E5E5] bg-white p-4 sm:p-5">
                <h2 className="mb-4 text-base font-semibold text-black sm:mb-6 sm:text-lg">
                  Categories
                </h2>

                {/* CATEGORY LOADING */}

                {categoriesLoading && (
                  <div className="space-y-3 sm:space-y-4">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                      <div
                        key={item}
                        className="h-5 w-full animate-pulse rounded bg-[#F5F5F5]"
                      />
                    ))}
                  </div>
                )}

                {/* CATEGORY ERROR */}

                {!categoriesLoading && categoriesError && (
                  <p className="text-xs leading-5 text-red-500 sm:text-sm sm:leading-6">
                    {categoriesError}
                  </p>
                )}

                {/* CATEGORY LIST */}

                {!categoriesLoading && !categoriesError && (
                  <div className="space-y-1.5 sm:space-y-2">
                    {/* ALL PRODUCTS */}

                    <button
                      type="button"
                      onClick={() => {
                        handleCategoryChange(null);

                        setMobileCategoryOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-xs transition-colors sm:py-2.5 sm:text-sm ${
                        !selectedCategorySlug
                          ? "bg-[#FFF5F5] font-medium text-[#DB4444]"
                          : "text-[#7A7A7A] hover:bg-[#FFF5F5] hover:text-[#DB4444]"
                      }`}
                    >
                      <span>All Products</span>
                    </button>

                    {/* CATEGORIES */}

                    {categories.map((category) => {
                      const Icon = icons[category?.icon] || FiSmartphone;

                      const categoryId = category?._id?.toString();

                      const categorySlug = slugify(category?.name);

                      const isActive = selectedCategorySlug === categorySlug;

                      return (
                        <button
                          key={categoryId}
                          type="button"
                          onClick={() => {
                            handleCategoryChange(category);

                            setMobileCategoryOpen(false);
                          }}
                          className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs transition-colors sm:gap-3 sm:py-2.5 sm:text-sm ${
                            isActive
                              ? "bg-[#FFF5F5] font-medium text-[#DB4444]"
                              : "text-[#7A7A7A] hover:bg-[#FFF5F5] hover:text-[#DB4444]"
                          }`}
                        >
                          <Icon size={16} className="shrink-0 sm:hidden" />

                          <Icon
                            size={17}
                            className="hidden shrink-0 sm:block"
                          />

                          <span className="truncate">{category?.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ================================================= */}
          {/* PRODUCTS AREA */}
          {/* ================================================= */}

          <div className="min-w-0">
            {/* PRODUCTS TOP BAR */}

            <div className="mb-6 flex flex-col gap-3 border-b border-[#E5E5E5] pb-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-5">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-black sm:text-xl">
                  {selectedCategoryName}
                </h2>

                {!productsLoading && (
                  <p className="mt-1 text-xs text-[#7A7A7A] sm:text-sm">
                    {pagination.total} product
                    {pagination.total === 1 ? "" : "s"} available
                  </p>
                )}
              </div>

              <Link
                href="/"
                className="text-xs font-medium text-[#7A7A7A] transition-colors hover:text-[#DB4444] sm:text-sm"
              >
                Back to Home
              </Link>
            </div>

            {/* PRODUCTS ERROR */}

            {!productsLoading && productsError && (
              <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-600 sm:mb-6 sm:px-4 sm:py-4 sm:text-sm">
                {productsError}
              </div>
            )}

            {/* PRODUCTS LOADING */}

            {productsLoading && (
              <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="animate-pulse">
                    <div className="h-56 rounded-md bg-[#F5F5F5] sm:h-64 lg:h-72" />

                    <div className="mt-4 h-4 w-32 rounded bg-gray-200 sm:h-5 sm:w-44" />

                    <div className="mt-3 h-3.5 w-20 rounded bg-gray-200 sm:h-4 sm:w-28" />

                    <div className="mt-3 h-3.5 w-16 rounded bg-gray-200 sm:h-4 sm:w-20" />
                  </div>
                ))}
              </div>
            )}

            {/* EMPTY PRODUCTS */}

            {!productsLoading && !productsError && products.length === 0 && (
              <div className="rounded-md border border-[#E5E5E5] bg-[#F5F5F5] px-4 py-12 text-center sm:px-5 sm:py-16">
                <p className="text-xs text-[#7A7A7A] sm:text-sm">
                  No products found in this category.
                </p>

                {selectedCategorySlug && (
                  <button
                    type="button"
                    onClick={() => handleCategoryChange(null)}
                    className="mt-4 cursor-pointer rounded-md bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-black sm:text-sm"
                  >
                    View All Products
                  </button>
                )}
              </div>
            )}

            {/* PRODUCT GRID */}

            {!productsLoading && !productsError && products.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 xl:grid-cols-3">
                  {products.map((product) => {
                    const productId = product?._id?.toString();

                    const productName = product?.name || "Product";

                    const productImage = product?.image || "";

                    const productPrice = Number(product?.price || 0);

                    const originalPrice = product?.originalPrice;

                    const rating = Number(product?.rating || 0);

                    // ------------------------------------------------------
                    // NEW: review count for "No reviews yet" display
                    // ------------------------------------------------------
                    const reviewCount = Number(product?.reviewCount || 0);

                    const saleBadge = product?.saleBadge || "";

                    const stock = Number(product?.stock || 0);

                    const isAdding = addingProductId === productId;

                    const isWishlistAction =
                      wishlistActionProductId === productId;

                    const isWishlisted = wishlistProductIds.includes(productId);

                    const isOutOfStock = stock <= 0;

                    return (
                      <div key={productId} className="w-full">
                        {/* ====================================== */}
                        {/* PRODUCT IMAGE */}
                        {/* ====================================== */}

                        <div className="group relative mb-4 flex h-56 items-center justify-center overflow-hidden rounded-md bg-[#F5F5F5] sm:mb-5 sm:h-64 lg:h-72">
                          {/* Product Badges */}

                          <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5 sm:left-3 sm:top-3 sm:gap-2">
                            {saleBadge && !isOutOfStock && (
                              <span className="w-fit rounded-sm bg-[#DB4444] px-2 py-0.5 text-[10px] font-medium text-white sm:px-3 sm:py-1 sm:text-[11px]">
                                {saleBadge}
                              </span>
                            )}

                            {isOutOfStock && (
                              <span className="w-fit rounded-sm bg-black px-2 py-0.5 text-[10px] font-medium text-white sm:px-3 sm:py-1 sm:text-[11px]">
                                Out of Stock
                              </span>
                            )}

                            {saleBadge && isOutOfStock && (
                              <span className="w-fit rounded-sm bg-[#DB4444] px-2 py-0.5 text-[10px] font-medium text-white sm:px-3 sm:py-1 sm:text-[11px]">
                                {saleBadge}
                              </span>
                            )}
                          </div>

                          {/* Product Image */}

                          {productImage ? (
                            <img
                              src={productImage}
                              alt={productName}
                              className={`max-h-full max-w-full object-contain transition-transform duration-300 ${
                                isOutOfStock
                                  ? "opacity-60"
                                  : "group-hover:scale-105"
                              }`}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-[#7A7A7A]">
                              No Image
                            </div>
                          )}

                          {/* ====================================== */}
                          {/* ACTION ICONS */}
                          {/* ====================================== */}

                          <div className="absolute right-2 top-2 flex flex-col gap-2 sm:right-3 sm:top-3 sm:gap-2.5">
                            {/* Wishlist */}

                            <button
                              type="button"
                              onClick={() => toggleWishlist(productId)}
                              disabled={isWishlistAction || wishlistLoading}
                              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-70 sm:h-9 sm:w-9 ${
                                isWishlisted
                                  ? "text-[#DB4444]"
                                  : "text-black hover:bg-[#FFF5F5] hover:text-[#DB4444]"
                              }`}
                              aria-label={
                                isWishlisted
                                  ? `Remove ${productName} from wishlist`
                                  : `Add ${productName} to wishlist`
                              }
                            >
                              {isWishlistAction ? (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#DB4444] border-t-transparent sm:h-4 sm:w-4" />
                              ) : (
                                <FiHeart
                                  className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                    isWishlisted ? "fill-[#DB4444]" : ""
                                  }`}
                                />
                              )}
                            </button>

                            {/* View Product */}

                            <Link
                              href={`/product/${productId}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white transition-colors hover:bg-[#FFF5F5] hover:text-[#DB4444] sm:h-9 sm:w-9"
                              aria-label={`View ${productName}`}
                            >
                              <FiEye className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Link>
                          </div>

                          {/* ====================================== */}
                          {/* ADD TO CART */}
                          {/* ====================================== */}

                          <button
                            type="button"
                            onClick={() => addToCart(productId)}
                            disabled={isAdding || isOutOfStock}
                            className="absolute bottom-0 left-0 w-full cursor-pointer rounded-bl-md rounded-br-md border-0 bg-black py-2 text-xs font-medium text-white transition-colors hover:bg-[#DB4444] disabled:cursor-not-allowed disabled:opacity-70 sm:py-3 sm:text-sm"
                          >
                            {isOutOfStock
                              ? "Out of Stock"
                              : isAdding
                                ? "Adding..."
                                : "Add to Cart"}
                          </button>
                        </div>

                        {/* ====================================== */}
                        {/* PRODUCT DETAILS */}
                        {/* ====================================== */}

                        <div className="font-medium">
                          {/* Product Name */}

                          <Link
                            href={`/product/${productId}`}
                            className="mb-2 block line-clamp-1 text-sm transition-colors hover:text-[#DB4444] sm:mb-2.5 sm:text-[15px] lg:text-base"
                          >
                            {productName}
                          </Link>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {/* Current Price */}

                            <p className="text-sm text-[#DB4444] sm:text-[15px] lg:text-base">
                              {formatPrice(productPrice)}
                            </p>

                            {/* Original Price */}

                            {originalPrice !== null &&
                              originalPrice !== undefined &&
                              Number(originalPrice) > productPrice && (
                                <p className="text-xs text-[#7A7A7A] line-through sm:text-[13px]">
                                  {formatPrice(originalPrice)}
                                </p>
                              )}
                          </div>

                          {/* Rating */}

                          <div className="mt-2 mb-3 sm:mb-4 md:mb-5">
                            <Stars rating={rating} reviewCount={reviewCount} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ================================================= */}
                {/* PAGINATION */}
                {/* ================================================= */}

                {pagination.totalPages > 1 && (
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:mt-14">
                    {/* Previous */}

                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() =>
                        setPage((current) => Math.max(current - 1, 1))
                      }
                      className="cursor-pointer rounded-md border border-[#E5E5E5] px-3 py-2 text-xs transition-colors hover:border-[#DB4444] hover:text-[#DB4444] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}

                    {Array.from(
                      {
                        length: pagination.totalPages,
                      },
                      (_, index) => index + 1,
                    ).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`h-9 min-w-9 cursor-pointer rounded-md px-2.5 text-xs transition-colors sm:h-10 sm:min-w-10 sm:px-3 sm:text-sm ${
                          page === pageNumber
                            ? "bg-[#DB4444] text-white"
                            : "border border-[#E5E5E5] text-black hover:border-[#DB4444] hover:text-[#DB4444]"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}

                    {/* Next */}

                    <button
                      type="button"
                      disabled={page >= pagination.totalPages}
                      onClick={() =>
                        setPage((current) =>
                          Math.min(current + 1, pagination.totalPages),
                        )
                      }
                      className="cursor-pointer rounded-md border border-[#E5E5E5] px-3 py-2 text-xs transition-colors hover:border-[#DB4444] hover:text-[#DB4444] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Products;
