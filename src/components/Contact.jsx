"use client";

import Link from "next/link";
import { FiMail, FiPhone } from "react-icons/fi";
import React, { useState } from "react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [apiError, setApiError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));

    setSuccessMessage("");
    setApiError("");
  };

  const validateForm = () => {
    const newErrors = {};

    // -----------------------------
    // Name validation
    // -----------------------------

    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      newErrors.name = "Name is required";
    } else if (!/^[A-Z][a-zA-Z]*( [A-Z][a-zA-Z]*)*$/.test(trimmedName)) {
      newErrors.name =
        "Name must start with a capital letter and contain only letters";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (trimmedName.length > 30) {
      newErrors.name = "Name must not exceed 30 characters";
    }

    // -----------------------------
    // Email validation
    // -----------------------------

    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = "Enter a valid email address";
      } else if (trimmedEmail.length > 50) {
        newErrors.email = "Email must not exceed 50 characters";
      }
    }

    // -----------------------------
    // Phone validation
    // -----------------------------

    const trimmedPhone = formData.phone.trim();

    if (!trimmedPhone) {
      newErrors.phone = "Phone number is required";
    } else {
      const phoneRegex = /^[6-9][0-9]{9}$/;

      if (!phoneRegex.test(trimmedPhone)) {
        newErrors.phone = "Enter a valid 10-digit Indian mobile number";
      }
    }

    // -----------------------------
    // Message validation
    // -----------------------------

    const trimmedMessage = formData.message.trim();

    if (!trimmedMessage) {
      newErrors.message = "Message is required";
    } else if (trimmedMessage.length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    } else if (trimmedMessage.length > 500) {
      newErrors.message = "Message must not exceed 500 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSuccessMessage("");
    setApiError("");

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          message: formData.message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.message || "Failed to send your message. Please try again.",
        );
      }

      setSuccessMessage(
        data.message ||
          "Your message has been sent successfully. We will contact you within 24 hours.",
      );

      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });

      setErrors({});
    } catch (error) {
      console.error("Contact form submission error:", error);

      setApiError(
        error?.message ||
          "Failed to send your message. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-12 mt-8 w-full sm:mb-16 sm:mt-12 md:mb-20 md:mt-16 lg:mb-24 lg:mt-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="font-poppins text-xs font-normal leading-normal tracking-normal text-black sm:text-[13px] md:text-[14px]">
          {/* ================================================== */}
          {/* BREADCRUMB */}
          {/* ================================================== */}

          <div className="mb-8 flex flex-wrap items-center gap-2 text-[#7A7A7A] sm:mb-12 sm:gap-3 md:mb-16 lg:mb-20">
            <Link href="/" className="transition-colors hover:text-[#DB4444]">
              Home
            </Link>

            <span>/</span>

            <Link
              href="/contact"
              className="text-black transition-colors hover:text-[#DB4444]"
            >
              Contact
            </Link>
          </div>

          {/* ================================================== */}
          {/* MAIN GRID */}
          {/* ================================================== */}

          <div className="grid grid-cols-1 items-stretch gap-6 sm:gap-8 md:gap-10 lg:grid-cols-[26fr_74fr] lg:gap-16 xl:gap-20">
            {/* ================================================== */}
            {/* CONTACT INFO CARD */}
            {/* ================================================== */}

            <div className="rounded-lg px-4 py-6 shadow sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-9">
              {/* Phone Section */}

              <div className="mb-6 border-b border-[#7A7A7A] pb-6 sm:mb-8 sm:pb-8">
                <div className="mb-4 flex items-center gap-3 font-medium sm:mb-6 sm:gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DB4444] text-white sm:h-10 sm:w-10">
                    <FiPhone size={18} className="sm:hidden" />

                    <FiPhone size={20} className="hidden sm:block" />
                  </div>

                  <p className="text-sm sm:text-[16px]">Call To Us</p>
                </div>

                <p className="mb-3 text-xs sm:mb-4 sm:text-[14px] md:text-[15px]">
                  We are available 24/7, 7 days a week.
                </p>

                <a
                  href="tel:+8801611112222"
                  className="break-all text-xs transition-colors hover:text-[#DB4444] sm:text-[14px] md:text-[15px]"
                >
                  Phone: +8801611112222
                </a>
              </div>

              {/* Email Section */}

              <div>
                <div className="mb-4 flex items-center gap-3 font-medium sm:mb-6 sm:gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DB4444] text-white sm:h-10 sm:w-10">
                    <FiMail size={18} className="sm:hidden" />

                    <FiMail size={20} className="hidden sm:block" />
                  </div>

                  <p className="text-sm sm:text-[16px]">Write To US</p>
                </div>

                <p className="mb-3 text-xs sm:mb-4 sm:text-[14px] md:text-[15px]">
                  Fill out our form and we will contact you within 24 hours.
                </p>

                <a
                  href="mailto:customer@exclusive.com"
                  className="mb-3 block break-all text-xs transition-colors hover:text-[#DB4444] sm:mb-4 sm:text-[14px] md:text-[15px]"
                >
                  Emails: customer@exclusive.com
                </a>

                <a
                  href="mailto:support@exclusive.com"
                  className="block break-all text-xs transition-colors hover:text-[#DB4444] sm:text-[14px] md:text-[15px]"
                >
                  Emails: support@exclusive.com
                </a>
              </div>
            </div>

            {/* ================================================== */}
            {/* CONTACT FORM CARD */}
            {/* ================================================== */}

            <div className="rounded-lg px-4 py-6 shadow sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-9">
              <form onSubmit={handleSubmit} noValidate>
                {/* ================================================== */}
                {/* SUCCESS MESSAGE */}
                {/* ================================================== */}

                {successMessage && (
                  <div
                    className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700 sm:text-sm"
                    role="status"
                  >
                    {successMessage}
                  </div>
                )}

                {/* ================================================== */}
                {/* API ERROR */}
                {/* ================================================== */}

                {apiError && (
                  <div
                    className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 sm:text-sm"
                    role="alert"
                  >
                    {apiError}
                  </div>
                )}

                {/* ================================================== */}
                {/* TOP ROW - NAME, EMAIL, PHONE */}
                {/* ================================================== */}

                <div className="mb-6 flex w-full flex-col gap-4 sm:mb-8 sm:gap-4 md:flex-row md:items-start">
                  {/* Name */}

                  <div className="w-full">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your Name *"
                      autoComplete="name"
                      maxLength={30}
                      className="w-full rounded-md border-0 bg-[#F5F5F5] px-3 py-2.5 text-xs outline-0 placeholder:text-xs placeholder:font-normal placeholder:text-[#7A7A7A] focus:ring-2 focus:ring-[#DB4444]/30 sm:px-4 sm:py-3.5 sm:text-[14px] sm:placeholder:text-[14px] md:text-[15px] md:placeholder:text-[15px] lg:text-[16px] lg:placeholder:text-[16px]"
                    />

                    {errors.name && (
                      <p className="mt-2 text-[11px] text-red-500 sm:mt-3 sm:text-sm">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}

                  <div className="w-full">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Your Email *"
                      autoComplete="email"
                      maxLength={50}
                      className="w-full rounded-md border-0 bg-[#F5F5F5] px-3 py-2.5 text-xs outline-0 placeholder:text-xs placeholder:font-normal placeholder:text-[#7A7A7A] focus:ring-2 focus:ring-[#DB4444]/30 sm:px-4 sm:py-3.5 sm:text-[14px] sm:placeholder:text-[14px] md:text-[15px] md:placeholder:text-[15px] lg:text-[16px] lg:placeholder:text-[16px]"
                    />

                    {errors.email && (
                      <p className="mt-2 text-[11px] text-red-500 sm:mt-3 sm:text-sm">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}

                  <div className="w-full">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Your Phone *"
                      autoComplete="tel"
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-md border-0 bg-[#F5F5F5] px-3 py-2.5 text-xs outline-0 placeholder:text-xs placeholder:font-normal placeholder:text-[#7A7A7A] focus:ring-2 focus:ring-[#DB4444]/30 sm:px-4 sm:py-3.5 sm:text-[14px] sm:placeholder:text-[14px] md:text-[15px] md:placeholder:text-[15px] lg:text-[16px] lg:placeholder:text-[16px]"
                    />

                    {errors.phone && (
                      <p className="mt-2 text-[11px] text-red-500 sm:mt-3 sm:text-sm">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* ================================================== */}
                {/* MESSAGE */}
                {/* ================================================== */}

                <div className="mb-6 w-full sm:mb-8">
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Your Message"
                    maxLength={500}
                    className="h-40 w-full resize-none rounded-lg border-0 bg-[#F5F5F5] px-3 py-2.5 text-xs outline-0 placeholder:text-xs placeholder:font-normal placeholder:text-[#7A7A7A] focus:ring-2 focus:ring-[#DB4444]/30 sm:h-52 sm:px-4 sm:py-3.5 sm:text-[14px] sm:placeholder:text-[14px] md:h-63 md:text-[15px] md:placeholder:text-[15px] lg:text-[16px] lg:placeholder:text-[16px]"
                  />

                  {errors.message && (
                    <p className="mt-2 text-[11px] text-red-500 sm:mt-3 sm:text-sm">
                      {errors.message}
                    </p>
                  )}

                  <p className="mt-2 text-right text-[11px] text-[#7A7A7A] sm:text-xs">
                    {formData.message.length}/500
                  </p>
                </div>

                {/* ================================================== */}
                {/* SUBMIT */}
                {/* ================================================== */}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full rounded-md px-6 py-3 text-xs font-medium text-white transition-colors sm:w-auto sm:px-10 sm:py-3.5 sm:text-[14px] md:px-13 md:text-[15px] lg:text-[16px] ${
                      isSubmitting
                        ? "cursor-not-allowed bg-[#DB4444]/60"
                        : "cursor-pointer bg-[#DB4444] hover:bg-black"
                    }`}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
