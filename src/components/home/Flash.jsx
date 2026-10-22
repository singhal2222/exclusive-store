// FILE LOCATION: src/components/home/Flash.jsx

"use client";

import React, { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";

import { FiHeart, FiEye } from "react-icons/fi";

import { BsArrowRight, BsArrowLeft } from "react-icons/bs";

import Stars from "../Stars";

// ============================================================
// FLASH COMPONENT
// ============================================================

const Flash = () => {
  // ============================================================
  // ROUTER
  // ============================================================

  const router = useRouter();

  // ============================================================
  // SWIPER
  // ============================================================

  const swiperRef = useRef(null);

  // ============================================================
  // STATES
  // ============================================================

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cartMessage, setCartMessage] = useState("");
  const [addingProductId, setAddingProductId] = useState(null);

  // ============================================================
  // WISHLIST STATES
  // ============================================================

  const [wishlistProductIds, setWishlistProductIds] = useState([]);

  const [wishlistLoading, setWishlistLoading] = useState(true);

  const [wishlistActionProductId, setWishlistActionProductId] = useState(null);

  const [wishlistMessage, setWishlistMessage] = useState("");

  // ============================================================
  // FETCH FLASH SALE PRODUCTS
  // ============================================================

  useEffect(() => {
    const fetchFlashProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products?limit=20", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to fetch flash sale products.",
          );
        }

        const allProducts = Array.isArray(data?.products) ? data.products : [];

        // ------------------------------------------------------
        // FLASH SALE PRODUCTS
        // ------------------------------------------------------
        //
        // Product is considered a flash sale product when:
        // 1. It has a saleBadge
        // OR
        // 2. originalPrice is greater than price
        // ------------------------------------------------------

        const flashProducts = allProducts.filter((product) => {
          const price = Number(product?.price || 0);

          const originalPrice = Number(product?.originalPrice || 0);

          const hasSaleBadge = Boolean(product?.saleBadge);

          const hasDiscount = originalPrice > price;

          return hasSaleBadge || hasDiscount;
        });

        setProducts(flashProducts);
      } catch (error) {
        console.error("Flash products fetch error:", error);

        setError(
          error?.message || "Something went wrong while loading flash sales.",
        );

        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashProducts();
  }, []);

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

        // ------------------------------------------------------
        // USER IS NOT LOGGED IN
        // ------------------------------------------------------

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
        console.error("Flash wishlist fetch error:", error);

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
  // CALCULATE DISCOUNT
  // ============================================================

  const getDiscountPercentage = (price, originalPrice) => {
    const currentPrice = Number(price || 0);
    const oldPrice = Number(originalPrice || 0);

    if (oldPrice <= 0 || currentPrice >= oldPrice) {
      return null;
    }

    return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
  };

  // ============================================================
  // ADD PRODUCT TO WISHLIST
  // ============================================================

  const addToWishlist = async (productId) => {
    if (!productId || wishlistActionProductId) {
      return;
    }

    try {
      setWishlistActionProductId(productId);
      setWishlistMessage("");
      setError("");

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
      // UPDATE LOCAL STATE
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
      console.error("Flash add to wishlist error:", error);

      setError(
        error?.message ||
          "Something went wrong while adding the product to wishlist.",
      );
    } finally {
      setWishlistActionProductId(null);
    }
  };

  // ============================================================
  // REMOVE PRODUCT FROM WISHLIST
  // ============================================================

  const removeFromWishlist = async (productId) => {
    if (!productId || wishlistActionProductId) {
      return;
    }

    try {
      setWishlistActionProductId(productId);
      setWishlistMessage("");
      setError("");

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
      // UPDATE LOCAL STATE
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
      console.error("Flash remove from wishlist error:", error);

      setError(
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
      setError("");
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

      // Refresh Header cart count
      window.dispatchEvent(new Event("cart:updated"));

      window.setTimeout(() => {
        setCartMessage("");
      }, 2000);
    } catch (error) {
      console.error("Flash add to cart error:", error);

      setError(
        error?.message ||
          "Something went wrong while adding the product to cart.",
      );
    } finally {
      setAddingProductId(null);
    }
  };

  // ============================================================
  // LOADING UI
  // ============================================================

  if (loading) {
    return (
      <div className="mb-12 w-full sm:mb-16 md:mb-20 lg:mb-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="font-poppins text-sm font-normal leading-normal tracking-normal text-black sm:text-[15px] md:text-base">
            {/* Heading */}

            <div className="mb-8 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between md:mb-11">
              <div>
                <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-[#DB4444] sm:mb-6 sm:gap-4 md:mb-9">
                  <span className="h-6 w-3 rounded-md bg-[#DB4444] sm:h-7 sm:w-3.5 md:h-8 md:w-4" />

                  <p>Today&apos;s</p>
                </div>

                <h2 className="text-2xl font-semibold tracking-[4%] sm:text-3xl md:text-4xl lg:text-[36px]">
                  Flash Sales
                </h2>
              </div>

              {/* Skeleton Arrows */}

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-[#F5F5F5] sm:h-11 sm:w-11 md:h-12 md:w-12" />

                <div className="h-10 w-10 animate-pulse rounded-full bg-[#F5F5F5] sm:h-11 sm:w-11 md:h-12 md:w-12" />
              </div>
            </div>

            {/* Product Skeleton */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="animate-pulse">
                  <div className="h-56 rounded-md bg-[#F5F5F5] sm:h-64 md:h-70" />

                  <div className="mt-4 h-4 w-32 rounded bg-gray-200 sm:mt-5 sm:h-5 sm:w-40" />

                  <div className="mt-2.5 h-3.5 w-20 rounded bg-gray-200 sm:mt-3 sm:h-4 sm:w-24" />

                  <div className="mt-2.5 h-3.5 w-16 rounded bg-gray-200 sm:mt-3 sm:h-4 sm:w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR UI
  // ============================================================

  if (error && products.length === 0) {
    return (
      <div className="mb-12 w-full sm:mb-16 md:mb-20 lg:mb-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="font-poppins text-black">
            <div className="mb-8 sm:mb-9 md:mb-11">
              <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-[#DB4444] sm:mb-6 sm:gap-4 md:mb-9">
                <span className="h-6 w-3 rounded-md bg-[#DB4444] sm:h-7 sm:w-3.5 md:h-8 md:w-4" />

                <p>Today&apos;s</p>
              </div>

              <h2 className="text-2xl font-semibold tracking-[4%] sm:text-3xl md:text-4xl lg:text-[36px]">
                Flash Sales
              </h2>
            </div>

            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-600 sm:px-4 sm:py-4 sm:text-[13px]">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // EMPTY UI
  // ============================================================

  if (products.length === 0) {
    return (
      <div className="mb-12 w-full sm:mb-16 md:mb-20 lg:mb-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="font-poppins text-black">
            <div className="mb-8 sm:mb-9 md:mb-11">
              <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-[#DB4444] sm:mb-6 sm:gap-4 md:mb-9">
                <span className="h-6 w-3 rounded-md bg-[#DB4444] sm:h-7 sm:w-3.5 md:h-8 md:w-4" />

                <p>Today&apos;s</p>
              </div>

              <h2 className="text-2xl font-semibold tracking-[4%] sm:text-3xl md:text-4xl lg:text-[36px]">
                Flash Sales
              </h2>
            </div>

            <div className="rounded-md border border-[#E5E5E5] bg-[#F5F5F5] px-4 py-8 text-center sm:px-5 sm:py-12">
              <p className="text-xs text-[#7A7A7A] sm:text-sm">
                No flash sale products are available right now.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="mb-12 w-full sm:mb-16 md:mb-20 lg:mb-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="font-poppins text-sm font-normal leading-normal tracking-normal text-black sm:text-[15px] md:text-base">
          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <div className="mb-8 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between md:mb-11">
            <div>
              <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-[#DB4444] sm:mb-6 sm:gap-4 sm:text-base md:mb-9">
                <span className="h-6 w-3 rounded-md bg-[#DB4444] sm:h-7 sm:w-3.5 md:h-8 md:w-4" />

                <p>Today&apos;s</p>
              </div>

              <h2 className="text-2xl font-semibold tracking-[4%] sm:text-3xl md:text-4xl lg:text-[36px]">
                Flash Sales
              </h2>
            </div>

            {/* ================================================= */}
            {/* SWIPER BUTTONS */}
            {/* ================================================= */}

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => swiperRef.current?.slidePrev()}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#F5F5F5] transition-colors hover:bg-[#FFF5F5] hover:text-[#DB4444] sm:h-11 sm:w-11 md:h-12 md:w-12"
                aria-label="Previous flash sale products"
              >
                <BsArrowLeft className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              </button>

              <button
                type="button"
                onClick={() => swiperRef.current?.slideNext()}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#F5F5F5] transition-colors hover:bg-[#FFF5F5] hover:text-[#DB4444] sm:h-11 sm:w-11 md:h-12 md:w-12"
                aria-label="Next flash sale products"
              >
                <BsArrowRight className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              </button>
            </div>
          </div>

          {/* ================================================== */}
          {/* CART MESSAGE */}
          {/* ================================================== */}

          {cartMessage && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-600 sm:mb-5 sm:px-4 sm:py-3 sm:text-[13px]">
              {cartMessage}
            </div>
          )}

          {/* ================================================== */}
          {/* WISHLIST MESSAGE */}
          {/* ================================================== */}

          {wishlistMessage && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-600 sm:mb-5 sm:px-4 sm:py-3 sm:text-[13px]">
              {wishlistMessage}
            </div>
          )}

          {/* ================================================== */}
          {/* ERROR MESSAGE */}
          {/* ================================================== */}

          {error && products.length > 0 && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600 sm:mb-5 sm:px-4 sm:py-3 sm:text-[13px]">
              {error}
            </div>
          )}

          {/* ================================================== */}
          {/* PRODUCTS SLIDER */}
          {/* ================================================== */}

          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            slidesPerView={1}
            spaceBetween={16}
            slidesPerGroup={1}
            loop={products.length > 4}
            breakpoints={{
              0: {
                slidesPerView: 1,
                spaceBetween: 16,
              },

              480: {
                slidesPerView: 2,
                spaceBetween: 16,
              },

              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },

              768: {
                slidesPerView: 3,
                spaceBetween: 20,
              },

              1024: {
                slidesPerView: 3,
                spaceBetween: 24,
              },

              1280: {
                slidesPerView: 4,
                spaceBetween: 32,
              },
            }}
            className="mb-10 sm:mb-12 md:mb-15"
          >
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

              const isWishlistAction = wishlistActionProductId === productId;

              const isWishlisted = wishlistProductIds.includes(productId);

              const isOutOfStock = stock <= 0;

              const discountPercentage = getDiscountPercentage(
                productPrice,
                originalPrice,
              );

              return (
                <SwiperSlide key={productId}>
                  <div className="w-full">
                    {/* ========================================== */}
                    {/* PRODUCT IMAGE */}
                    {/* ========================================== */}

                    <div className="group relative mb-4 flex h-56 items-center justify-center overflow-hidden rounded-md bg-[#F5F5F5] sm:mb-5 sm:h-64 md:h-70">
                      {/* Sale Badge */}

                      {saleBadge && !isOutOfStock && (
                        <span className="absolute left-2 top-2 z-10 rounded-sm bg-[#DB4444] px-2 py-0.5 text-[10px] font-medium text-white sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[11px]">
                          {saleBadge}
                        </span>
                      )}

                      {/* Out Of Stock */}

                      {isOutOfStock && (
                        <span className="absolute left-2 top-2 z-10 rounded-sm bg-black px-2 py-0.5 text-[10px] font-medium text-white sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[11px]">
                          Out of Stock
                        </span>
                      )}

                      {/* Discount */}

                      {!saleBadge && discountPercentage && !isOutOfStock && (
                        <span className="absolute left-2 top-2 z-10 rounded-sm bg-[#DB4444] px-2 py-0.5 text-[10px] font-medium text-white sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[11px]">
                          -{discountPercentage}%
                        </span>
                      )}

                      {/* Product Image */}

                      {productImage ? (
                        <img
                          src={productImage}
                          className={`max-h-full max-w-full object-contain transition-transform duration-300 ${
                            isOutOfStock
                              ? "opacity-60"
                              : "group-hover:scale-105"
                          }`}
                          alt={productName}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-[#7A7A7A]">
                          No Image
                        </div>
                      )}

                      {/* ======================================== */}
                      {/* ACTION BUTTONS */}
                      {/* ======================================== */}

                      <div className="absolute right-2 top-2 flex flex-col items-center gap-2 sm:right-3 sm:top-3 sm:gap-2.5">
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

                        {/* ====================================== */}
                        {/* VIEW PRODUCT / PRODUCT DETAILS */}
                        {/* ====================================== */}

                        <Link
                          href={`/product/${productId}`}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white transition-colors hover:bg-[#FFF5F5] hover:text-[#DB4444] sm:h-9 sm:w-9"
                          aria-label={`View ${productName}`}
                        >
                          <FiEye className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Link>
                      </div>

                      {/* ======================================== */}
                      {/* ADD TO CART */}
                      {/* ======================================== */}

                      <button
                        type="button"
                        onClick={() => addToCart(productId)}
                        disabled={isAdding || isOutOfStock}
                        className="absolute bottom-0 left-0 w-full translate-y-2 rounded-bl-md rounded-br-md border-0 bg-black py-2 text-xs font-medium text-white opacity-0 transition-all duration-300 hover:bg-[#DB4444] disabled:cursor-not-allowed disabled:opacity-70 group-hover:translate-y-0 group-hover:opacity-100 sm:py-2.5 sm:text-sm"
                      >
                        {isOutOfStock
                          ? "Out of Stock"
                          : isAdding
                            ? "Adding..."
                            : "Add to Cart"}
                      </button>
                    </div>

                    {/* ========================================== */}
                    {/* PRODUCT DETAILS */}
                    {/* ========================================== */}

                    <div className="font-medium">
                      {/* Product Name */}

                      <Link
                        href={`/products/${productId}`}
                        className="mb-2 block line-clamp-1 text-sm transition-colors hover:text-[#DB4444] sm:mb-2.5 sm:text-[15px] md:text-base"
                      >
                        {productName}
                      </Link>

                      {/* Price */}

                      <div className="mb-2 flex items-center gap-3 sm:mb-2.5 sm:gap-4">
                        <p className="text-sm text-[#DB4444] sm:text-[15px] md:text-base">
                          {formatPrice(productPrice)}
                        </p>

                        {originalPrice !== null &&
                          originalPrice !== undefined &&
                          Number(originalPrice) > productPrice && (
                            <p className="text-xs text-[#7A7A7A] line-through sm:text-[13px]">
                              {formatPrice(originalPrice)}
                            </p>
                          )}
                      </div>

                      {/* Rating */}

                      <div className="mt-2 mb-3 flex items-center gap-3 sm:mb-4 md:mb-5">
                        <Stars rating={rating} reviewCount={reviewCount} />
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* ================================================== */}
          {/* VIEW ALL PRODUCTS */}
          {/* ================================================== */}

          <div className="flex justify-center font-medium">
            <Link
              href="/shop"
              className="rounded-md border-0 bg-[#DB4444] px-6 py-3 text-sm text-white transition-colors hover:bg-black sm:px-10 sm:py-3.5 sm:text-[15px] md:px-13 md:py-4 md:text-base"
            >
              View All Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flash;
