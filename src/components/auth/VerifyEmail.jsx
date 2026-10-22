// FILE LOCATION: src/components/auth/VerifyEmail.jsx

"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// ============================================================
// STATUSES
// ============================================================

const STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

// ============================================================
// VERIFY EMAIL COMPONENT
// ============================================================

const VerifyEmail = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(STATUS.LOADING);
  const [message, setMessage] = useState("Verifying your email...");

  // Prevents the effect from firing twice in React StrictMode
  // (which would double POST and cause a "link already used" error).
  const hasRunRef = useRef(false);

  // Redirect timer cleanup
  const redirectTimerRef = useRef(null);

  // ============================================================
  // EFFECT: VERIFY ON MOUNT
  // ============================================================

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const token = searchParams.get("token");
    const id = searchParams.get("id");

    // ---------------------------------------------------------
    // Missing params
    // ---------------------------------------------------------

    if (!token || !id) {
      setStatus(STATUS.ERROR);
      setMessage(
        "This verification link is invalid or incomplete. Please sign up again to receive a new link.",
      );
      return;
    }

    // ---------------------------------------------------------
    // Fire the verification request
    // ---------------------------------------------------------

    const verify = async () => {
      try {
        const response = await fetch("/api/auth/signup/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ token, id }),
        });

        // Safely parse JSON (in case the server returns HTML)
        let data = null;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        // -----------------------------------------------------
        // Success
        // -----------------------------------------------------

        if (response.ok && data?.success) {
          setStatus(STATUS.SUCCESS);
          setMessage(
            data?.message ||
              "Email verified successfully. Your account is now active.",
          );

          // Redirect after a short delay so the user sees the
          // success state before the page changes.
          redirectTimerRef.current = setTimeout(() => {
            router.push("/");
            router.refresh();
          }, 2500);

          return;
        }

        // -----------------------------------------------------
        // Error
        // -----------------------------------------------------

        setStatus(STATUS.ERROR);
        setMessage(
          data?.message ||
            "We could not verify your email. The link may have expired or already been used.",
        );
      } catch (error) {
        console.error("Verify email error:", error);

        setStatus(STATUS.ERROR);
        setMessage(
          "Unable to connect to the server. Please check your internet connection and try again.",
        );
      }
    };

    verify();

    // Cleanup redirect timer on unmount
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, [router, searchParams]);

  // ============================================================
  // RENDER: LOADING
  // ============================================================

  const renderLoading = () => {
    return (
      <>
        <div className="mb-8 flex justify-center sm:mb-10">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#F5F5F5] border-t-[#DB4444] sm:h-16 sm:w-16" />
        </div>

        <h2 className="mb-4 text-center text-2xl font-medium tracking-[4%] sm:mb-5 sm:text-3xl md:mb-6 lg:text-[36px]">
          Verifying your email
        </h2>

        <p className="text-center text-sm leading-6 text-[#7A7A7A] sm:text-[15px] md:text-base">
          Please wait while we confirm your email address. This should only take
          a moment.
        </p>
      </>
    );
  };

  // ============================================================
  // RENDER: SUCCESS
  // ============================================================

  const renderSuccess = () => {
    return (
      <>
        {/* Checkmark Circle */}

        <div className="mb-8 flex justify-center sm:mb-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 sm:h-20 sm:w-20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-green-600 sm:h-10 sm:w-10"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <h2 className="mb-4 text-center text-2xl font-medium tracking-[4%] sm:mb-5 sm:text-3xl md:mb-6 lg:text-[36px]">
          Email verified!
        </h2>

        <p className="mb-8 text-center text-sm leading-6 text-[#7A7A7A] sm:mb-10 sm:text-[15px] md:text-base">
          {message}
        </p>

        {/* Success message box */}

        <div className="mb-8 rounded-md bg-green-50 px-4 py-3.5 text-center text-sm leading-5 text-green-700 sm:mb-10 sm:px-5 sm:py-4 sm:text-[15px]">
          You are now logged in and will be redirected to the homepage shortly.
        </div>

        {/* Manual redirect button */}

        <button
          type="button"
          onClick={() => {
            if (redirectTimerRef.current) {
              clearTimeout(redirectTimerRef.current);
            }
            router.push("/");
            router.refresh();
          }}
          className="mb-4 w-full cursor-pointer rounded-md bg-[#DB4444] py-3 text-sm font-medium text-white transition-colors hover:bg-black sm:py-3.5 sm:text-[15px] md:py-4 md:text-base"
        >
          Go to Homepage
        </button>

        {/* Account link */}

        <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:gap-3 sm:text-[15px] md:text-base">
          <p>Want to see your account?</p>

          <div className="border-b border-[#7A7A7A] font-medium">
            <Link href="/account">Go to Account</Link>
          </div>
        </div>
      </>
    );
  };

  // ============================================================
  // RENDER: ERROR
  // ============================================================

  const renderError = () => {
    return (
      <>
        {/* Warning icon */}

        <div className="mb-8 flex justify-center sm:mb-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 sm:h-20 sm:w-20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-[#DB4444] sm:h-10 sm:w-10"
            >
              <line x1="12" y1="8" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
        </div>

        <h2 className="mb-4 text-center text-2xl font-medium tracking-[4%] sm:mb-5 sm:text-3xl md:mb-6 lg:text-[36px]">
          Verification failed
        </h2>

        <p className="mb-8 text-center text-sm leading-6 text-[#7A7A7A] sm:mb-10 sm:text-[15px] md:text-base">
          {message}
        </p>

        {/* Error message box */}

        <div className="mb-8 rounded-md bg-red-50 px-4 py-3.5 text-sm leading-5 text-red-600 sm:mb-10 sm:px-5 sm:py-4 sm:text-[15px]">
          <strong>What can you do?</strong>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            <li>Check that you clicked the latest verification email.</li>
            <li>Make sure the link has not already been used.</li>
            <li>Start a new signup to receive a fresh link.</li>
          </ul>
        </div>

        {/* Primary action — sign up again */}

        <Link
          href="/auth/signup"
          className="mb-3 block w-full rounded-md bg-[#DB4444] py-3 text-center text-sm font-medium text-white transition-colors hover:bg-black sm:py-3.5 sm:text-[15px] md:py-4 md:text-base"
        >
          Sign Up Again
        </Link>

        {/* Secondary action — try again */}

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mb-6 w-full cursor-pointer rounded-md border border-[#7A7A7A] py-3 text-sm font-medium transition-colors hover:bg-[#F5F5F5] sm:mb-8 sm:py-3.5 sm:text-[15px] md:py-4 md:text-base"
        >
          Try Again
        </button>

        {/* Login link */}

        <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:gap-3 sm:text-[15px] md:text-base">
          <p>Already have an account?</p>

          <div className="border-b border-[#7A7A7A] font-medium">
            <Link href="/auth/login">Log in</Link>
          </div>
        </div>
      </>
    );
  };

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="mb-12 mt-8 w-full sm:mb-16 sm:mt-12 md:mb-20 md:mt-16 lg:mb-24 lg:mt-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 xl:pe-30">
        <div className="font-poppins text-sm font-normal leading-normal tracking-normal text-black sm:text-[15px] md:text-base">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-[60fr_40fr] lg:gap-16 xl:gap-36">
            {/* ==================================================
                LEFT - IMAGE
            ================================================== */}

            <div className="w-full">
              <img
                src="/assets/login.png"
                className="mx-auto h-auto w-full max-w-md object-contain lg:mx-0 lg:max-w-none"
                alt="Verify email"
              />
            </div>

            {/* ==================================================
                RIGHT - CONTENT
            ================================================== */}

            <div className="w-full">
              {status === STATUS.LOADING && renderLoading()}
              {status === STATUS.SUCCESS && renderSuccess()}
              {status === STATUS.ERROR && renderError()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
