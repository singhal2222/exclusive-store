"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { FiMinus, FiPlus, FiTrash2, FiShoppingBag } from "react-icons/fi";

// ============================================================
// CART COMPONENT
// ============================================================

const Cart = () => {
  // ==========================================================
  // STATES
  // ==========================================================

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [removingProductId, setRemovingProductId] = useState(null);
  const [error, setError] = useState("");

  // ==========================================================
  // FETCH CART
  // ==========================================================

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/cart", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch cart.");
      }

      setCart(
        data?.cart || {
          items: [],
        },
      );
    } catch (error) {
      console.error("Fetch cart error:", error);

      setError(
        error?.message || "Something went wrong while loading your cart.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchCart();
  }, []);

  // ==========================================================
  // FORMAT PRICE
  // ==========================================================

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(price || 0);
  };

  // ==========================================================
  // GET PRODUCT IMAGE
  // ==========================================================

  const getProductImage = (product) => {
    if (!product) return "";

    // --------------------------------------------------------
    // MULTIPLE IMAGES
    // --------------------------------------------------------

    if (Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];

      if (typeof firstImage === "string") {
        return firstImage;
      }

      if (typeof firstImage === "object") {
        return (
          firstImage?.url || firstImage?.secure_url || firstImage?.src || ""
        );
      }
    }

    // --------------------------------------------------------
    // SINGLE IMAGE
    // --------------------------------------------------------

    if (typeof product.image === "string") {
      return product.image;
    }

    if (typeof product.image === "object") {
      return (
        product.image?.url ||
        product.image?.secure_url ||
        product.image?.src ||
        ""
      );
    }

    return "";
  };

  // ==========================================================
  // GET PRODUCT NAME
  // ==========================================================

  const getProductName = (product) => {
    if (!product) return "Product";

    return product.name || product.title || product.productName || "Product";
  };

  // ==========================================================
  // UPDATE QUANTITY
  // ==========================================================

  const updateQuantity = async (productId, quantity) => {
    if (!productId) return;

    if (quantity < 1) return;

    if (quantity > 99) {
      setError("Quantity cannot exceed 99.");
      return;
    }

    try {
      setUpdatingProductId(productId);
      setError("");

      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          productId,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update quantity.");
      }

      setCart(
        data?.cart || {
          items: [],
        },
      );
    } catch (error) {
      console.error("Update cart quantity error:", error);

      setError(
        error?.message || "Something went wrong while updating the cart.",
      );
    } finally {
      setUpdatingProductId(null);
    }
  };

  // ==========================================================
  // REMOVE PRODUCT
  // ==========================================================

  const removeItem = async (productId) => {
    if (!productId) return;

    try {
      setRemovingProductId(productId);
      setError("");

      const response = await fetch("/api/cart", {
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

      if (!response.ok) {
        throw new Error(data?.message || "Failed to remove product.");
      }

      setCart(
        data?.cart || {
          items: [],
        },
      );
    } catch (error) {
      console.error("Remove cart item error:", error);

      setError(
        error?.message || "Something went wrong while removing the product.",
      );
    } finally {
      setRemovingProductId(null);
    }
  };

  // ==========================================================
  // CART ITEMS
  // ==========================================================

  const items = Array.isArray(cart?.items) ? cart.items : [];

  // ==========================================================
  // TOTAL ITEMS
  // ==========================================================

  const totalItems = useMemo(() => {
    return items.reduce(
      (total, item) => total + Number(item?.quantity || 0),
      0,
    );
  }, [items]);

  // ==========================================================
  // SUBTOTAL
  // ==========================================================

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      const price = Number(item?.price || 0);
      const quantity = Number(item?.quantity || 0);

      return total + price * quantity;
    }, 0);
  }, [items]);

  // ==========================================================
  // TOTAL
  // ==========================================================

  const total = subtotal;

  // ==========================================================
  // LOADING UI
  // ==========================================================

  if (loading) {
    return (
      <section className="min-h-screen bg-[#F5F5F5] px-4 py-6 font-poppins sm:px-6 sm:py-8 lg:px-10 lg:py-10 xl:px-16">
        <div className="mx-auto w-full max-w-7xl">
          {/* ==================================================
              HEADER SKELETON
          ================================================== */}

          <div className="mb-6 sm:mb-8">
            <div className="h-6 w-32 animate-pulse rounded bg-gray-200 sm:h-7 sm:w-40" />

            <div className="mt-3 h-4 w-44 animate-pulse rounded bg-gray-200 sm:w-56" />
          </div>

          {/* ==================================================
              CONTENT SKELETON
          ================================================== */}

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1fr_360px]">
            {/* Product Skeletons */}

            <div className="space-y-3 sm:space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse gap-3 rounded-lg border border-[#E5E5E5] bg-white p-3 sm:gap-4 sm:p-4"
                >
                  <div className="h-20 w-24 shrink-0 rounded-md bg-gray-200 sm:h-24 sm:w-24" />

                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-40 rounded bg-gray-200 sm:h-5 sm:w-48" />

                    <div className="h-3.5 w-20 rounded bg-gray-200 sm:h-4 sm:w-24" />

                    <div className="h-8 w-24 rounded bg-gray-200 sm:h-9 sm:w-28" />
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Skeleton */}

            <div className="h-64 animate-pulse rounded-lg bg-gray-200 sm:h-72" />
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================
  // EMPTY CART
  // ==========================================================

  if (!loading && items.length === 0) {
    return (
      <section className="min-h-screen bg-[#F5F5F5] px-4 py-6 font-poppins sm:px-6 sm:py-8 lg:px-10 xl:px-16">
        <div className="mx-auto flex min-h-[75vh] w-full max-w-7xl items-center justify-center">
          <div className="flex max-w-md flex-col items-center px-4 text-center">
            {/* Icon */}

            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF5F5] sm:h-20 sm:w-20">
              <FiShoppingBag size={28} className="text-[#DB4444] sm:hidden" />
              <FiShoppingBag
                size={36}
                className="hidden text-[#DB4444] sm:block"
              />
            </div>

            {/* Heading */}

            <h1 className="text-xl font-semibold text-black sm:text-2xl md:text-3xl">
              Your Cart Is Empty
              <span className="text-[#DB4444]">.</span>
            </h1>

            {/* Description */}

            <p className="mt-2 text-xs leading-5 text-[#7A7A7A] sm:text-[13px] sm:leading-6">
              You haven't added any products to your cart yet.
            </p>

            {/* Continue Shopping */}

            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-md bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-black sm:px-6 sm:py-3 sm:text-[13px]"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================
  // MAIN CART UI
  // ==========================================================

  return (
    <section className="min-h-screen bg-[#F5F5F5] px-4 py-6 font-poppins sm:px-6 sm:py-8 lg:px-10 lg:py-10 xl:px-16">
      <div className="mx-auto w-full max-w-7xl">
        {/* ====================================================
            PAGE HEADING
        ==================================================== */}

        <div className="mb-5 sm:mb-6">
          <p className="mb-1 text-xs text-[#7A7A7A] sm:text-[13px]">Shopping</p>

          <h1 className="text-xl font-semibold text-black sm:text-2xl md:text-3xl">
            Shopping Cart
            <span className="text-[#DB4444]">.</span>
          </h1>

          <p className="mt-1 text-xs text-[#7A7A7A] sm:text-[13px]">
            {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        {/* ====================================================
            ERROR MESSAGE
        ==================================================== */}

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600 sm:mb-5 sm:px-4 sm:py-3 sm:text-[13px]">
            {error}
          </div>
        )}

        {/* ====================================================
            CART CONTENT
        ==================================================== */}

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1fr_360px]">
          {/* ==================================================
              LEFT SIDE
          ================================================== */}

          <div className="min-w-0 space-y-3 sm:space-y-4">
            {items.map((item) => {
              const product = item?.product;

              const productId =
                typeof product === "object" ? product?._id : product;

              const quantity = Number(item?.quantity || 1);

              const price = Number(item?.price || 0);

              const itemSubtotal = price * quantity;

              const image = getProductImage(product);

              const productName = getProductName(product);

              const isUpdating = updatingProductId === productId;

              const isRemoving = removingProductId === productId;

              return (
                <div
                  key={item?._id || productId}
                  className="rounded-lg border border-[#E5E5E5] bg-white p-3.5 transition-colors hover:border-[#DB4444] sm:p-4"
                >
                  <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:gap-4">
                    {/* ========================================
                        PRODUCT IMAGE
                    ======================================== */}

                    <div className="mx-auto flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F5F5F5] sm:mx-0 sm:h-24 sm:w-24">
                      {image ? (
                        <img
                          src={image}
                          alt={productName}
                          className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105 sm:object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[11px] text-[#7A7A7A]">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* ========================================
                        PRODUCT DETAILS
                    ======================================== */}

                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:gap-4">
                      <div>
                        <h2 className="line-clamp-2 text-sm font-semibold text-black sm:text-[15px]">
                          {productName}
                        </h2>

                        <p className="mt-1 text-xs text-[#7A7A7A] sm:text-[13px]">
                          {formatPrice(price)}
                        </p>
                      </div>

                      {/* Quantity + Remove */}

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        {/* Quantity */}

                        <div className="flex h-9 items-center rounded-md border border-[#E5E5E5] bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(productId, quantity - 1)
                            }
                            disabled={isUpdating || quantity <= 1}
                            className="flex h-full w-9 items-center justify-center text-[#7A7A7A] transition-colors hover:bg-[#FFF5F5] hover:text-[#DB4444] disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Decrease quantity"
                          >
                            <FiMinus size={14} />
                          </button>

                          <span className="flex h-full min-w-9 items-center justify-center border-x border-[#E5E5E5] px-2.5 text-xs font-medium text-black sm:text-[13px]">
                            {isUpdating ? "..." : quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(productId, quantity + 1)
                            }
                            disabled={isUpdating || quantity >= 99}
                            className="flex h-full w-9 items-center justify-center text-[#7A7A7A] transition-colors hover:bg-[#FFF5F5] hover:text-[#DB4444] disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            <FiPlus size={14} />
                          </button>
                        </div>

                        {/* Remove */}

                        <button
                          type="button"
                          onClick={() => removeItem(productId)}
                          disabled={isRemoving}
                          className="inline-flex items-center gap-1.5 text-[11px] text-[#7A7A7A] transition-colors hover:text-[#DB4444] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[12px]"
                        >
                          <FiTrash2 size={14} />

                          {isRemoving ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>

                    {/* ========================================
                        ITEM SUBTOTAL
                    ======================================== */}

                    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[#E5E5E5] pt-3 text-left sm:flex-col sm:items-end sm:justify-start sm:border-t-0 sm:pt-0 sm:text-right">
                      <p className="text-[10px] text-[#7A7A7A] sm:text-[11px]">
                        Subtotal
                      </p>

                      <p className="text-sm font-semibold text-black sm:mt-1 sm:text-[14px]">
                        {formatPrice(itemSubtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ==================================================
                CONTINUE SHOPPING
            ================================================== */}

            <div className="pt-1">
              <Link
                href="/"
                className="inline-flex items-center text-xs font-medium text-black transition-colors hover:text-[#DB4444] sm:text-[13px]"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* ==================================================
              RIGHT SIDE - ORDER SUMMARY
          ================================================== */}

          <div className="h-fit rounded-lg border border-[#E5E5E5] bg-white p-4 sm:p-5 lg:sticky lg:top-6 lg:p-6">
            <h2 className="text-base font-semibold text-black sm:text-lg">
              Order Summary
            </h2>

            <p className="mt-1 text-[11px] text-[#7A7A7A] sm:text-[12px]">
              Review your cart before checkout.
            </p>

            {/* Summary */}

            <div className="mt-5 space-y-3.5 sm:mt-6 sm:space-y-4">
              {/* Items */}

              <div className="flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-[#7A7A7A]">Items</span>

                <span className="font-medium text-black">{totalItems}</span>
              </div>

              {/* Subtotal */}

              <div className="flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-[#7A7A7A]">Subtotal</span>

                <span className="font-medium text-black">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {/* Shipping */}

              <div className="flex items-center justify-between gap-3 text-xs sm:text-[13px]">
                <span className="text-[#7A7A7A]">Shipping</span>

                <span className="text-right text-[#7A7A7A]">
                  Calculated at checkout
                </span>
              </div>

              {/* Divider + Total */}

              <div className="border-t border-[#E5E5E5] pt-3.5 sm:pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-black sm:text-[14px]">
                    Total
                  </span>

                  <span className="text-lg font-semibold text-[#DB4444]">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* ==================================================
                CHECKOUT BUTTON
            ================================================== */}

            <Link
              href="/checkout"
              className="mt-5 block w-full rounded-md bg-[#DB4444] px-5 py-3 text-center text-xs font-medium text-white transition-colors hover:bg-black sm:mt-6 sm:text-[13px]"
            >
              Proceed to Checkout
            </Link>

            <p className="mt-3 text-center text-[10px] leading-5 text-[#7A7A7A] sm:text-[11px]">
              Checkout will be available once the checkout and payment module is
              completed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cart;
