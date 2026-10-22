"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiHeart,
  FiShoppingCart,
  FiTrash2,
  FiEye,
  FiPackage,
} from "react-icons/fi";
import Stars from "@/components/Stars";

const Wishlist = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingProductId, setRemovingProductId] = useState(null);
  const [addingProductId, setAddingProductId] = useState(null);
  const [message, setMessage] = useState("");

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
  // FETCH WISHLIST
  // ============================================================

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/wishlist", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 401) {
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch your wishlist.");
      }

      setProducts(
        Array.isArray(data?.wishlist?.products) ? data.wishlist.products : [],
      );
    } catch (error) {
      console.error("Fetch wishlist error:", error);

      setError(
        error?.message || "Something went wrong while loading your wishlist.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL FETCH
  // ============================================================

  useEffect(() => {
    fetchWishlist();
  }, []);

  // ============================================================
  // REMOVE PRODUCT
  // ============================================================

  const removeFromWishlist = async (productId) => {
    if (!productId || removingProductId) {
      return;
    }

    try {
      setRemovingProductId(productId);
      setMessage("");
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

      if (response.status === 401) {
        window.location.href = "/auth/login";
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to remove product from wishlist.",
        );
      }

      setProducts(
        Array.isArray(data?.wishlist?.products) ? data.wishlist.products : [],
      );

      setMessage("Product removed from wishlist.");

      window.setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch (error) {
      console.error("Remove wishlist product error:", error);

      setError(
        error?.message || "Something went wrong while removing the product.",
      );
    } finally {
      setRemovingProductId(null);
    }
  };

  // ============================================================
  // ADD PRODUCT TO CART
  // ============================================================

  const addToCart = async (productId) => {
    if (!productId || addingProductId) {
      return;
    }

    try {
      setAddingProductId(productId);
      setMessage("");
      setError("");

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

      if (response.status === 401) {
        window.location.href = "/auth/login";
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || "Failed to add product to cart.");
      }

      setMessage("Product added to cart successfully.");

      // Tell Header to refresh cart count.
      window.dispatchEvent(new Event("cart:updated"));

      window.setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch (error) {
      console.error("Wishlist add to cart error:", error);

      setError(
        error?.message ||
          "Something went wrong while adding the product to cart.",
      );
    } finally {
      setAddingProductId(null);
    }
  };

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {
    return (
      <section className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <div className="animate-pulse">
            <div className="mb-2 h-7 w-40 rounded bg-gray-200 sm:h-8 sm:w-48" />
            <div className="mb-6 h-4 w-56 rounded bg-gray-200 sm:mb-8 sm:w-72" />

            <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item}>
                  <div className="h-56 rounded-xl bg-gray-200 sm:h-64" />
                  <div className="mt-4 h-4 w-32 rounded bg-gray-200 sm:h-5 sm:w-40" />
                  <div className="mt-3 h-3.5 w-20 rounded bg-gray-200 sm:h-4 sm:w-24" />
                  <div className="mt-3 h-3.5 w-16 rounded bg-gray-200 sm:h-4 sm:w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================

  if (error) {
    return (
      <section className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center sm:p-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white sm:h-14 sm:w-14">
              <FiHeart size={22} className="text-[#DB4444] sm:hidden" />
              <FiHeart size={25} className="hidden text-[#DB4444] sm:block" />
            </div>

            <h1 className="mt-4 text-base font-semibold text-red-600 sm:text-xl">
              Unable to load wishlist
            </h1>

            <p className="mt-2 text-xs leading-5 text-[#7A7A7A] sm:text-sm sm:leading-6">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchWishlist}
              className="mt-5 rounded-md bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[#C83D3D] sm:text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // EMPTY STATE
  // ============================================================

  if (products.length === 0) {
    return (
      <section className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl font-semibold text-[#000000] sm:text-2xl md:text-3xl">
              My Wishlist
            </h1>

            <p className="mt-2 text-xs text-[#7A7A7A] sm:text-sm">
              Welcome back, {user?.name || "Customer"}.
            </p>
          </div>

          <div className="rounded-xl border border-[#E5E5E5] bg-white px-5 py-12 text-center sm:px-6 sm:py-16">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF5F5] sm:h-16 sm:w-16">
              <FiHeart size={24} className="text-[#DB4444] sm:hidden" />
              <FiHeart size={28} className="hidden text-[#DB4444] sm:block" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-[#000000] sm:text-xl">
              Your wishlist is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#7A7A7A] sm:text-sm sm:leading-6">
              You have not added any products to your wishlist yet. Save your
              favorite products here and come back to them later.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex items-center justify-center rounded-md bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[#C83D3D] sm:px-6 sm:py-3 sm:text-sm"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // WISHLIST
  // ============================================================

  return (
    <section className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl font-semibold text-[#000000] sm:text-2xl md:text-3xl">
            My Wishlist
          </h1>

          <p className="mt-2 text-xs text-[#7A7A7A] sm:text-sm">
            Hello {user?.name || "Customer"}, here are the products you saved.
          </p>
        </div>

        {/* ================================================== */}
        {/* MESSAGE */}
        {/* ================================================== */}

        {message && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-600 sm:mb-6 sm:px-4 sm:py-3 sm:text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600 sm:mb-6 sm:px-4 sm:py-3 sm:text-sm">
            {error}
          </div>
        )}

        {/* ================================================== */}
        {/* WISHLIST COUNT */}
        {/* ================================================== */}

        <div className="mb-4 flex items-center gap-2 text-xs text-[#7A7A7A] sm:mb-6 sm:gap-3 sm:text-sm">
          <FiPackage size={16} className="sm:hidden" />
          <FiPackage size={18} className="hidden sm:block" />

          <span>
            {products.length} {products.length === 1 ? "product" : "products"}
          </span>
        </div>

        {/* ================================================== */}
        {/* PRODUCT GRID */}
        {/* ================================================== */}

        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const productId = product?._id?.toString();
            const productName = product?.name || "Product";
            const productImage = product?.image || "";
            const productPrice = Number(product?.price || 0);
            const originalPrice = product?.originalPrice;
            const rating = Number(product?.rating || 0);
            const saleBadge = product?.saleBadge || "";
            const stock = Number(product?.stock || 0);

            const isRemoving = removingProductId === productId;

            const isAdding = addingProductId === productId;

            const isOutOfStock = stock <= 0;

            return (
              <div key={productId} className="group">
                {/* ================================================== */}
                {/* IMAGE */}
                {/* ================================================== */}

                <div className="relative mb-4 flex h-56 items-center justify-center overflow-hidden rounded-xl bg-[#F5F5F5] sm:mb-5 sm:h-64">
                  {/* BADGES */}

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
                  </div>

                  {/* PRODUCT IMAGE */}

                  {productImage ? (
                    <img
                      src={productImage}
                      alt={productName}
                      className={`max-h-full max-w-full object-contain transition-transform duration-300 ${
                        isOutOfStock ? "opacity-60" : "group-hover:scale-105"
                      }`}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-[#7A7A7A]">
                      No Image
                    </div>
                  )}

                  {/* ================================================== */}
                  {/* ACTION ICONS */}
                  {/* ================================================== */}

                  <div className="absolute right-2 top-2 flex flex-col gap-2 sm:right-3 sm:top-3 sm:gap-2.5">
                    {/* REMOVE */}

                    <button
                      type="button"
                      onClick={() => removeFromWishlist(productId)}
                      disabled={isRemoving}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-[#DB4444] transition-colors hover:bg-[#FFF5F5] disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9"
                      aria-label={`Remove ${productName} from wishlist`}
                    >
                      {isRemoving ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#DB4444] border-t-transparent sm:h-4 sm:w-4" />
                      ) : (
                        <FiHeart className="h-4 w-4 fill-[#DB4444] sm:h-5 sm:w-5" />
                      )}
                    </button>

                    {/* VIEW PRODUCT */}

                    <Link
                      href={`/products/${productId}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white transition-colors hover:bg-[#FFF5F5] hover:text-[#DB4444] sm:h-9 sm:w-9"
                      aria-label={`View ${productName}`}
                    >
                      <FiEye className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Link>
                  </div>

                  {/* ================================================== */}
                  {/* ADD TO CART */}
                  {/* ================================================== */}

                  <button
                    type="button"
                    onClick={() => addToCart(productId)}
                    disabled={isAdding || isOutOfStock || isRemoving}
                    className="absolute bottom-0 left-0 w-full cursor-pointer rounded-bl-xl rounded-br-xl border-0 bg-black py-2 text-xs font-medium text-white transition-colors hover:bg-[#DB4444] disabled:cursor-not-allowed disabled:opacity-70 sm:py-3 sm:text-sm"
                  >
                    {isOutOfStock
                      ? "Out of Stock"
                      : isAdding
                        ? "Adding..."
                        : "Add to Cart"}
                  </button>
                </div>

                {/* ================================================== */}
                {/* PRODUCT DETAILS */}
                {/* ================================================== */}

                <div className="font-medium">
                  <Link
                    href={`/products/${productId}`}
                    className="mb-2 block line-clamp-2 text-sm transition-colors hover:text-[#DB4444] sm:mb-2.5 sm:text-[15px] md:text-base"
                  >
                    {productName}
                  </Link>

                  {/* PRICE */}

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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

                  {/* RATING */}

                  <div className="mt-2">
                    <Stars rating={rating} />
                  </div>

                  {/* STOCK */}

                  <div className="mt-1.5 text-[11px] sm:mt-2 sm:text-[12px]">
                    {isOutOfStock ? (
                      <span className="text-red-500">
                        Currently unavailable
                      </span>
                    ) : (
                      <span className="text-[#7A7A7A]">
                        {stock} {stock === 1 ? "item" : "items"} available
                      </span>
                    )}
                  </div>

                  {/* ADD TO CART LINK */}

                  <button
                    type="button"
                    onClick={() => addToCart(productId)}
                    disabled={isAdding || isOutOfStock || isRemoving}
                    className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-[#DB4444] transition hover:text-black disabled:cursor-not-allowed disabled:opacity-50 sm:mt-4 sm:text-sm"
                  >
                    <FiShoppingCart size={15} className="sm:hidden" />
                    <FiShoppingCart size={16} className="hidden sm:block" />

                    {isAdding ? "Adding..." : "Add to Cart"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Wishlist;
