"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FiCheck, FiMapPin, FiShoppingBag } from "react-icons/fi";

// ============================================================
// CHECKOUT COMPONENT
// ============================================================

const Checkout = ({ user }) => {
  // ============================================================
  // ROUTER
  // ============================================================

  const router = useRouter();

  // ============================================================
  // STATES
  // ============================================================

  const [cart, setCart] = useState(null);

  const [addresses, setAddresses] = useState([]);

  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [saveAddress, setSaveAddress] = useState(false);

  // ============================================================
  // COUPON STATES
  // ============================================================

  const [couponCode, setCouponCode] = useState("");

  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [couponDiscount, setCouponDiscount] = useState(0);

  const [couponLoading, setCouponLoading] = useState(false);

  const [couponMessage, setCouponMessage] = useState("");

  const [couponError, setCouponError] = useState("");

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: user?.phone || "",
    email: user?.email || "",
  });

  // ============================================================
  // FETCH CART + ADDRESSES
  // ============================================================

  useEffect(() => {
    const controller = new AbortController();

    const fetchCheckoutData = async () => {
      try {
        setLoading(true);
        setError("");

        const [cartResponse, addressResponse] = await Promise.all([
          fetch("/api/cart", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }),

          fetch("/api/addresses", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        const cartData = await cartResponse.json();

        const addressData = await addressResponse.json();

        // ----------------------------------------------------
        // CART ERROR
        // ----------------------------------------------------

        if (!cartResponse.ok) {
          throw new Error(cartData?.message || "Failed to load your cart.");
        }

        // ----------------------------------------------------
        // ADDRESS ERROR
        // ----------------------------------------------------

        if (!addressResponse.ok) {
          throw new Error(
            addressData?.message || "Failed to load your addresses.",
          );
        }

        // ----------------------------------------------------
        // CART
        // ----------------------------------------------------

        const cartDataObject = cartData?.cart || {
          items: [],
        };

        setCart(cartDataObject);

        // ----------------------------------------------------
        // ADDRESSES
        // ----------------------------------------------------

        const savedAddresses = Array.isArray(addressData?.addresses)
          ? addressData.addresses
          : [];

        setAddresses(savedAddresses);

        // ----------------------------------------------------
        // DEFAULT ADDRESS
        // ----------------------------------------------------

        const defaultAddress =
          savedAddresses.find((address) => address?.isDefault === true) ||
          savedAddresses[0];

        if (defaultAddress) {
          const addressId = defaultAddress?._id || "";

          setSelectedAddressId(addressId);

          setFormData({
            fullName: defaultAddress?.fullName || user?.name || "",

            addressLine1: defaultAddress?.addressLine1 || "",

            addressLine2: defaultAddress?.addressLine2 || "",

            city: defaultAddress?.city || "",

            state: defaultAddress?.state || "",

            postalCode: defaultAddress?.postalCode || "",

            country: defaultAddress?.country || "India",

            phone: defaultAddress?.phone || user?.phone || "",

            email: user?.email || "",
          });
        } else {
          setFormData((current) => ({
            ...current,
            fullName: current.fullName || user?.name || "",
            phone: current.phone || user?.phone || "",
            email: current.email || user?.email || "",
          }));
        }
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("Checkout data fetch error:", error);

        setError(
          error?.message || "Something went wrong while loading checkout.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchCheckoutData();

    return () => {
      controller.abort();
    };
  }, [user]);

  // ============================================================
  // HANDLE FORM CHANGE
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Once the customer edits the fields manually,
    // the form becomes the current source of truth.
    if (name !== "email" && selectedAddressId) {
      setSelectedAddressId("");
    }

    setError("");
    setSuccess("");
  };

  // ============================================================
  // SELECT SAVED ADDRESS
  // ============================================================

  const handleSelectAddress = (address) => {
    if (!address) {
      return;
    }

    setSelectedAddressId(address?._id || "");

    setFormData({
      fullName: address?.fullName || user?.name || "",

      addressLine1: address?.addressLine1 || "",

      addressLine2: address?.addressLine2 || "",

      city: address?.city || "",

      state: address?.state || "",

      postalCode: address?.postalCode || "",

      country: address?.country || "India",

      phone: address?.phone || user?.phone || "",

      email: user?.email || "",
    });

    setError("");
    setSuccess("");
  };

  // ============================================================
  // CART ITEMS
  // ============================================================

  const items = Array.isArray(cart?.items) ? cart.items : [];

  // ============================================================
  // TOTAL ITEMS
  // ============================================================

  const totalItems = useMemo(() => {
    return items.reduce(
      (total, item) => total + Number(item?.quantity || 0),
      0,
    );
  }, [items]);

  // ============================================================
  // SUBTOTAL
  // ============================================================

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      const price = Number(item?.price || 0);

      const quantity = Number(item?.quantity || 0);

      return total + price * quantity;
    }, 0);
  }, [items]);

  // ============================================================
  // SHIPPING
  // ============================================================

  const shipping = 0;

  // ============================================================
  // FINAL TOTAL
  // ============================================================

  const total = Math.max(0, subtotal - Number(couponDiscount || 0) + shipping);

  // ============================================================
  // FORMAT PRICE
  // ============================================================

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(price) || 0);
  };

  // ============================================================
  // GET PRODUCT IMAGE
  // ============================================================

  const getProductImage = (product) => {
    if (!product) {
      return "";
    }

    // ----------------------------------------------------------
    // SUPPORT ARRAY FORMAT
    // ----------------------------------------------------------

    if (Array.isArray(product?.images) && product.images.length > 0) {
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

    // ----------------------------------------------------------
    // CURRENT PRODUCT MODEL
    // ----------------------------------------------------------

    if (typeof product?.image === "string") {
      return product.image;
    }

    if (typeof product?.image === "object") {
      return (
        product?.image?.url ||
        product?.image?.secure_url ||
        product?.image?.src ||
        ""
      );
    }

    return "";
  };

  // ============================================================
  // GET PRODUCT NAME
  // ============================================================

  const getProductName = (product) => {
    if (!product) {
      return "Product";
    }

    return product?.name || product?.title || product?.productName || "Product";
  };

  // ============================================================
  // APPLY COUPON
  // ============================================================

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();

    setCouponError("");
    setCouponMessage("");

    if (!code) {
      setCouponError("Please enter a coupon code.");

      return;
    }

    if (items.length === 0) {
      setCouponError("Your cart is empty.");

      return;
    }

    try {
      setCouponLoading(true);

      const response = await fetch("/api/coupons/validate", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          code,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Unable to apply this coupon.");
      }

      const discount = Number(data?.pricing?.discount || 0);

      setAppliedCoupon(data?.coupon || null);

      setCouponDiscount(discount);

      setCouponCode(data?.coupon?.code || code);

      setCouponMessage(data?.message || "Coupon applied successfully.");

      setCouponError("");

      setError("");
    } catch (error) {
      console.error("Apply coupon error:", error);

      setAppliedCoupon(null);

      setCouponDiscount(0);

      setCouponMessage("");

      setCouponError(
        error?.message || "Something went wrong while applying the coupon.",
      );
    } finally {
      setCouponLoading(false);
    }
  };

  // ============================================================
  // REMOVE COUPON
  // ============================================================

  const handleRemoveCoupon = () => {
    setCouponCode("");

    setAppliedCoupon(null);

    setCouponDiscount(0);

    setCouponMessage("");

    setCouponError("");
  };

  // ============================================================
  // VALIDATE BILLING DETAILS
  // ============================================================

  const validateForm = () => {
    const fullName = formData.fullName.trim();

    const addressLine1 = formData.addressLine1.trim();

    const city = formData.city.trim();

    const state = formData.state.trim();

    const postalCode = formData.postalCode.trim();

    const phone = formData.phone.trim();

    const email = formData.email.trim();

    // ----------------------------------------------------------
    // REQUIRED FIELDS
    // ----------------------------------------------------------

    if (
      !fullName ||
      !addressLine1 ||
      !city ||
      !state ||
      !postalCode ||
      !phone
    ) {
      setError("Please fill all required billing details.");

      return false;
    }

    // ----------------------------------------------------------
    // FULL NAME
    // ----------------------------------------------------------

    if (fullName.length < 2) {
      setError("Full name must be at least 2 characters.");

      return false;
    }

    if (fullName.length > 50) {
      setError("Full name must not exceed 50 characters.");

      return false;
    }

    // ----------------------------------------------------------
    // PHONE
    // ----------------------------------------------------------

    const phoneRegex = /^[6-9][0-9]{9}$/;

    if (!phoneRegex.test(phone)) {
      setError("Please enter a valid 10-digit Indian phone number.");

      return false;
    }

    // ----------------------------------------------------------
    // POSTAL CODE
    // ----------------------------------------------------------

    const postalCodeRegex = /^[1-9][0-9]{5}$/;

    if (!postalCodeRegex.test(postalCode)) {
      setError("Please enter a valid 6-digit postal code.");

      return false;
    }

    // ----------------------------------------------------------
    // EMAIL
    // ----------------------------------------------------------

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        setError("Please enter a valid email address.");

        return false;
      }
    }

    return true;
  };

  // ============================================================
  // SAVE ADDRESS
  // ============================================================

  const saveNewAddress = async () => {
    const response = await fetch("/api/addresses", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        fullName: formData.fullName.trim(),

        phone: formData.phone.trim(),

        addressLine1: formData.addressLine1.trim(),

        addressLine2: formData.addressLine2.trim(),

        city: formData.city.trim(),

        state: formData.state.trim(),

        postalCode: formData.postalCode.trim(),

        country: formData.country.trim() || "India",

        addressType: "Home",

        isDefault: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Failed to save the address.");
    }

    return data;
  };

  // ============================================================
  // CONTINUE TO PAYMENT
  // ============================================================

  const handleContinue = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // --------------------------------------------------------
    // CART CHECK
    // --------------------------------------------------------

    if (items.length === 0) {
      setError("Your cart is empty.");

      return;
    }

    // --------------------------------------------------------
    // FORM VALIDATION
    // --------------------------------------------------------

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // ------------------------------------------------------
      // SAVE NEW ADDRESS IF CHECKED
      // ------------------------------------------------------

      if (saveAddress) {
        try {
          await saveNewAddress();

          setSuccess("Address saved successfully.");
        } catch (saveError) {
          console.error("Save address error:", saveError);

          throw saveError;
        }
      }

      // ------------------------------------------------------
      // CREATE CHECKOUT DATA
      // ------------------------------------------------------

      const checkoutData = {
        selectedAddressId: selectedAddressId || "",

        fullName: formData.fullName.trim(),

        addressLine1: formData.addressLine1.trim(),

        addressLine2: formData.addressLine2.trim(),

        city: formData.city.trim(),

        state: formData.state.trim(),

        postalCode: formData.postalCode.trim(),

        country: formData.country.trim() || "India",

        phone: formData.phone.trim(),

        email: formData.email.trim(),

        // ----------------------------------------------------
        // COUPON INFORMATION
        // ----------------------------------------------------

        coupon: appliedCoupon
          ? {
              id: appliedCoupon?.id || null,
              code: appliedCoupon?.code || couponCode.trim(),
              couponType: appliedCoupon?.couponType || null,
              discount: Number(couponDiscount || 0),
            }
          : null,
      };

      // ------------------------------------------------------
      // STORE TEMPORARY CHECKOUT DETAILS
      // ------------------------------------------------------

      sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData));

      // ------------------------------------------------------
      // REMOVE OLD ORDER CONFIRMATION
      // ------------------------------------------------------

      sessionStorage.removeItem("orderConfirmation");

      // ------------------------------------------------------
      // GO TO PAYMENT PAGE
      // ------------------------------------------------------

      router.push("/checkout/payment");
    } catch (error) {
      console.error("Checkout submit error:", error);

      setError(
        error?.message ||
          "Something went wrong while processing your billing details.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // LOADING UI
  // ============================================================

  if (loading) {
    return (
      <section className="min-h-screen bg-white px-4 py-8 font-poppins sm:px-6 sm:py-10 lg:px-10 xl:px-16">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-8 h-4 w-48 animate-pulse rounded bg-gray-200 sm:mb-12 sm:w-64" />

          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-12">
            <div className="space-y-5 sm:space-y-6">
              <div className="h-8 w-48 animate-pulse rounded bg-gray-200 sm:h-10 sm:w-64" />

              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item}>
                  <div className="mb-2 h-3.5 w-28 animate-pulse rounded bg-gray-200 sm:h-4 sm:w-32" />

                  <div className="h-11 w-full animate-pulse rounded bg-[#F5F5F5] sm:h-12" />
                </div>
              ))}
            </div>

            <div className="h-80 animate-pulse rounded-lg bg-[#F5F5F5] sm:h-96" />
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // EMPTY CART
  // ============================================================

  if (items.length === 0) {
    return (
      <section className="min-h-screen bg-[#F5F5F5] px-4 py-8 font-poppins sm:px-6 sm:py-10 lg:px-10 xl:px-16">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center justify-center">
          <div className="flex max-w-md flex-col items-center px-4 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF5F5] sm:h-20 sm:w-20">
              <FiShoppingBag size={28} className="text-[#DB4444] sm:hidden" />

              <FiShoppingBag
                size={36}
                className="hidden text-[#DB4444] sm:block"
              />
            </div>

            <h1 className="text-xl font-semibold text-black sm:text-2xl md:text-3xl">
              Your Cart Is Empty
              <span className="text-[#DB4444]">.</span>
            </h1>

            <p className="mt-2 text-xs leading-5 text-[#7A7A7A] sm:text-[13px] sm:leading-6">
              Add some products to your cart before proceeding to checkout.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex items-center justify-center rounded-md bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-black sm:px-6 sm:py-3 sm:text-[13px]"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // MAIN CHECKOUT UI
  // ============================================================

  return (
    <section className="w-full bg-white px-4 py-8 font-poppins sm:px-6 sm:py-10 lg:px-10 xl:px-16">
      <div className="mx-auto w-full max-w-7xl">
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <div className="mb-8 flex flex-wrap items-center gap-2 text-xs text-[#7A7A7A] sm:mb-12 sm:gap-3 sm:text-[13px]">
          <Link
            href="/account"
            className="transition-colors hover:text-[#DB4444]"
          >
            Account
          </Link>

          <span>/</span>

          <Link href="/shop" className="transition-colors hover:text-[#DB4444]">
            Shop
          </Link>

          <span>/</span>

          <Link href="/cart" className="transition-colors hover:text-[#DB4444]">
            Cart
          </Link>

          <span>/</span>

          <span className="text-black">Checkout</span>
        </div>

        {/* ==================================================
            PAGE TITLE
        ================================================== */}

        <div className="mb-8 sm:mb-10 lg:mb-12">
          <div className="mb-4 flex items-center gap-3 sm:mb-5 sm:gap-4">
            <span className="h-6 w-3 rounded-md bg-[#DB4444] sm:h-7 sm:w-3.5 lg:h-8 lg:w-4" />

            <p className="text-sm font-semibold text-[#DB4444] sm:text-[15px] lg:text-base">
              Checkout
            </p>
          </div>

          <h1 className="text-2xl font-semibold text-black sm:text-3xl lg:text-4xl">
            Billing Details
          </h1>
        </div>

        {/* ==================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="mb-5 flex items-start gap-2.5 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-700 sm:mb-6 sm:gap-3 sm:px-4 sm:py-3 sm:text-[13px]">
            <FiCheck size={16} className="mt-0.5 shrink-0 sm:hidden" />

            <FiCheck size={18} className="mt-0.5 hidden shrink-0 sm:block" />

            <p>{success}</p>
          </div>
        )}

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600 sm:mb-6 sm:px-4 sm:py-3 sm:text-[13px]">
            {error}
          </div>
        )}

        {/* ==================================================
            CHECKOUT GRID
        ================================================== */}

        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-12">
          {/* =================================================
              LEFT - BILLING DETAILS
          ================================================= */}

          <div className="min-w-0">
            {/* =================================================
                SAVED ADDRESSES
            ================================================= */}

            {addresses.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base font-semibold text-black sm:text-lg">
                    Saved Addresses
                  </h2>

                  <Link
                    href="/account/addresses"
                    className="text-xs font-medium text-[#DB4444] transition-colors hover:text-black sm:text-[13px]"
                  >
                    Manage Addresses
                  </Link>
                </div>

                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                  {addresses.map((address) => {
                    const isSelected = selectedAddressId === address?._id;

                    return (
                      <button
                        key={address?._id}
                        type="button"
                        onClick={() => handleSelectAddress(address)}
                        className={`cursor-pointer rounded-lg border p-3.5 text-left transition-all sm:p-4 ${
                          isSelected
                            ? "border-[#DB4444] bg-[#FFF5F5]"
                            : "border-[#E5E5E5] bg-white hover:border-[#DB4444]"
                        }`}
                      >
                        <div className="mb-2.5 flex items-center justify-between gap-3 sm:mb-3">
                          <div className="flex items-center gap-2">
                            <FiMapPin
                              size={15}
                              className="shrink-0 text-[#DB4444] sm:hidden"
                            />

                            <FiMapPin
                              size={16}
                              className="hidden shrink-0 text-[#DB4444] sm:block"
                            />

                            <span className="text-xs font-semibold text-black sm:text-[13px]">
                              {address?.addressType}
                            </span>
                          </div>

                          {isSelected && (
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#DB4444] text-white sm:h-5 sm:w-5">
                              <FiCheck size={10} className="sm:hidden" />

                              <FiCheck size={12} className="hidden sm:block" />
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-medium text-black sm:text-[13px]">
                          {address?.fullName}
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-[#7A7A7A] sm:text-[12px]">
                          {address?.addressLine1}

                          {address?.addressLine2
                            ? `, ${address.addressLine2}`
                            : ""}
                        </p>

                        <p className="text-[11px] leading-5 text-[#7A7A7A] sm:text-[12px]">
                          {address?.city}, {address?.state} -{" "}
                          {address?.postalCode}
                        </p>

                        <p className="mt-1 text-[11px] text-[#7A7A7A] sm:text-[12px]">
                          {address?.phone}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =================================================
                BILLING FORM
            ================================================= */}

            <form onSubmit={handleContinue} className="space-y-5 sm:space-y-6">
              {/* Full Name */}

              <div>
                <label className="mb-2 block text-xs text-[#7A7A7A] sm:text-[13px]">
                  Full Name
                  <span className="text-[#DB4444]"> *</span>
                </label>

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  autoComplete="name"
                  className="h-11 w-full rounded-md border-0 bg-[#F5F5F5] px-3 text-xs text-black outline-none transition-colors focus:ring-2 focus:ring-[#DB4444]/20 sm:h-12 sm:px-4 sm:text-[13px]"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Street Address */}

              <div>
                <label className="mb-2 block text-xs text-[#7A7A7A] sm:text-[13px]">
                  Street Address
                  <span className="text-[#DB4444]"> *</span>
                </label>

                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  autoComplete="street-address"
                  className="h-11 w-full rounded-md border-0 bg-[#F5F5F5] px-3 text-xs text-black outline-none transition-colors focus:ring-2 focus:ring-[#DB4444]/20 sm:h-12 sm:px-4 sm:text-[13px]"
                  placeholder="House number and street"
                />
              </div>

              {/* Apartment */}

              <div>
                <label className="mb-2 block text-xs text-[#7A7A7A] sm:text-[13px]">
                  Apartment, Floor, etc.
                  <span className="text-[#999999]"> (optional)</span>
                </label>

                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  autoComplete="address-line2"
                  className="h-11 w-full rounded-md border-0 bg-[#F5F5F5] px-3 text-xs text-black outline-none transition-colors focus:ring-2 focus:ring-[#DB4444]/20 sm:h-12 sm:px-4 sm:text-[13px]"
                  placeholder="Apartment, floor, landmark..."
                />
              </div>

              {/* City + State */}

              <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
                <div>
                  <label className="mb-2 block text-xs text-[#7A7A7A] sm:text-[13px]">
                    Town / City
                    <span className="text-[#DB4444]"> *</span>
                  </label>

                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    autoComplete="address-level2"
                    className="h-11 w-full rounded-md border-0 bg-[#F5F5F5] px-3 text-xs text-black outline-none focus:ring-2 focus:ring-[#DB4444]/20 sm:h-12 sm:px-4 sm:text-[13px]"
                    placeholder="Enter your city"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-[#7A7A7A] sm:text-[13px]">
                    State
                    <span className="text-[#DB4444]"> *</span>
                  </label>

                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    autoComplete="address-level1"
                    className="h-11 w-full rounded-md border-0 bg-[#F5F5F5] px-3 text-xs text-black outline-none focus:ring-2 focus:ring-[#DB4444]/20 sm:h-12 sm:px-4 sm:text-[13px]"
                    placeholder="Enter your state"
                  />
                </div>
              </div>

              {/* Postal Code */}

              <div>
                <label className="mb-2 block text-xs text-[#7A7A7A] sm:text-[13px]">
                  Postal Code
                  <span className="text-[#DB4444]"> *</span>
                </label>

                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
                  className="h-11 w-full rounded-md border-0 bg-[#F5F5F5] px-3 text-xs text-black outline-none focus:ring-2 focus:ring-[#DB4444]/20 sm:h-12 sm:px-4 sm:text-[13px]"
                  placeholder="6-digit postal code"
                />
              </div>

              {/* Phone */}

              <div>
                <label className="mb-2 block text-xs text-[#7A7A7A] sm:text-[13px]">
                  Phone Number
                  <span className="text-[#DB4444]"> *</span>
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                  className="h-11 w-full rounded-md border-0 bg-[#F5F5F5] px-3 text-xs text-black outline-none focus:ring-2 focus:ring-[#DB4444]/20 sm:h-12 sm:px-4 sm:text-[13px]"
                  placeholder="10-digit phone number"
                />
              </div>

              {/* Email */}

              <div>
                <label className="mb-2 block text-xs text-[#7A7A7A] sm:text-[13px]">
                  Email Address
                  <span className="text-[#999999]"> (optional)</span>
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className="h-11 w-full rounded-md border-0 bg-[#F5F5F5] px-3 text-xs text-black outline-none focus:ring-2 focus:ring-[#DB4444]/20 sm:h-12 sm:px-4 sm:text-[13px]"
                  placeholder="Enter your email"
                />
              </div>

              {/* Country */}

              <div>
                <label className="mb-2 block text-xs text-[#7A7A7A] sm:text-[13px]">
                  Country
                </label>

                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  autoComplete="country-name"
                  className="h-11 w-full rounded-md border-0 bg-[#F5F5F5] px-3 text-xs text-black outline-none focus:ring-2 focus:ring-[#DB4444]/20 sm:h-12 sm:px-4 sm:text-[13px]"
                />
              </div>

              {/* Save Address */}

              <label className="flex cursor-pointer items-start gap-2.5 sm:gap-3">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(event) => setSaveAddress(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#DB4444]"
                />

                <span className="text-xs leading-5 text-black sm:text-[13px]">
                  Save this information for faster checkout next time
                </span>
              </label>

              {/* Continue */}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full rounded-md bg-[#DB4444] px-6 py-3 text-xs font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8 sm:text-[13px]"
              >
                {submitting ? "Processing..." : "Continue to Payment"}
              </button>
            </form>
          </div>

          {/* =================================================
              RIGHT - ORDER SUMMARY
          ================================================= */}

          <div className="h-fit rounded-lg border border-[#E5E5E5] bg-white p-4 sm:p-5 lg:sticky lg:top-6 lg:p-6">
            <h2 className="text-lg font-semibold text-black sm:text-xl">
              Your Order
            </h2>

            {/* =================================================
                PRODUCTS
            ================================================= */}

            <div className="mt-4 space-y-3.5 sm:mt-6 sm:space-y-4">
              {items.map((item) => {
                const product = item?.product;

                const productName = getProductName(product);

                const image = getProductImage(product);

                const price = Number(item?.price || 0);

                const quantity = Number(item?.quantity || 0);

                const itemTotal = price * quantity;

                const itemId =
                  item?._id || product?._id || `${productName}-${quantity}`;

                return (
                  <div key={itemId} className="flex items-center gap-3">
                    {/* IMAGE */}

                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F5F5F5] sm:h-14 sm:w-14">
                      {image ? (
                        <Image
                          src={image}
                          alt={productName}
                          fill
                          sizes="56px"
                          className="object-contain"
                        />
                      ) : (
                        <FiShoppingBag
                          size={16}
                          className="text-[#7A7A7A] sm:hidden"
                        />
                      )}

                      {!image && (
                        <FiShoppingBag
                          size={18}
                          className="hidden text-[#7A7A7A] sm:block"
                        />
                      )}

                      <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-black px-1 text-[9px] text-white sm:h-5 sm:min-w-5 sm:text-[10px]">
                        {quantity}
                      </span>
                    </div>

                    {/* NAME */}

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-medium text-black sm:text-[13px]">
                        {productName}
                      </p>

                      <p className="mt-1 text-[10px] text-[#7A7A7A] sm:text-[11px]">
                        {formatPrice(price)} × {quantity}
                      </p>
                    </div>

                    {/* ITEM TOTAL */}

                    <p className="shrink-0 text-xs font-semibold text-black sm:text-[13px]">
                      {formatPrice(itemTotal)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="my-5 border-t border-[#E5E5E5] sm:my-6" />

            {/* =================================================
                ITEMS
            ================================================= */}

            <div className="space-y-3.5 sm:space-y-4">
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

              {/* =================================================
                  COUPON
              ================================================= */}

              <div className="pt-1">
                <div className="flex w-full gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value);
                      setCouponError("");
                      setCouponMessage("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    disabled={couponLoading || Boolean(appliedCoupon)}
                    placeholder="Coupon Code"
                    className="h-10 min-w-0 flex-1 rounded-md border border-[#E5E5E5] bg-white px-3 text-xs text-black outline-none transition-colors placeholder:text-[#999999] focus:border-[#DB4444] sm:h-11 sm:px-3.5 sm:text-[13px]"
                  />

                  {!appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      className="h-10 shrink-0 rounded-md bg-[#DB4444] px-3 text-xs font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-4 sm:text-[13px]"
                    >
                      {couponLoading ? "Applying..." : "Apply"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="h-10 shrink-0 rounded-md border border-[#DB4444] px-3 text-xs font-medium text-[#DB4444] transition-colors hover:bg-[#DB4444] hover:text-white sm:h-11 sm:px-4 sm:text-[13px]"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Coupon Success */}

                {couponMessage && (
                  <p className="mt-2 flex items-center gap-1 text-[10px] leading-4 text-green-600 sm:text-[11px]">
                    <FiCheck size={12} className="shrink-0" />

                    <span>{couponMessage}</span>
                  </p>
                )}

                {/* Coupon Error */}

                {couponError && (
                  <p className="mt-2 text-[10px] leading-4 text-[#DB4444] sm:text-[11px]">
                    {couponError}
                  </p>
                )}
              </div>

              {/* Coupon Discount */}

              {appliedCoupon && couponDiscount > 0 && (
                <div className="flex items-center justify-between text-xs sm:text-[13px]">
                  <span className="text-[#7A7A7A]">Discount</span>

                  <span className="font-medium text-green-600">
                    -{formatPrice(couponDiscount)}
                  </span>
                </div>
              )}

              {/* Shipping */}

              <div className="flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-[#7A7A7A]">Shipping</span>

                <span className="font-medium text-black">
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
              </div>

              {/* Total */}

              <div className="border-t border-[#E5E5E5] pt-3.5 sm:pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-black sm:text-[15px]">
                    Total
                  </span>

                  <span className="text-lg font-semibold text-[#DB4444] sm:text-xl">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Note */}

            <div className="mt-5 rounded-md bg-[#FFF5F5] px-3 py-2.5 sm:mt-6 sm:px-4 sm:py-3">
              <p className="text-[11px] leading-5 text-[#7A7A7A] sm:text-[12px]">
                Shipping is currently free. You will select your payment method
                on the next step.
              </p>
            </div>

            {/* Back To Cart */}

            <Link
              href="/cart"
              className="mt-5 block text-center text-xs font-medium text-black transition-colors hover:text-[#DB4444] sm:text-[13px]"
            >
              ← Back to Cart
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
