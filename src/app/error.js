// FILE LOCATION: src/app/error.js

"use client";

import { useEffect } from "react";
import Link from "next/link";

// ============================================================
// GLOBAL ERROR BOUNDARY
// ============================================================
//
// Rendered when an uncaught error occurs in any page that does
// not have a more specific error.js file in its segment.
//
// The `reset` function re-renders the failed segment. Use it
// sparingly — only for transient errors.
//
// ============================================================

export default function GlobalError({ error, reset }) {
    // ----------------------------------------
    // Log the error for debugging
    // ----------------------------------------

    useEffect(() => {
        console.error("Global error boundary caught:", error);
    }, [error]);

    // ----------------------------------------
    // Render
    // ----------------------------------------

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] px-4 py-12 font-poppins">
            <div className="w-full max-w-xl rounded-xl border border-[#E5E5E5] bg-white p-6 text-center sm:p-10">
                {/* Icon */}

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 sm:h-20 sm:w-20">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#DC2626"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>

                {/* Title */}

                <h1 className="mt-5 text-xl font-semibold text-black sm:mt-6 sm:text-2xl md:text-3xl">
                    Something Went Wrong
                </h1>

                {/* Description */}

                <p className="mx-auto mt-3 max-w-md text-xs leading-5 text-[#7A7A7A] sm:mt-4 sm:text-sm sm:leading-6">
                    We apologize for the inconvenience. An unexpected error occurred
                    while loading this page. Please try again, or return to the
                    homepage.
                </p>

                {/* Error message (dev only) */}

                {process.env.NODE_ENV === "development" && error?.message && (
                    <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-left sm:mt-6">
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
                    </div>
                )}

                {/* Actions */}

                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => reset()}
                        className="inline-flex w-full items-center justify-center rounded-md bg-[#DB4444] px-6 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#C83D3D] sm:w-auto sm:py-3 sm:text-sm"
                    >
                        Try Again
                    </button>

                    <Link
                        href="/"
                        className="inline-flex w-full items-center justify-center rounded-md border border-[#E5E5E5] bg-white px-6 py-2.5 text-xs font-medium text-black transition-colors hover:border-[#DB4444] hover:text-[#DB4444] sm:w-auto sm:py-3 sm:text-sm"
                    >
                        Go to Homepage
                    </Link>
                </div>

                {/* Help Text */}

                <p className="mt-6 text-[10px] text-[#999999] sm:mt-8 sm:text-xs">
                    If the problem persists, please{" "}
                    <Link
                        href="/contact"
                        className="font-medium text-[#DB4444] hover:underline"
                    >
                        contact support
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}