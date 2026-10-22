// FILE LOCATION: src/components/Footer.jsx

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import { LuSendHorizontal } from "react-icons/lu";

import footers from "../data/footers.json";

import {
  FaFacebookF,
  FaLinkedinIn,
  FaInstagram,
  FaTwitter,
} from "react-icons/fa";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // ==================================================
  // CURRENT YEAR
  // ==================================================

  const currentYear = new Date().getFullYear();

  // ==================================================
  // CHECK AUTHENTICATION
  // ==================================================

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        setIsLoggedIn(response.ok && data?.success && data?.user);
      } catch (error) {
        console.error("Footer auth check error:", error);

        setIsLoggedIn(false);
      } finally {
        setIsAuthChecked(true);
      }
    };

    checkAuth();

    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener("auth:changed", handleAuthChange);

    return () => {
      window.removeEventListener("auth:changed", handleAuthChange);
    };
  }, []);

  // ==================================================
  // NEWSLETTER SUBSCRIBE
  // ==================================================

  const handleSubscribe = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("Please enter your email address.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Something went wrong. Please try again.",
        );
      }

      alert(data?.message || "Successfully subscribed to the newsletter.");

      setEmail("");
    } catch (error) {
      console.error("Newsletter subscription error:", error);

      alert(error?.message || "Unable to subscribe. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-black pb-6 pt-10 font-poppins text-sm font-normal leading-normal tracking-normal sm:pt-12 lg:pt-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-white">
          {/* ================================================== */}
          {/* MAIN FOOTER CONTENT — 5 EQUAL COLUMNS */}
          {/* ================================================== */}

          <div className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 md:gap-12 lg:mb-16 lg:grid-cols-5 lg:gap-6">
            {/* ================================================== */}
            {/* SUBSCRIBE COLUMN */}
            {/* ================================================== */}

            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/">
                <h1 className="mb-4 text-xl font-bold tracking-[3%] sm:mb-5 sm:text-2xl md:mb-6">
                  Exclusive
                </h1>
              </Link>

              <p className="mb-3 text-base font-medium sm:mb-4 sm:text-lg md:mb-5 lg:text-[20px]">
                Subscribe
              </p>

              <p className="mb-3 text-xs sm:mb-4 sm:text-sm md:mb-5 lg:text-base">
                Get 10% off your first order
              </p>

              <form
                onSubmit={handleSubscribe}
                className="relative w-full max-w-60"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-sm border border-white py-2.5 pe-10 ps-3 text-[11px] outline-0 placeholder:text-[11px] placeholder:font-normal placeholder:text-[#7A7A7A] sm:py-3 sm:ps-4 sm:text-[12px] sm:placeholder:text-[12px]"
                  disabled={isSubmitting}
                />

                <button
                  type="submit"
                  aria-label="Subscribe"
                  disabled={isSubmitting}
                >
                  <LuSendHorizontal
                    size={20}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer font-bold sm:hidden"
                  />

                  <LuSendHorizontal
                    size={24}
                    className="absolute right-4 top-1/2 hidden -translate-y-1/2 cursor-pointer font-bold sm:block"
                  />
                </button>
              </form>
            </div>

            {/* ================================================== */}
            {/* SUPPORT COLUMN */}
            {/* ================================================== */}

            <div>
              <p className="mb-4 text-base font-medium sm:mb-5 sm:text-lg md:mb-6 lg:text-[20px]">
                {footers?.supports?.[0]?.title}
              </p>

              <ul className="flex list-none flex-col gap-2.5 text-xs sm:gap-3 sm:text-sm md:gap-4 lg:text-base">
                {footers?.supports?.slice(1).map((support, index) => {
                  const isExternal =
                    support?.path?.startsWith("mailto:") ||
                    support?.path?.startsWith("tel:") ||
                    support?.path?.startsWith("http");

                  if (isExternal) {
                    return (
                      <li key={index}>
                        <a
                          href={support?.path}
                          className="wrap-break-words whitespace-pre-line transition-colors hover:text-[#DB4444]"
                        >
                          {support?.name}
                        </a>
                      </li>
                    );
                  }

                  return (
                    <li key={index}>
                      <Link
                        href={support?.path}
                        className="wrap-break-words whitespace-pre-line transition-colors hover:text-[#DB4444]"
                      >
                        {support?.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* ================================================== */}
            {/* ACCOUNT COLUMN */}
            {/* ================================================== */}

            <div>
              <p className="mb-4 text-base font-medium sm:mb-5 sm:text-lg md:mb-6 lg:text-[20px]">
                {footers?.accounts?.[0]?.title}
              </p>

              <ul className="flex list-none flex-col gap-2.5 text-xs sm:gap-3 sm:text-sm md:gap-4 lg:text-base">
                {footers?.accounts?.slice(1).map((account, index) => {
                  if (
                    account?.name === "Login / Register" &&
                    isAuthChecked &&
                    isLoggedIn
                  ) {
                    return null;
                  }

                  return (
                    <li key={index}>
                      <Link
                        href={account?.path}
                        className="transition-colors hover:text-[#DB4444]"
                      >
                        {account?.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* ================================================== */}
            {/* QUICK LINKS COLUMN */}
            {/* ================================================== */}

            <div>
              <p className="mb-4 text-base font-medium sm:mb-5 sm:text-lg md:mb-6 lg:text-[20px]">
                {footers["quick-links"]?.[0]?.title}
              </p>

              <ul className="flex list-none flex-col gap-2.5 text-xs sm:gap-3 sm:text-sm md:gap-4 lg:text-base">
                {footers["quick-links"]?.slice(1).map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link?.path}
                      className="transition-colors hover:text-[#DB4444]"
                    >
                      {link?.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ================================================== */}
            {/* LEGAL COLUMN */}
            {/* ================================================== */}

            <div>
              <p className="mb-4 text-base font-medium sm:mb-5 sm:text-lg md:mb-6 lg:text-[20px]">
                {footers?.legal?.[0]?.title}
              </p>

              <ul className="flex list-none flex-col gap-2.5 text-xs sm:gap-3 sm:text-sm md:gap-4 lg:text-base">
                {footers?.legal?.slice(1).map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link?.path}
                      className="transition-colors hover:text-[#DB4444]"
                    >
                      {link?.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* BOTTOM BAR — LEGAL LINKS + COPYRIGHT + SOCIAL */}
      {/* ================================================== */}

      <div className="border-t border-[#7A7A7A]/40">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 py-5 sm:flex-row sm:gap-6">
            {/* Copyright + Inline Legal Links */}

            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-5 sm:text-left">
              <div className="flex items-center gap-1 text-xs text-[#7A7A7A] sm:text-sm">
                <span className="text-lg sm:text-xl">&copy;</span>

                <p>{currentYear} Exclusive. All rights reserved.</p>
              </div>

              <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-5">
                {footers?.legal?.slice(1).map((link, index) => (
                  <Link
                    key={index}
                    href={link?.path}
                    className="text-[10px] text-[#7A7A7A] transition-colors hover:text-[#DB4444] sm:text-xs"
                  >
                    {link?.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Social Icons */}

            <div className="flex items-center gap-4 sm:gap-5">
              <a
                href="#"
                aria-label="Facebook"
                className="text-[#7A7A7A] transition-colors hover:text-[#DB4444]"
              >
                <FaFacebookF size={16} className="sm:hidden" />
                <FaFacebookF size={18} className="hidden sm:block" />
              </a>

              <a
                href="#"
                aria-label="Twitter"
                className="text-[#7A7A7A] transition-colors hover:text-[#DB4444]"
              >
                <FaTwitter size={16} className="sm:hidden" />
                <FaTwitter size={18} className="hidden sm:block" />
              </a>

              <a
                href="#"
                aria-label="Instagram"
                className="text-[#7A7A7A] transition-colors hover:text-[#DB4444]"
              >
                <FaInstagram size={16} className="sm:hidden" />
                <FaInstagram size={18} className="hidden sm:block" />
              </a>

              <a
                href="#"
                aria-label="LinkedIn"
                className="text-[#7A7A7A] transition-colors hover:text-[#DB4444]"
              >
                <FaLinkedinIn size={16} className="sm:hidden" />
                <FaLinkedinIn size={18} className="hidden sm:block" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
