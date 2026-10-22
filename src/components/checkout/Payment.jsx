"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  FiCheck,
  FiCreditCard,
  FiMapPin,
  FiShoppingBag,
  FiTag,
  FiTruck,
  FiX,
} from "react-icons/fi";

// ============================================================
// RAZORPAY CHECKOUT SCRIPT
// ============================================================

const RAZORPAY_SCRIPT_ID = "razorpay-checkout-script";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

// ============================================================
// PAYMENT COMPONENT
// ============================================================

const Payment = ({ user }) => {
  // ============================================================
  // ROUTER
  // ============================================================

  const router = useRouter();

  // ============================================================
  // STATES
  // ============================================================

  const [cart, setCart] = useState(null);

  const [addresses, setAddresses] = useState([]);

  const [checkoutData, setCheckoutData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ============================================================
  // COUPON STATES
  // ============================================================

  const [couponCode, setCouponCode] = useState("");

  const [couponLoading, setCouponLoading] = useState(false);

  const [couponError, setCouponError] = useState("");

  const [couponSuccess, setCouponSuccess] = useState("");

  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // ============================================================
  // PAYMENT METHOD
  // ============================================================

  const [paymentMethod, setPaymentMethod] = useState("cod");

  // ============================================================
  // RAZORPAY STATE
  // ============================================================

  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // ============================================================
  // ORDER STATE
  // ============================================================

  const [placingOrder, setPlacingOrder] = useState(false);

  // ============================================================
  // LOAD RAZORPAY CHECKOUT SCRIPT
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const loadRazorpayScript = () => {
      // --------------------------------------------------------
      // RAZORPAY ALREADY AVAILABLE
      // --------------------------------------------------------

      if (typeof window !== "undefined" && window.Razorpay) {
        if (mounted) {
          setRazorpayLoaded(true);
        }

        return;
      }

      // --------------------------------------------------------
      // SCRIPT ALREADY EXISTS
      // --------------------------------------------------------

      const existingScript = document.getElementById(RAZORPAY_SCRIPT_ID);

      if (existingScript) {
        const handleLoad = () => {
          if (mounted && window.Razorpay) {
            setRazorpayLoaded(true);
          }
        };

        const handleError = () => {
          if (mounted) {
            setError(
              "Unable to load the Razorpay payment system. Please refresh the page and try again.",
            );
          }
        };

        existingScript.addEventListener("load", handleLoad);

        existingScript.addEventListener("error", handleError);

        return () => {
          existingScript.removeEventListener("load", handleLoad);

          existingScript.removeEventListener("error", handleError);
        };
      }

      // --------------------------------------------------------
      // CREATE SCRIPT
      // --------------------------------------------------------

      const script = document.createElement("script");

      script.id = RAZORPAY_SCRIPT_ID;

      script.src = RAZORPAY_SCRIPT_URL;

      script.async = true;

      script.onload = () => {
        if (mounted && window.Razorpay) {
          setRazorpayLoaded(true);
        }
      };

      script.onerror = () => {
        if (mounted) {
          setError(
            "Unable to load the Razorpay payment system. Please refresh the page and try again.",
          );
        }
      };

      document.body.appendChild(script);

      return () => {
        script.onload = null;
        script.onerror = null;
      };
    };

    const cleanup = loadRazorpayScript();

    return () => {
      mounted = false;

      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, []);

  // ============================================================
  // FETCH PAYMENT DATA
  // ============================================================

  useEffect(() => {
    const controller = new AbortController();

    const fetchPaymentData = async () => {
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

        // ------------------------------------------------------
        // CART ERROR
        // ------------------------------------------------------

        if (!cartResponse.ok) {
          throw new Error(cartData?.message || "Failed to load your cart.");
        }

        // ------------------------------------------------------
        // ADDRESS ERROR
        // ------------------------------------------------------

        if (!addressResponse.ok) {
          throw new Error(
            addressData?.message || "Failed to load your addresses.",
          );
        }

        // ------------------------------------------------------
        // CART
        // ------------------------------------------------------

        const cartObject = cartData?.cart || {
          items: [],
        };

        // ------------------------------------------------------
        // ADDRESSES
        // ------------------------------------------------------

        const savedAddresses = Array.isArray(addressData?.addresses)
          ? addressData.addresses
          : [];

        setCart(cartObject);

        setAddresses(savedAddresses);

        // ------------------------------------------------------
        // LOAD CHECKOUT DATA
        // ------------------------------------------------------

        try {
          const storedCheckoutData = sessionStorage.getItem("checkoutData");

          if (storedCheckoutData) {
            const parsedCheckoutData = JSON.parse(storedCheckoutData);

            setCheckoutData(parsedCheckoutData);

            // --------------------------------------------------
            // DO NOT TRUST STORED COUPON DISCOUNT
            // --------------------------------------------------

            const storedCoupon = parsedCheckoutData?.coupon;

            if (storedCoupon?.code) {
              const storedCouponCode = storedCoupon.code
                .toString()
                .trim()
                .toUpperCase();

              // ----------------------------------------------
              // REVALIDATE STORED COUPON WITH SERVER
              // ----------------------------------------------

              try {
                const couponResponse = await fetch("/api/coupons/validate", {
                  method: "POST",

                  headers: {
                    "Content-Type": "application/json",
                  },

                  credentials: "include",

                  cache: "no-store",

                  signal: controller.signal,

                  body: JSON.stringify({
                    code: storedCouponCode,
                  }),
                });

                const couponData = await couponResponse.json();

                if (
                  couponResponse.ok &&
                  couponData?.success &&
                  couponData?.coupon?.code
                ) {
                  // ------------------------------------------
                  // USE SERVER-VALIDATED COUPON DATA
                  // ------------------------------------------

                  setAppliedCoupon(couponData);

                  // ------------------------------------------
                  // UPDATE SESSION STORAGE WITH SERVER DATA
                  // ------------------------------------------

                  const updatedCheckoutData = {
                    ...parsedCheckoutData,

                    coupon: {
                      id: couponData?.coupon?.id || null,

                      code: couponData?.coupon?.code || storedCouponCode,

                      couponType: couponData?.coupon?.couponType || null,

                      discount: Number(couponData?.pricing?.discount || 0),
                    },
                  };

                  sessionStorage.setItem(
                    "checkoutData",
                    JSON.stringify(updatedCheckoutData),
                  );

                  setCheckoutData(updatedCheckoutData);
                } else {
                  // ------------------------------------------
                  // STORED COUPON IS NO LONGER VALID
                  // ------------------------------------------

                  console.warn(
                    "Stored checkout coupon is no longer valid:",
                    couponData?.message,
                  );

                  const updatedCheckoutData = {
                    ...parsedCheckoutData,

                    coupon: null,
                  };

                  sessionStorage.setItem(
                    "checkoutData",
                    JSON.stringify(updatedCheckoutData),
                  );

                  setCheckoutData(updatedCheckoutData);

                  setAppliedCoupon(null);
                }
              } catch (couponValidationError) {
                if (couponValidationError?.name === "AbortError") {
                  return;
                }

                console.error(
                  "Stored coupon validation error:",
                  couponValidationError,
                );

                // ------------------------------------------
                // IMPORTANT:
                // DO NOT TRUST THE STORED DISCOUNT
                // ------------------------------------------

                const updatedCheckoutData = {
                  ...parsedCheckoutData,

                  coupon: null,
                };

                sessionStorage.setItem(
                  "checkoutData",
                  JSON.stringify(updatedCheckoutData),
                );

                setCheckoutData(updatedCheckoutData);

                setAppliedCoupon(null);
              }
            } else {
              setAppliedCoupon(null);
            }
          }
        } catch (storageError) {
          console.error("Checkout session data error:", storageError);

          setAppliedCoupon(null);
        }
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("Payment data fetch error:", error);

        setError(
          error?.message ||
            "Something went wrong while loading payment details.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchPaymentData();

    return () => {
      controller.abort();
    };
  }, []);

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
  // DISCOUNT
  // ============================================================

  const discount = Number(appliedCoupon?.pricing?.discount || 0);

  // ============================================================
  // FINAL TOTAL
  // ============================================================

  const total = Math.max(subtotal - discount + shipping, 0);

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
  // SELECTED ADDRESS
  // ============================================================

  const selectedAddress = useMemo(() => {
    if (!addresses.length) {
      return null;
    }

    // --------------------------------------------------------
    // FIRST PRIORITY:
    // ADDRESS SELECTED DURING CHECKOUT
    // --------------------------------------------------------

    if (checkoutData?.selectedAddressId) {
      const matchedAddress = addresses.find(
        (address) => address?._id === checkoutData.selectedAddressId,
      );

      if (matchedAddress) {
        return matchedAddress;
      }
    }

    // --------------------------------------------------------
    // SECOND PRIORITY:
    // DEFAULT ADDRESS
    // --------------------------------------------------------

    const defaultAddress = addresses.find(
      (address) => address?.isDefault === true,
    );

    if (defaultAddress) {
      return defaultAddress;
    }

    // --------------------------------------------------------
    // THIRD PRIORITY:
    // FIRST SAVED ADDRESS
    // --------------------------------------------------------

    return addresses[0];
  }, [addresses, checkoutData]);

  // ============================================================
  // DISPLAY CHECKOUT ADDRESS
  // ============================================================

  const displayAddress = useMemo(() => {
    // --------------------------------------------------------
    // CHECKOUT FORM DATA
    // --------------------------------------------------------

    if (checkoutData) {
      return {
        fullName: checkoutData?.fullName || user?.name || "",

        addressLine1: checkoutData?.addressLine1 || "",

        addressLine2: checkoutData?.addressLine2 || "",

        city: checkoutData?.city || "",

        state: checkoutData?.state || "",

        postalCode: checkoutData?.postalCode || "",

        country: checkoutData?.country || "India",

        phone: checkoutData?.phone || user?.phone || "",

        email: checkoutData?.email || user?.email || "",
      };
    }

    // --------------------------------------------------------
    // SAVED ADDRESS
    // --------------------------------------------------------

    if (selectedAddress) {
      return {
        fullName: selectedAddress?.fullName || user?.name || "",

        addressLine1: selectedAddress?.addressLine1 || "",

        addressLine2: selectedAddress?.addressLine2 || "",

        city: selectedAddress?.city || "",

        state: selectedAddress?.state || "",

        postalCode: selectedAddress?.postalCode || "",

        country: selectedAddress?.country || "India",

        phone: selectedAddress?.phone || user?.phone || "",

        email: user?.email || "",
      };
    }

    return null;
  }, [checkoutData, selectedAddress, user]);

  // ============================================================
  // APPLY COUPON
  // ============================================================

  const handleApplyCoupon = async (event) => {
    event.preventDefault();

    const code = couponCode.trim().toUpperCase();

    setCouponError("");
    setCouponSuccess("");

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

        cache: "no-store",

        body: JSON.stringify({
          code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to apply this coupon.");
      }

      // ------------------------------------------------------
      // ONLY ACCEPT SERVER-VALIDATED COUPON
      // ------------------------------------------------------

      if (!data?.success || !data?.coupon?.code) {
        throw new Error("The coupon could not be validated.");
      }

      setAppliedCoupon(data);

      setCouponCode("");

      // ------------------------------------------------------
      // STORE SERVER-VALIDATED COUPON
      // ------------------------------------------------------

      try {
        const storedCheckoutData = sessionStorage.getItem("checkoutData");

        const parsedCheckoutData = storedCheckoutData
          ? JSON.parse(storedCheckoutData)
          : {};

        const updatedCheckoutData = {
          ...parsedCheckoutData,

          coupon: {
            id: data?.coupon?.id || null,

            code: data?.coupon?.code || "",

            couponType: data?.coupon?.couponType || null,

            discount: Number(data?.pricing?.discount || 0),
          },
        };

        sessionStorage.setItem(
          "checkoutData",
          JSON.stringify(updatedCheckoutData),
        );

        setCheckoutData(updatedCheckoutData);
      } catch (storageError) {
        console.error("Save coupon session error:", storageError);
      }

      setCouponSuccess(`${data?.coupon?.code} applied successfully.`);
    } catch (error) {
      console.error("Apply coupon error:", error);

      setAppliedCoupon(null);

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
    setAppliedCoupon(null);

    setCouponCode("");

    setCouponError("");

    setCouponSuccess("Coupon removed successfully.");

    // ----------------------------------------------------------
    // ALSO REMOVE COUPON FROM CHECKOUT SESSION DATA
    // ----------------------------------------------------------

    try {
      const storedCheckoutData = sessionStorage.getItem("checkoutData");

      if (storedCheckoutData) {
        const parsedCheckoutData = JSON.parse(storedCheckoutData);

        parsedCheckoutData.coupon = null;

        sessionStorage.setItem(
          "checkoutData",
          JSON.stringify(parsedCheckoutData),
        );

        setCheckoutData(parsedCheckoutData);
      }
    } catch (storageError) {
      console.error("Remove coupon session error:", storageError);
    }
  };

  // ============================================================
  // GET CURRENT COUPON CODE
  // ============================================================

  const getCurrentCouponCode = () => {
    return (appliedCoupon?.coupon?.code || "").toString().trim().toUpperCase();
  };

  // ============================================================
  // VALIDATE PAYMENT DETAILS
  // ============================================================

  const validatePaymentDetails = () => {
    // --------------------------------------------------------
    // CART CHECK
    // --------------------------------------------------------

    if (items.length === 0) {
      setError("Your cart is empty.");

      return false;
    }

    // --------------------------------------------------------
    // ADDRESS CHECK
    // --------------------------------------------------------

    if (!displayAddress) {
      setError("Please provide a delivery address before continuing.");

      return false;
    }

    // --------------------------------------------------------
    // REQUIRED ADDRESS FIELDS
    // --------------------------------------------------------

    const requiredAddressFields = [
      displayAddress.fullName,
      displayAddress.phone,
      displayAddress.addressLine1,
      displayAddress.city,
      displayAddress.state,
      displayAddress.postalCode,
    ];

    const hasMissingAddress = requiredAddressFields.some(
      (value) => !value || !value.toString().trim(),
    );

    if (hasMissingAddress) {
      setError(
        "Your delivery address is incomplete. Please go back to checkout and complete it.",
      );

      return false;
    }

    return true;
  };

  // ============================================================
  // BUILD SHIPPING ADDRESS
  // ============================================================

  const getShippingAddressPayload = () => {
    return {
      fullName: displayAddress.fullName.trim(),

      phone: displayAddress.phone.trim(),

      addressLine1: displayAddress.addressLine1.trim(),

      addressLine2: displayAddress.addressLine2?.trim() || "",

      city: displayAddress.city.trim(),

      state: displayAddress.state.trim(),

      postalCode: displayAddress.postalCode.trim(),

      country: displayAddress.country?.trim() || "India",
    };
  };

  // ============================================================
  // PAYMENT METHOD SELECT
  // ============================================================

  const handlePaymentMethodChange = (method) => {
    if (method === "razorpay") {
      if (!razorpayLoaded) {
        setError(
          "Razorpay is still loading. Please wait a moment and try again.",
        );

        return;
      }

      setPaymentMethod("razorpay");

      setError("");

      return;
    }

    setPaymentMethod(method);

    setError("");
  };

  // ============================================================
  // SAVE ORDER CONFIRMATION
  // ============================================================

  const saveOrderConfirmation = (order) => {
    const orderId = order?.id || order?._id;

    if (!orderId) {
      throw new Error("The order was created, but no order ID was returned.");
    }

    sessionStorage.setItem(
      "orderConfirmation",
      JSON.stringify({
        id: orderId,

        orderNumber: order?.orderNumber || "",
      }),
    );

    sessionStorage.removeItem("checkoutData");

    setAppliedCoupon(null);
  };

  // ============================================================
  // PLACE COD ORDER
  // ============================================================

  const handlePlaceOrder = async () => {
    if (paymentMethod !== "cod") {
      return;
    }

    if (!validatePaymentDetails()) {
      return;
    }

    try {
      setPlacingOrder(true);

      setError("");

      setCouponError("");

      setCouponSuccess("");

      // ------------------------------------------------------
      // SHIPPING ADDRESS
      // ------------------------------------------------------

      const shippingAddress = getShippingAddressPayload();

      // ------------------------------------------------------
      // COUPON CODE
      // ------------------------------------------------------

      const currentCouponCode = getCurrentCouponCode();

      // ------------------------------------------------------
      // CREATE COD ORDER REQUEST
      // ------------------------------------------------------

      const requestBody = {
        paymentMethod: "cod",

        couponCode: currentCouponCode,

        shippingAddress,
      };

      const response = await fetch("/api/orders", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        cache: "no-store",

        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to place your order.");
      }

      const createdOrder = data?.order;

      saveOrderConfirmation(createdOrder);

      router.push("/order-success");
    } catch (error) {
      console.error("Place order error:", error);

      setError(
        error?.message || "Something went wrong while placing your order.",
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // ============================================================
  // ONLINE PAYMENT
  // ============================================================

  const handleOnlinePayment = async () => {
    // --------------------------------------------------------
    // RAZORPAY SCRIPT CHECK
    // --------------------------------------------------------

    if (!razorpayLoaded) {
      setError(
        "Razorpay is still loading. Please wait a moment and try again.",
      );

      return;
    }

    // --------------------------------------------------------
    // BROWSER RAZORPAY CHECK
    // --------------------------------------------------------

    if (typeof window === "undefined" || !window.Razorpay) {
      setError(
        "Razorpay Checkout is not available. Please refresh the page and try again.",
      );

      return;
    }

    // --------------------------------------------------------
    // TOTAL CHECK
    // --------------------------------------------------------

    if (total <= 0) {
      setError("Online payment cannot be used for an order with a zero total.");

      return;
    }

    // --------------------------------------------------------
    // VALIDATE DETAILS
    // --------------------------------------------------------

    if (!validatePaymentDetails()) {
      return;
    }

    try {
      setPlacingOrder(true);

      setError("");

      setCouponError("");

      setCouponSuccess("");

      // ------------------------------------------------------
      // SHIPPING ADDRESS
      // ------------------------------------------------------

      const shippingAddress = getShippingAddressPayload();

      // ------------------------------------------------------
      // COUPON CODE
      // ------------------------------------------------------

      const currentCouponCode = getCurrentCouponCode();

      // ------------------------------------------------------
      // CREATE RAZORPAY ORDER REQUEST
      // ------------------------------------------------------

      const requestBody = {
        shippingAddress,

        couponCode: currentCouponCode,
      };

      // ------------------------------------------------------
      // CREATE RAZORPAY ORDER
      // ------------------------------------------------------

      const response = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        cache: "no-store",

        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      // ------------------------------------------------------
      // API ERROR
      // ------------------------------------------------------

      if (!response.ok) {
        throw new Error(data?.message || "Unable to start online payment.");
      }

      // ------------------------------------------------------
      // RAZORPAY RESPONSE
      // ------------------------------------------------------

      const razorpayOrder = data?.razorpay;

      if (
        !razorpayOrder?.keyId ||
        !razorpayOrder?.orderId ||
        !razorpayOrder?.amount ||
        !razorpayOrder?.currency
      ) {
        throw new Error("Invalid payment order received from the server.");
      }

      // ------------------------------------------------------
      // CUSTOMER PHONE
      // ------------------------------------------------------

      const normalizedPhone = String(displayAddress.phone || "").replace(
        /\D/g,
        "",
      );

      const razorpayContact =
        normalizedPhone.length === 10
          ? `+91${normalizedPhone}`
          : displayAddress.phone;

      // ------------------------------------------------------
      // RAZORPAY CHECKOUT OPTIONS
      // ------------------------------------------------------

      const options = {
        key: razorpayOrder.keyId,

        amount: razorpayOrder.amount,

        currency: razorpayOrder.currency,

        name: "Exclusive Store",

        description: `Payment for ${totalItems} ${
          totalItems === 1 ? "item" : "items"
        }`,

        order_id: razorpayOrder.orderId,

        prefill: {
          name: data?.customer?.name || displayAddress.fullName,

          email: data?.customer?.email || displayAddress.email || "",

          contact: razorpayContact,
        },

        theme: {
          color: "#DB4444",
        },

        retry: {
          enabled: true,
        },

        modal: {
          backdropclose: false,

          escape: true,

          ondismiss: () => {
            setPlacingOrder(false);

            setError("");
          },
        },

        // ====================================================
        // PAYMENT SUCCESS
        // ====================================================

        handler: async (razorpayResponse) => {
          try {
            setError("");

            // ----------------------------------------------
            // RAZORPAY PAYMENT DATA
            // ----------------------------------------------

            const paymentId = razorpayResponse?.razorpay_payment_id;

            const returnedOrderId = razorpayResponse?.razorpay_order_id;

            const signature = razorpayResponse?.razorpay_signature;

            if (!paymentId || !returnedOrderId || !signature) {
              throw new Error(
                "Razorpay returned an incomplete payment response.",
              );
            }

            // ----------------------------------------------
            // VERIFY PAYMENT ON SERVER
            // ----------------------------------------------

            const verifyResponse = await fetch(
              "/api/payments/razorpay/verify-payment",
              {
                method: "POST",

                headers: {
                  "Content-Type": "application/json",
                },

                credentials: "include",

                cache: "no-store",

                body: JSON.stringify({
                  razorpay_payment_id: paymentId,

                  razorpay_order_id: returnedOrderId,

                  razorpay_signature: signature,

                  shippingAddress,

                  couponCode: currentCouponCode,
                }),
              },
            );

            const verifyData = await verifyResponse.json();

            // ----------------------------------------------
            // VERIFICATION ERROR
            // ----------------------------------------------

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData?.message || "Payment verification failed.",
              );
            }

            // ----------------------------------------------
            // VERIFIED ORDER
            // ----------------------------------------------

            const verifiedOrder = verifyData?.order;

            if (!verifiedOrder) {
              throw new Error(
                "Payment was verified, but the order details were not returned.",
              );
            }

            // ----------------------------------------------
            // SAVE ORDER REFERENCE
            // ----------------------------------------------

            saveOrderConfirmation(verifiedOrder);

            // ----------------------------------------------
            // REDIRECT
            // ----------------------------------------------

            router.push("/order-success");
          } catch (verificationError) {
            console.error("Razorpay verification error:", verificationError);

            setError(
              verificationError?.message ||
                "Payment was received, but order verification failed. Please contact support before trying again.",
            );

            setPlacingOrder(false);
          }
        },
      };

      // ------------------------------------------------------
      // OPEN RAZORPAY CHECKOUT
      // ------------------------------------------------------

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (paymentError) => {
        console.error("Razorpay payment failed:", paymentError);

        setError(
          paymentError?.error?.description ||
            "Payment failed. Please try again.",
        );

        // --------------------------------------------------
        // IMPORTANT:
        // DO NOT REMOVE OR REDEEM COUPON HERE.
        // PAYMENT FAILED = COUPON REMAINS AVAILABLE.
        // --------------------------------------------------

        setPlacingOrder(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Online payment error:", error);

      setError(
        error?.message ||
          "Something went wrong while starting the online payment.",
      );

      setPlacingOrder(false);
    }
  };

  // ============================================================
  // PAYMENT BUTTON HANDLER
  // ============================================================

  const handlePaymentAction = () => {
    if (paymentMethod === "cod") {
      handlePlaceOrder();

      return;
    }

    handleOnlinePayment();
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

              <div className="h-28 animate-pulse rounded-lg bg-[#F5F5F5]" />

              <div className="h-16 animate-pulse rounded-lg bg-[#F5F5F5]" />
            </div>

            <div className="h-96 animate-pulse rounded-lg bg-[#F5F5F5] lg:h-150" />
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
              Add some products before proceeding to payment.
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
  // MAIN PAYMENT UI
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

          <Link
            href="/checkout"
            className="transition-colors hover:text-[#DB4444]"
          >
            Checkout
          </Link>

          <span>/</span>

          <span className="text-black">Payment</span>
        </div>

        {/* ==================================================
            PAGE TITLE
        ================================================== */}

        <div className="mb-8 sm:mb-10 lg:mb-12">
          <div className="mb-4 flex items-center gap-3 sm:mb-5 sm:gap-4">
            <span className="h-6 w-3 rounded-md bg-[#DB4444] sm:h-7 sm:w-3.5 lg:h-8 lg:w-4" />

            <p className="text-sm font-semibold text-[#DB4444] sm:text-[15px] lg:text-base">
              Payment
            </p>
          </div>

          <h1 className="text-2xl font-semibold text-black sm:text-3xl lg:text-4xl">
            Review & Payment
          </h1>
        </div>

        {/* ==================================================
            PAGE ERROR
        ================================================== */}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600 sm:mb-6 sm:gap-4 sm:px-4 sm:py-3 sm:text-[13px]">
            <p>{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 text-red-500 transition-colors hover:text-black"
              aria-label="Close error"
            >
              <FiX size={16} />
            </button>
          </div>
        )}

        {/* ==================================================
            COUPON SUCCESS
        ================================================== */}

        {couponSuccess && (
          <div className="mb-5 flex items-start gap-2.5 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-700 sm:mb-6 sm:gap-3 sm:px-4 sm:py-3 sm:text-[13px]">
            <FiCheck size={16} className="mt-0.5 shrink-0 sm:hidden" />

            <FiCheck size={18} className="mt-0.5 hidden shrink-0 sm:block" />

            <p>{couponSuccess}</p>
          </div>
        )}

        {/* ==================================================
            COUPON ERROR
        ================================================== */}

        {couponError && (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600 sm:mb-6 sm:px-4 sm:py-3 sm:text-[13px]">
            {couponError}
          </div>
        )}

        {/* ==================================================
            MAIN GRID
        ================================================== */}

        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-12">
          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <div className="min-w-0 space-y-6 sm:space-y-8">
            {/* =================================================
                DELIVERY ADDRESS
            ================================================= */}

            <div className="rounded-lg border border-[#E5E5E5] bg-white p-4 sm:p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <FiMapPin
                    size={18}
                    className="shrink-0 text-[#DB4444] sm:hidden"
                  />

                  <FiMapPin
                    size={19}
                    className="hidden shrink-0 text-[#DB4444] sm:block"
                  />

                  <h2 className="text-base font-semibold text-black sm:text-lg">
                    Delivery Address
                  </h2>
                </div>

                <Link
                  href="/checkout"
                  className="text-xs font-medium text-[#DB4444] transition-colors hover:text-black sm:text-[13px]"
                >
                  Edit
                </Link>
              </div>

              {displayAddress ? (
                <div className="rounded-md bg-[#F5F5F5] p-3.5 sm:p-4">
                  <p className="text-xs font-semibold text-black sm:text-[13px]">
                    {displayAddress.fullName}
                  </p>

                  <p className="mt-2 text-[11px] leading-5 text-[#7A7A7A] sm:text-[12px]">
                    {displayAddress.addressLine1}

                    {displayAddress.addressLine2
                      ? `, ${displayAddress.addressLine2}`
                      : ""}
                  </p>

                  <p className="text-[11px] leading-5 text-[#7A7A7A] sm:text-[12px]">
                    {displayAddress.city}, {displayAddress.state} -{" "}
                    {displayAddress.postalCode}
                  </p>

                  <p className="mt-1 text-[11px] text-[#7A7A7A] sm:text-[12px]">
                    {displayAddress.country}
                  </p>

                  <p className="mt-2 text-[11px] text-[#7A7A7A] sm:text-[12px]">
                    {displayAddress.phone}
                  </p>

                  {displayAddress.email && (
                    <p className="mt-1 break-all text-[11px] text-[#7A7A7A] sm:text-[12px]">
                      {displayAddress.email}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-md bg-[#FFF5F5] p-3.5 text-xs text-[#7A7A7A] sm:p-4 sm:text-[13px]">
                  No delivery address found. Please go back to checkout.
                </div>
              )}
            </div>

            {/* =================================================
                PAYMENT METHOD
            ================================================= */}

            <div className="rounded-lg border border-[#E5E5E5] bg-white p-4 sm:p-5 md:p-6">
              <h2 className="text-base font-semibold text-black sm:text-lg">
                Payment Method
              </h2>

              <div className="mt-4 space-y-3 sm:mt-5">
                {/* =================================================
                    ONLINE PAYMENT
                ================================================= */}

                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange("razorpay")}
                  disabled={!razorpayLoaded || placingOrder}
                  className={`w-full rounded-md border p-3.5 text-left transition-all sm:p-4 ${
                    paymentMethod === "razorpay"
                      ? "border-[#DB4444] bg-[#FFF5F5]"
                      : "border-[#E5E5E5] bg-white hover:border-[#DB4444]"
                  } ${!razorpayLoaded ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        paymentMethod === "razorpay"
                          ? "border-[#DB4444]"
                          : "border-[#7A7A7A]"
                      }`}
                    >
                      {paymentMethod === "razorpay" && (
                        <div className="h-2.5 w-2.5 rounded-full bg-[#DB4444]" />
                      )}
                    </div>

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white sm:h-9 sm:w-9">
                      <FiCreditCard
                        size={16}
                        className="text-[#DB4444] sm:hidden"
                      />

                      <FiCreditCard
                        size={18}
                        className="hidden text-[#DB4444] sm:block"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-medium text-black sm:text-[13px]">
                          Online Payment
                        </p>

                        {!razorpayLoaded && (
                          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[9px] font-medium text-[#7A7A7A] sm:text-[10px]">
                            Loading...
                          </span>
                        )}

                        {razorpayLoaded && (
                          <span className="rounded-full bg-[#FFF5F5] px-2 py-0.5 text-[9px] font-medium text-[#DB4444] sm:text-[10px]">
                            Razorpay
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-[10px] leading-4 text-[#7A7A7A] sm:text-[11px]">
                        Pay securely using UPI, cards, net banking and supported
                        payment methods.
                      </p>
                    </div>
                  </div>
                </button>

                {/* =================================================
                    CASH ON DELIVERY
                ================================================= */}

                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange("cod")}
                  disabled={placingOrder}
                  className={`w-full rounded-md border p-3.5 text-left transition-all sm:p-4 ${
                    paymentMethod === "cod"
                      ? "border-[#DB4444] bg-[#FFF5F5]"
                      : "border-[#E5E5E5] bg-white hover:border-[#DB4444]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        paymentMethod === "cod"
                          ? "border-[#DB4444]"
                          : "border-[#7A7A7A]"
                      }`}
                    >
                      {paymentMethod === "cod" && (
                        <div className="h-2.5 w-2.5 rounded-full bg-[#DB4444]" />
                      )}
                    </div>

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white sm:h-9 sm:w-9">
                      <FiTruck size={16} className="text-[#DB4444] sm:hidden" />

                      <FiTruck
                        size={18}
                        className="hidden text-[#DB4444] sm:block"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-black sm:text-[13px]">
                        Cash on Delivery
                      </p>

                      <p className="mt-1 text-[10px] leading-4 text-[#7A7A7A] sm:text-[11px]">
                        Pay when your order is delivered.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* =================================================
                PAYMENT INFORMATION
            ================================================= */}

            <div className="rounded-md bg-[#F5F5F5] px-3.5 py-3.5 sm:px-4 sm:py-4">
              {paymentMethod === "cod" ? (
                <p className="text-[11px] leading-5 text-[#7A7A7A] sm:text-[12px]">
                  You can pay for your order in cash when it is delivered to
                  your address.
                </p>
              ) : (
                <p className="text-[11px] leading-5 text-[#7A7A7A] sm:text-[12px]">
                  You will use Razorpay Checkout to complete your payment
                  securely.
                </p>
              )}
            </div>
          </div>

          {/* =================================================
              RIGHT SIDE - ORDER SUMMARY
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

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-medium text-black sm:text-[13px]">
                        {productName}
                      </p>

                      <p className="mt-1 text-[10px] text-[#7A7A7A] sm:text-[11px]">
                        {formatPrice(price)} × {quantity}
                      </p>
                    </div>

                    <p className="shrink-0 text-xs font-semibold text-black sm:text-[13px]">
                      {formatPrice(itemTotal)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="my-5 border-t border-[#E5E5E5] sm:my-6" />

            {/* =================================================
                COUPON
            ================================================= */}

            <div>
              <div className="mb-3 flex items-center gap-2">
                <FiTag size={15} className="text-[#DB4444] sm:hidden" />

                <FiTag size={16} className="hidden text-[#DB4444] sm:block" />

                <h3 className="text-xs font-semibold text-black sm:text-[14px]">
                  Apply Coupon
                </h3>
              </div>

              {!appliedCoupon ? (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(event) =>
                      setCouponCode(event.target.value.toUpperCase())
                    }
                    placeholder="Enter coupon code"
                    className="h-10 min-w-0 flex-1 rounded-md bg-[#F5F5F5] px-3 text-[11px] text-black outline-none focus:ring-2 focus:ring-[#DB4444]/20 sm:h-11 sm:text-[12px]"
                  />

                  <button
                    type="submit"
                    disabled={couponLoading || placingOrder}
                    className="h-10 shrink-0 rounded-md bg-black px-3.5 text-[11px] font-medium text-white transition-colors hover:bg-[#DB4444] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-4 sm:text-[12px]"
                  >
                    {couponLoading ? "Applying..." : "Apply"}
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-md bg-[#FFF5F5] px-3 py-2.5 sm:py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FiCheck size={15} className="shrink-0 text-[#DB4444]" />

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-black sm:text-[12px]">
                        {appliedCoupon?.coupon?.code}
                      </p>

                      <p className="text-[10px] text-[#7A7A7A] sm:text-[11px]">
                        Discount applied
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    disabled={placingOrder}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#DB4444] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Remove coupon"
                  >
                    <FiX size={15} />
                  </button>
                </div>
              )}
            </div>

            <div className="my-5 border-t border-[#E5E5E5] sm:my-6" />

            {/* =================================================
                PRICING
            ================================================= */}

            <div className="space-y-3.5 sm:space-y-4">
              <div className="flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-[#7A7A7A]">Items</span>

                <span className="font-medium text-black">{totalItems}</span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-[#7A7A7A]">Subtotal</span>

                <span className="font-medium text-black">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex items-center justify-between text-xs sm:text-[13px]">
                  <span className="text-[#7A7A7A]">Discount</span>

                  <span className="font-medium text-green-600">
                    -{formatPrice(discount)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-[#7A7A7A]">Shipping</span>

                <span className="text-[#7A7A7A]">
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
              </div>

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

            {/* =================================================
                PAY / PLACE ORDER
            ================================================= */}

            <button
              type="button"
              onClick={handlePaymentAction}
              disabled={
                placingOrder ||
                (paymentMethod === "razorpay" && !razorpayLoaded)
              }
              className={`mt-5 w-full rounded-md px-5 py-3 text-xs font-medium text-white transition-colors sm:mt-6 sm:text-[13px] ${
                placingOrder ||
                (paymentMethod === "razorpay" && !razorpayLoaded)
                  ? "cursor-not-allowed bg-[#DB4444] opacity-60"
                  : "bg-[#DB4444] hover:bg-black"
              }`}
            >
              {placingOrder
                ? paymentMethod === "razorpay"
                  ? "Processing Payment..."
                  : "Placing Order..."
                : paymentMethod === "cod"
                  ? "Place Order"
                  : razorpayLoaded
                    ? "Pay Securely"
                    : "Loading Razorpay..."}
            </button>

            {/* =================================================
                BACK TO CHECKOUT
            ================================================= */}

            <Link
              href="/checkout"
              className="mt-5 block text-center text-xs font-medium text-black transition-colors hover:text-[#DB4444] sm:text-[13px]"
            >
              ← Back to Checkout
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Payment;
