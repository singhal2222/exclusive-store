// FILE LOCATION: src/app/(website)/error.js

"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
    FiAlertTriangle,
    FiHome,
    FiRefreshCw,
    FiMessageCircle,
    FiMail,
} from "react-icons/fi";

// ============================================================
// STOREFRONT ERROR BOUNDARY
// ============================================================
//
// Rendered when an uncaught error occurs inside the (website)
// route group. Because it sits inside the storefront layout,
// the site header and footer remain visible.
//
// The `reset` function re-renders the segment that failed.
//
// ============================================================

export default function StorefrontError({ error, reset }) {
    // ----------------------------------------
    // Log the error (visible in browser console + server logs)
    // ----------------------------------------

    useEffect(() => {
        console.error("Storefront error boundary caught:", error);
    }, [error]);

    // ----------------------------------------
    // Detected error type (best-effort)
    // ----------------------------------------

    const errorMessage = String(error?.message || "").toLowerCase();

    const isNetworkError =
        errorMessage.includes("fetch") ||
        errorMessage.includes("network") ||
        errorMessage.includes("failed to load");

    const isNotFoundError =
        errorMessage.includes("not found") ||
        errorMessage.includes("404");

    // ----------------------------------------
    // Pick the right heading/description
    // ----------------------------------------

    let heading = "Something Went Wrong";
    let description =
        "We ran into an unexpected problem while loading this page. Please try again, or head back to the homepage.";

    if (isNetworkError) {
        heading = "Connection Problem";
        description =
            "We couldn't reach our servers. Please check your internet connection and try again.";
    } else if (isNotFoundError) {
        heading = "Page Not Found";
        description =
            "The content you're looking for may have been removed or is temporarily unavailable.";
    }

    // ----------------------------------------
    // Render
    // ----------------------------------------

    return (
        <section className="w-full bg-[#F5F5F5] px-4 py-12 font-poppins sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="mx-auto w-full max-w-4xl">
                {/* Main Card */}

                <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 text-center shadow-sm sm:p-10 lg:p-12">
                    {/* Icon */}

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 sm:h-20 sm:w-20">
                        <FiAlertTriangle
                            size={32}
                            className="text-[#DB4444] sm:hidden"
                        />
                        <FiAlertTriangle
                            size={40}
                            className="hidden text-[#DB4444] sm:block"
                        />
                    </div>

                    {/* Title */}

                    <h1 className="mt-6 text-2xl font-semibold text-black sm:mt-8 sm:text-3xl md:text-4xl">
                        {heading}
                    </h1>

                    {/* Divider */}

                    <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#DB4444] sm:mt-5" />

                    {/* Description */}

                    <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#7A7A7A] sm:mt-6 sm:text-base sm:leading-7">
                        {description}
                    </p>

                    {/* Dev-only error details */}

                    {process.env.NODE_ENV === "development" && error?.message && (
                        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-left sm:mt-8 sm:p-5">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-red-600 sm:text-xs">
                                Error Details (Development Only)
                            </p>

                            <p className="wrap-break-words font-mono text-[11px] leading-5 text-red-700 sm:text-xs sm:leading-6">
                                {error.message}
                            </p>

                            {error.digest && (
                                <p className="mt-2 break-all font-mono text-[10px] text-red-500 sm:text-[11px]">
                                    Digest: {error.digest}
                                </p>
                            )}

                            {error.stack && (
                                <details className="mt-3">
                                    <summary className="cursor-pointer text-[10px] font-medium text-red-600 hover:underline sm:text-xs">
                                        Show stack trace
                                    </summary>

                                    <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-all rounded-md bg-white p-3 text-[10px] leading-5 text-red-800 sm:text-[11px]">
                                        {error.stack}
                                    </pre>
                                </details>
                            )}
                        </div>
                    )}

                    {/* Primary Actions */}

                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => reset()}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#DB4444] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#C83D3D] sm:w-auto sm:py-3.5 sm:text-[15px] md:px-8 md:py-4 md:text-base"
                        >
                            <FiRefreshCw size={18} />
                            Try Again
                        </button>

                        <Link
                            href="/"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#E5E5E5] bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:border-[#DB4444] hover:text-[#DB4444] sm:w-auto sm:py-3.5 sm:text-[15px] md:px-8 md:py-4 md:text-base"
                        >
                            <FiHome size={18} />
                            Back to Homepage
                        </Link>
                    </div>
                </div>

                {/* Help Section */}

                <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5">
                    {/* Contact Support */}

                    <Link
                        href="/contact"
                        className="group flex items-start gap-4 rounded-xl border border-[#E5E5E5] bg-white p-5 transition-all hover:border-[#DB4444] hover:shadow-sm"
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF5F5] text-[#DB4444] transition-colors group-hover:bg-[#DB4444] group-hover:text-white">
                            <FiMessageCircle size={18} />
                        </div>

                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-black sm:text-[15px]">
                                Contact Support
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-[#7A7A7A] sm:text-[13px] sm:leading-6">
                                Our team is here to help if you&apos;re stuck.
                            </p>
                        </div>
                    </Link>

                    {/* Email Us */}

                    <a
                        href="mailto:ysinghal157@gmail.com"
                        className="group flex items-start gap-4 rounded-xl border border-[#E5E5E5] bg-white p-5 transition-all hover:border-[#DB4444] hover:shadow-sm"
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF5F5] text-[#DB4444] transition-colors group-hover:bg-[#DB4444] group-hover:text-white">
                            <FiMail size={18} />
                        </div>

                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-black sm:text-[15px]">
                                Email Us
                            </h3>

                            <p className="mt-1 break-all text-xs leading-5 text-[#7A7A7A] sm:text-[13px] sm:leading-6">
                                ysinghal157@gmail.com
                            </p>
                        </div>
                    </a>
                </div>

                {/* Bottom Hint */}

                <div className="mx-auto mt-10 max-w-2xl text-center sm:mt-12">
                    <p className="text-xs text-[#7A7A7A] sm:text-sm">
                        If the problem persists, please try refreshing the page or
                        clearing your browser cache.
                    </p>
                </div>
            </div>
        </section>
    );
}