// FILE LOCATION: src/components/home/Bestselling.jsx

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiEye, FiHeart } from "react-icons/fi";
import Stars from "../Stars";

// ============================================================
// BESTSELLING COMPONENT
// ============================================================

const Bestselling = () => {
  // ============================================================
  // ROUTER
  // ============================================================

  const router = useRouter();

  // ============================================================
  // PRODUCT STATES
  // ============================================================

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // CART STATES
  // ============================================================

  const [addingProductId, setAddingProductId] = useState(null);
  const [cartMessage, setCartMessage] = useState("");

  // ============================================================
  // WISHLIST STATES
  // ============================================================

  const [wishlistProductIds, setWishlistProductIds] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [wishlistActionProductId, setWishlistActionProductId] = useState(null);
  const [wishlistMessage, setWishlistMessage] = useState("");

  // ============================================================
  // FETCH PRODUCTS
  // ============================================================

  useEffect(() => {
    const fetchBestSellingProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products?limit=20", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch products.");
        }

        const allProducts = Array.isArray(data?.products) ? data.products : [];

        // ------------------------------------------------------
        // BESTSELLING LOGIC
        // ------------------------------------------------------
        //
        // Since we don't track soldCount yet, we approximate
        // "best selling" using the following priority:
        //
        //   1. Higher average rating comes first
        //   2. Then higher reviewCount (more popular)
        //   3. Then most recently created
        //
        // This is a temporary heuristic that improves as real
        // reviews come in.
        // ------------------------------------------------------

        const bestSellingProducts = [...allProducts]
          .sort((a, b) => {
            const ratingA = Number(a?.rating || 0);
            const ratingB = Number(b?.rating || 0);

            if (ratingB !== ratingA) {
              return ratingB - ratingA;
            }

            const reviewsA = Number(a?.reviewCount || 0);
            const reviewsB = Number(b?.reviewCount || 0);

            if (reviewsB !== reviewsA) {
              return reviewsB - reviewsA;
            }

            return (
              new Date(b?.createdAt || 0).getTime() -
              new Date(a?.createdAt || 0).getTime()
            );
          })
          .slice(0, 4);

        setProducts(bestSellingProducts);
      } catch (error) {
        console.error("Best selling products fetch error:", error);

        setError(
          error?.message || "Something went wrong while loading products.",
        );

        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellingProducts();
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
        // USER NOT LOGGED IN
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
        console.error("Bestselling wishlist fetch error:", error);

        setWishlistProductIds([]);
      } finally {
        setWishlistLoading(false);
      }
    };

    fetchWishlist();

    // ----------------------------------------------------------
    // KEEP WISHLIST IN SYNC WITH OTHER COMPONENTS
    // ----------------------------------------------------------

    const handleWishlistUpdate = () => {
      fetchWishlist();
    };

    window.addEventListener("wishlist:updated", handleWishlistUpdate);

    return () => {
      window.removeEventListener("wishlist:updated", handleWishlistUpdate);
    };
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

      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to add product to wishlist.");
      }

      // --------------------------------------------------------
      // UPDATE LOCAL STATE
      // --------------------------------------------------------

      setWishlistProductIds((current) =>
        current.includes(productId) ? current : [...current, productId],
      );

      setWishlistMessage("Product added to wishlist.");

      window.dispatchEvent(new Event("wishlist:updated"));

      window.setTimeout(() => {
        setWishlistMessage("");
      }, 2000);
    } catch (error) {
      console.error("Bestselling add to wishlist error:", error);

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

      if (!response.ok || !data.success) {
        throw new Error(
          data?.message || "Failed to remove product from wishlist.",
        );
      }

      // --------------------------------------------------------
      // IMPORTANT:
      // Remove ONLY this product from local state.
      //
      // This avoids depending on the exact DELETE response
      // structure returned by the API.
      // --------------------------------------------------------

      setWishlistProductIds((current) =>
        current.filter((id) => id !== productId),
      );

      setWishlistMessage("Product removed from wishlist.");

      window.dispatchEvent(new Event("wishlist:updated"));

      window.setTimeout(() => {
        setWishlistMessage("");
      }, 2000);
    } catch (error) {
      console.error("Bestselling remove from wishlist error:", error);

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
    if (!productId || wishlistActionProductId) {
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

      if (!response.ok || !data.success) {
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
      console.error("Bestselling add to cart error:", error);

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
            {/* Section Header */}

            <div className="mb-8 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between md:mb-11">
              <div>
                <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-[#DB4444] sm:mb-6 sm:gap-4 md:mb-9">
                  <span className="h-6 w-3 rounded-md bg-[#DB4444] sm:h-7 sm:w-3.5 md:h-8 md:w-4" />

                  <p>This Month</p>
                </div>

                <h2 className="text-2xl font-semibold tracking-[4%] sm:text-3xl md:text-4xl lg:text-[36px]">
                  Best Selling Products
                </h2>
              </div>

              <div className="h-10 w-24 animate-pulse rounded-md bg-[#F5F5F5] sm:h-11 sm:w-28 md:h-12 md:w-32" />
            </div>

            {/* Product Skeletons */}

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
            <div className="mb-8 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between md:mb-11">
              <div>
                <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-[#DB4444] sm:mb-6 sm:gap-4 md:mb-9">
                  <span className="h-6 w-3 rounded-md bg-[#DB4444] sm:h-7 sm:w-3.5 md:h-8 md:w-4" />

                  <p>This Month</p>
                </div>

                <h2 className="text-2xl font-semibold tracking-[4%] sm:text-3xl md:text-4xl lg:text-[36px]">
                  Best Selling Products
                </h2>
              </div>

              <Link
                href="/shop"
                className="inline-flex w-fit rounded-md bg-[#DB4444] px-6 py-2.5 text-xs font-medium text-white transition-colors hover:bg-black sm:px-7 sm:py-3 sm:text-sm md:px-8"
              >
                View All
              </Link>
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
            <div className="mb-8 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between md:mb-11">
              <div>
                <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-[#DB4444] sm:mb-6 sm:gap-4 md:mb-9">
                  <span className="h-6 w-3 rounded-md bg-[#DB4444] sm:h-7 sm:w-3.5 md:h-8 md:w-4" />

                  <p>This Month</p>
                </div>

                <h2 className="text-2xl font-semibold tracking-[4%] sm:text-3xl md:text-4xl lg:text-[36px]">
                  Best Selling Products
                </h2>
              </div>

              <Link
                href="/shop"
                className="inline-flex w-fit rounded-md bg-[#DB4444] px-6 py-2.5 text-xs font-medium text-white transition-colors hover:bg-black sm:px-7 sm:py-3 sm:text-sm md:px-8"
              >
                View All
              </Link>
            </div>

            <div className="rounded-md border border-[#E5E5E5] bg-[#F5F5F5] px-4 py-8 text-center sm:px-5 sm:py-12">
              <p className="text-xs text-[#7A7A7A] sm:text-sm">
                No products are available right now.
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
          {/* SECTION HEADER */}
          {/* ================================================== */}

          <div className="mb-8 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between md:mb-11">
            <div>
              <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-[#DB4444] sm:mb-6 sm:gap-4 md:mb-9">
                <span className="h-6 w-3 rounded-md bg-[#DB4444] sm:h-7 sm:w-3.5 md:h-8 md:w-4" />

                <p>This Month</p>
              </div>

              <h2 className="text-2xl font-semibold tracking-[4%] sm:text-3xl md:text-4xl lg:text-[36px]">
                Best Selling Products
              </h2>
            </div>

            {/* View All */}

            <div>
              <Link
                href="/shop"
                className="flex w-fit cursor-pointer items-center justify-center rounded-md border-0 bg-[#DB4444] px-6 py-2.5 text-xs text-white outline-0 transition-colors hover:bg-black sm:px-8 sm:py-3 sm:text-sm md:px-10 md:py-3.5 md:text-base lg:px-13 lg:py-4"
              >
                View All
              </Link>
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
          {/* PRODUCTS GRID */}
          {/* ================================================== */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
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

              const saleBadge = product?.saleBadge?.toString().trim() || "";

              const stock = Number(product?.stock || 0);

              const discountPercentage =
                originalPrice > productPrice && productPrice > 0
                  ? Math.round(
                      ((Number(originalPrice) - productPrice) /
                        Number(originalPrice)) *
                        100,
                    )
                  : 0;

              const isAdding = addingProductId === productId;

              const isWishlistAction = wishlistActionProductId === productId;

              const isWishlisted = wishlistProductIds.includes(productId);

              const isOutOfStock = stock <= 0;

              return (
                <div key={productId} className="w-full">
                  {/* ======================================== */}
                  {/* PRODUCT IMAGE */}
                  {/* ======================================== */}

                  <div className="group relative mb-4 flex h-56 items-center justify-center overflow-hidden rounded-md bg-[#F5F5F5] sm:mb-5 sm:h-64 md:h-70">
                    {/* Sale Badge */}

                    {!isOutOfStock && (saleBadge || discountPercentage > 0) && (
                      <span className="absolute left-2 top-2 z-10 rounded-sm bg-[#DB4444] px-2 py-0.5 text-[10px] font-medium text-white sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[11px]">
                        {saleBadge || `-${discountPercentage}%`}
                      </span>
                    )}

                    {/* Out Of Stock */}

                    {isOutOfStock && (
                      <span className="absolute left-2 top-2 z-10 rounded-sm bg-black px-2 py-0.5 text-[10px] font-medium text-white sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[11px]">
                        Out of Stock
                      </span>
                    )}

                    {/* Product Image */}

                    {productImage ? (
                      <Link
                        href={`/product/${productId}`}
                        className="flex h-full w-full items-center justify-center"
                      >
                        <img
                          src={productImage}
                          alt={productName}
                          className={`max-h-full max-w-full object-contain transition-transform duration-300 ${
                            isOutOfStock
                              ? "opacity-60"
                              : "group-hover:scale-105"
                          }`}
                        />
                      </Link>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#7A7A7A]">
                        No Image
                      </div>
                    )}

                    {/* ======================================== */}
                    {/* ACTION BUTTONS */}
                    {/* ======================================== */}

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

                  {/* ======================================== */}
                  {/* PRODUCT DETAILS */}
                  {/* ======================================== */}

                  <div className="font-medium">
                    {/* Product Name */}

                    <Link
                      href={`/product/${productId}`}
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

                    <div className="mt-2 mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3 md:mb-5">
                      <Stars rating={rating} reviewCount={reviewCount} />

                      {/* Numeric rating: only show when there are reviews */}

                      {reviewCount > 0 && (
                        <p className="text-xs font-semibold text-[#7A7A7A] sm:text-[13px] md:text-[14px]">
                          {rating.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bestselling;
