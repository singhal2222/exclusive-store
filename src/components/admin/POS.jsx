"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import POSBill from "./POSBill";

// ============================================================
// POS COMPONENT
// ============================================================

export default function POS() {
  // ----- search state -----
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // ----- cart state -----
  const [cart, setCart] = useState([]);

  // ----- customer / payment -----
  const [customerType, setCustomerType] = useState("retail");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // ----- submission -----
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bill, setBill] = useState(null);

  const searchTimeout = useRef(null);

  // ==========================================================
  // LOAD PRODUCTS (debounced)
  // ==========================================================
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      try {
        setLoadingProducts(true);
        const res = await fetch(
          `/api/pos/products?q=${encodeURIComponent(search)}&limit=30`,
        );
        const data = await res.json();
        if (data.success) setProducts(data.products);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoadingProducts(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  // ==========================================================
  // CART HELPERS
  // ==========================================================
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((c) =>
          c.productId === product._id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          mrp: product.price,
          image: product.image,
          stock: product.stock,
          quantity: 1,
          wholesaleDiscountPercentage: 0,
        },
      ];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.productId !== productId) return c;
          const next = c.quantity + delta;
          if (next < 1) return c;
          if (next > c.stock) return c;
          return { ...c, quantity: next };
        })
        .filter((c) => c.quantity > 0),
    );
  };

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const setWholesaleDiscount = (productId, value) => {
    const pct = Math.min(100, Math.max(0, parseFloat(value) || 0));
    setCart((prev) =>
      prev.map((c) =>
        c.productId === productId
          ? { ...c, wholesaleDiscountPercentage: pct }
          : c,
      ),
    );
  };

  const clearCart = () => setCart([]);

  // ==========================================================
  // TOTALS
  // ==========================================================
  const totals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;

    for (const c of cart) {
      const mrpTotal = c.mrp * c.quantity;
      subtotal += mrpTotal;

      if (customerType === "wholesale" && c.wholesaleDiscountPercentage > 0) {
        discount += (mrpTotal * c.wholesaleDiscountPercentage) / 100;
      }
    }

    const total = Math.max(0, subtotal - discount);
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount: cart.reduce((n, c) => n + c.quantity, 0),
    };
  }, [cart, customerType]);

  // ==========================================================
  // CREATE BILL
  // ==========================================================
  const handleCreateBill = async () => {
    setError("");

    if (cart.length === 0) {
      setError("Cart is empty");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        customerType,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        walkInCustomer: !customerName.trim() && !customerPhone.trim(),
        paymentMethod,
        items: cart.map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
          wholesaleDiscountPercentage:
            customerType === "wholesale" ? c.wholesaleDiscountPercentage : 0,
        })),
      };

      const res = await fetch("/api/pos/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create bill");
      }

      setBill(data.order);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMethod("cash");
      setCustomerType("retail");
      setSearch((s) => s);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="font-poppins">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-1.5 text-xl font-semibold tracking-[0.02em] text-black sm:text-2xl lg:text-[28px] xl:text-[32px]">
            Point of Sale
          </h1>

          <p className="text-xs text-[#7A7A7A] sm:text-[13px] lg:text-[15px]">
            In-store billing — retail &amp; wholesale
          </p>
        </div>

        <button
          type="button"
          onClick={clearCart}
          disabled={cart.length === 0}
          className="self-start rounded-lg border border-[#E5E5E5] bg-white px-4 py-2.5 text-xs font-medium text-[#7A7A7A] transition-colors hover:border-[#DB4444] hover:text-[#DB4444] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[13px]"
        >
          Clear Cart
        </button>
      </div>

      {/* ==================================================
          BODY
      ================================================== */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px] lg:gap-5">
        {/* ================================================
            LEFT COLUMN
        ================================================ */}

        <div className="space-y-4">
          {/* SEARCH */}

          <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#7A7A7A] sm:text-[12px]">
              Search Products
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a product name…"
              className="w-full rounded-lg bg-[#F5F5F5] px-4 py-2.5 text-[13px] text-black outline-none transition-all placeholder:text-[#7A7A7A] focus:ring-2 focus:ring-[#DB4444]/20 sm:text-[14px]"
            />
          </div>

          {/* PRODUCT LIST */}

          <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-3 sm:px-5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7A7A7A] sm:text-[12px]">
                Products
              </span>

              {loadingProducts && (
                <span className="text-[10px] text-[#7A7A7A] sm:text-[11px]">
                  Loading…
                </span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {products.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-[#7A7A7A] sm:text-[13px]">
                  No products found
                </p>
              ) : (
                products.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => addToCart(p)}
                    disabled={p.stock <= 0}
                    className="flex w-full items-center justify-between gap-3 border-b border-[#F5F5F5] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#FFF5F5] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-black sm:text-[13px]">
                        {p.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#7A7A7A] sm:text-[11px]">
                        Stock: {p.stock}
                      </p>
                    </div>

                    <span className="shrink-0 text-[12px] font-semibold text-[#DB4444] sm:text-[13px]">
                      ₹{p.price.toLocaleString("en-IN")}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* CART */}

          <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-3 sm:px-5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7A7A7A] sm:text-[12px]">
                Cart ({totals.itemCount} items)
              </span>

              <span className="text-[13px] font-semibold text-[#DB4444] sm:text-[14px]">
                ₹{totals.subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            {cart.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-[#7A7A7A] sm:text-[13px]">
                Cart is empty — click a product to add it
              </p>
            ) : (
              <div className="divide-y divide-[#F5F5F5]">
                {cart.map((c) => {
                  const mrpTotal = c.mrp * c.quantity;
                  const discountAmount =
                    customerType === "wholesale"
                      ? (mrpTotal * c.wholesaleDiscountPercentage) / 100
                      : 0;
                  const lineTotal = mrpTotal - discountAmount;
                  const unitPrice = lineTotal / c.quantity;

                  return (
                    <div key={c.productId} className="px-4 py-3 sm:px-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-medium text-black sm:text-[13px]">
                            {c.name}
                          </p>
                          <p className="mt-0.5 text-[10px] text-[#7A7A7A] sm:text-[11px]">
                            ₹{c.mrp.toLocaleString("en-IN")} × {c.quantity} = ₹
                            {mrpTotal.toLocaleString("en-IN")}
                          </p>
                        </div>

                        <button
                          onClick={() => removeItem(c.productId)}
                          className="text-[10px] font-medium text-[#DB4444] hover:underline sm:text-[11px]"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Wholesale discount */}
                      {customerType === "wholesale" && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <label className="text-[10px] text-[#7A7A7A] sm:text-[11px]">
                            Discount %
                          </label>

                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={c.wholesaleDiscountPercentage || ""}
                            onChange={(e) =>
                              setWholesaleDiscount(c.productId, e.target.value)
                            }
                            className="w-20 rounded-lg bg-[#F5F5F5] px-2.5 py-1 text-[11px] text-black outline-none transition-all focus:ring-2 focus:ring-[#DB4444]/20 sm:text-[12px]"
                            placeholder="0"
                          />

                          <span className="text-[10px] text-[#7A7A7A] sm:text-[11px]">
                            → ₹{unitPrice.toLocaleString("en-IN")} / unit
                          </span>

                          <span className="ml-auto text-[12px] font-semibold text-black sm:text-[13px]">
                            ₹{lineTotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}

                      {/* Quantity */}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(c.productId, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E5E5] bg-white text-sm text-[#7A7A7A] transition-colors hover:border-[#DB4444] hover:text-[#DB4444]"
                        >
                          −
                        </button>

                        <span className="w-8 text-center text-[12px] font-medium text-black sm:text-[13px]">
                          {c.quantity}
                        </span>

                        <button
                          onClick={() => updateQuantity(c.productId, 1)}
                          disabled={c.quantity >= c.stock}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E5E5] bg-white text-sm text-[#7A7A7A] transition-colors hover:border-[#DB4444] hover:text-[#DB4444] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================================================
            RIGHT COLUMN
        ================================================ */}

        <div className="space-y-4">
          {/* CUSTOMER TYPE */}

          <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#7A7A7A] sm:text-[12px]">
              Customer Type
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCustomerType("retail")}
                className={`rounded-lg border px-3 py-2.5 text-[12px] font-medium transition-all sm:text-[13px] ${
                  customerType === "retail"
                    ? "border-[#DB4444] bg-[#DB4444] text-white shadow-md shadow-[#DB4444]/20"
                    : "border-[#E5E5E5] bg-white text-[#7A7A7A] hover:border-[#DB4444] hover:text-[#DB4444]"
                }`}
              >
                Retail
              </button>

              <button
                onClick={() => setCustomerType("wholesale")}
                className={`rounded-lg border px-3 py-2.5 text-[12px] font-medium transition-all sm:text-[13px] ${
                  customerType === "wholesale"
                    ? "border-[#DB4444] bg-[#DB4444] text-white shadow-md shadow-[#DB4444]/20"
                    : "border-[#E5E5E5] bg-white text-[#7A7A7A] hover:border-[#DB4444] hover:text-[#DB4444]"
                }`}
              >
                Wholesale
              </button>
            </div>

            <p className="mt-2 text-[10px] leading-4 text-[#7A7A7A] sm:text-[11px]">
              {customerType === "retail"
                ? "Bills at product MRP. No per-item discounts."
                : "Enter a discount % per product at billing time."}
            </p>
          </div>

          {/* CUSTOMER INFO */}

          <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#7A7A7A] sm:text-[12px]">
              Customer Info (optional)
            </label>

            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Name"
              className="mb-2 w-full rounded-lg bg-[#F5F5F5] px-4 py-2.5 text-[13px] text-black outline-none transition-all placeholder:text-[#7A7A7A] focus:ring-2 focus:ring-[#DB4444]/20 sm:text-[14px]"
            />

            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone"
              className="w-full rounded-lg bg-[#F5F5F5] px-4 py-2.5 text-[13px] text-black outline-none transition-all placeholder:text-[#7A7A7A] focus:ring-2 focus:ring-[#DB4444]/20 sm:text-[14px]"
            />
          </div>

          {/* PAYMENT METHOD */}

          <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#7A7A7A] sm:text-[12px]">
              Payment Method
            </label>

            <div className="grid grid-cols-3 gap-2">
              {["cash", "card", "upi"].map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`rounded-lg border px-2 py-2.5 text-[11px] font-medium capitalize transition-all sm:text-[12px] ${
                    paymentMethod === m
                      ? "border-[#DB4444] bg-[#DB4444] text-white shadow-md shadow-[#DB4444]/20"
                      : "border-[#E5E5E5] bg-white text-[#7A7A7A] hover:border-[#DB4444] hover:text-[#DB4444]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* TOTALS */}

          <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5">
            <div className="space-y-1.5 text-[12px] sm:text-[13px]">
              <div className="flex justify-between text-[#7A7A7A]">
                <span>Subtotal (MRP)</span>
                <span className="text-black">
                  ₹{totals.subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              {customerType === "wholesale" && (
                <div className="flex justify-between text-[#DB4444]">
                  <span>Wholesale Discount</span>
                  <span>−₹{totals.discount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="mt-2 flex justify-between border-t border-[#E5E5E5] pt-2 text-base font-semibold text-black sm:text-[17px]">
                <span>Total</span>
                <span className="text-[#DB4444]">
                  ₹{totals.total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[11px] text-red-600 sm:text-[12px]">
              {error}
            </div>
          )}

          {/* SUBMIT */}

          <button
            onClick={handleCreateBill}
            disabled={submitting || cart.length === 0}
            className="w-full rounded-lg bg-[#DB4444] px-4 py-3 text-[13px] font-semibold text-white shadow-md shadow-[#DB4444]/20 transition-all hover:bg-[#c93a3a] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[14px]"
          >
            {submitting ? "Creating bill…" : "Create Bill"}
          </button>
        </div>
      </div>

      {/* BILL MODAL */}

      {bill && <POSBill bill={bill} onClose={() => setBill(null)} />}
    </div>
  );
}
