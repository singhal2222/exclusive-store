"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";

const Signup = () => {
  // =========================================================
  // SIGNUP FORM
  // =========================================================

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // =========================================================
  // PASSWORD VISIBILITY
  // =========================================================

  const [showPassword, setShowPassword] = useState(false);

  // =========================================================
  // STATES
  // =========================================================

  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(false);

  // After successful signup, we switch to the success screen.
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Store the email so we can display it on the success screen.
  const [submittedEmail, setSubmittedEmail] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  // =========================================================
  // SAFE JSON RESPONSE HELPER
  // =========================================================

  const getResponseData = async (response) => {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await response.text();

      return {
        message:
          text ||
          `Server returned an unexpected response (${response.status}).`,
      };
    }

    try {
      return await response.json();
    } catch (error) {
      console.error("Response JSON parsing error:", error);

      return {
        message: `Server returned an invalid JSON response (${response.status}).`,
      };
    }
  };

  // =========================================================
  // HANDLE FORM CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (errors.form) {
      setErrors((prev) => ({
        ...prev,
        form: "",
      }));
    }

    setSuccessMessage("");
  };

  // =========================================================
  // VALIDATE SIGNUP FORM
  // =========================================================

  const validateForm = () => {
    const newErrors = {};

    // ---------------------------------------------------------
    // NAME
    // ---------------------------------------------------------

    const name = formData.name.trim();

    if (!name) {
      newErrors.name = "Name is required";
    } else if (!/^[A-Za-z][A-Za-z\s'-]*$/.test(name)) {
      newErrors.name =
        "Name can only contain letters, spaces, hyphens and apostrophes";
    } else if (name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (name.length > 30) {
      newErrors.name = "Name must not exceed 30 characters";
    }

    // ---------------------------------------------------------
    // EMAIL
    // ---------------------------------------------------------

    const email = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Enter a valid email address";
    } else if (email.length > 50) {
      newErrors.email = "Email must not exceed 50 characters";
    }

    // ---------------------------------------------------------
    // PASSWORD
    // ---------------------------------------------------------

    const password = formData.password;

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (password.length > 30) {
      newErrors.password = "Password must not exceed 30 characters";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password =
        "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one number";
    } else if (!/[!@#$%^&*]/.test(password)) {
      newErrors.password =
        "Password must contain at least one special character";
    } else if (/\s/.test(password)) {
      newErrors.password = "Password must not contain spaces";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =========================================================
  // SUBMIT SIGNUP
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setErrors({});
    setSuccessMessage("");

    if (!validateForm()) return;

    setLoading(true);

    const emailToSubmit = formData.email.trim().toLowerCase();

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: emailToSubmit,
          password: formData.password,
        }),
      });

      const data = await getResponseData(response);

      console.log("Signup API response:", {
        status: response.status,
        ok: response.ok,
        data,
      });

      if (!response.ok) {
        setErrors({
          form:
            data?.message || "Unable to create your account. Please try again.",
        });

        return;
      }

      // -----------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------

      setSubmittedEmail(emailToSubmit);
      setSignupSuccess(true);

      setSuccessMessage(
        data?.message || "Verification link has been sent to your email.",
      );
    } catch (error) {
      console.error("Signup error:", error);

      setErrors({
        form: "Unable to connect to the server. Please make sure your Next.js server is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // BACK TO SIGNUP (from success screen)
  // =========================================================

  const handleBackToSignup = () => {
    setSignupSuccess(false);
    setSubmittedEmail("");
    setSuccessMessage("");
    setErrors({});

    // Hide the password again when returning to the form.
    setShowPassword(false);
  };

  // =========================================================
  // GOOGLE SIGNUP
  // =========================================================

  const handleGoogleSignup = () => {
    alert("Google signup will be connected here.");
  };

  // =========================================================
  // SHARED INPUT CLASS
  // =========================================================

  const inputClass =
    "w-full border-b border-[#7A7A7A] py-2.5 text-sm placeholder:text-[#7A7A7A] placeholder:text-sm placeholder:font-normal outline-0 pe-4 sm:py-3 sm:text-[15px] sm:placeholder:text-[15px] md:text-base md:placeholder:text-[16px]";

  // =========================================================
  // SIGNUP FORM
  // =========================================================

  const renderSignupForm = () => {
    return (
      <>
        <h2 className="mb-4 text-2xl font-medium tracking-[4%] sm:mb-5 sm:text-3xl md:mb-6 lg:text-[36px]">
          Create an account
        </h2>

        <p className="mb-8 text-sm sm:mb-10 sm:text-[15px] md:mb-12 md:text-base">
          Enter your details below
        </p>

        {/* General Error */}

        {errors.form && (
          <div className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* =================================================
              NAME
          ================================================= */}

          <div className="mb-6 sm:mb-8 md:mb-10">
            <input
              type="text"
              name="name"
              autoComplete="name"
              onChange={handleChange}
              value={formData.name}
              placeholder="Name"
              className={inputClass}
            />

            {errors.name && (
              <p className="mt-2.5 text-xs text-red-500 sm:mt-3 sm:text-sm">
                {errors.name}
              </p>
            )}
          </div>

          {/* =================================================
              EMAIL
          ================================================= */}

          <div className="mb-6 sm:mb-8 md:mb-10">
            <input
              type="email"
              name="email"
              autoComplete="email"
              onChange={handleChange}
              value={formData.email}
              placeholder="Email Address"
              className={inputClass}
            />

            {errors.email && (
              <p className="mt-2.5 text-xs text-red-500 sm:mt-3 sm:text-sm">
                {errors.email}
              </p>
            )}
          </div>

          {/* =================================================
              PASSWORD
          ================================================= */}

          <div className="mb-6 sm:mb-8 md:mb-10">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                onChange={handleChange}
                value={formData.password}
                placeholder="Password"
                className={`${inputClass} pr-10 sm:pr-11`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#7A7A7A] transition-colors hover:text-[#DB4444] focus:outline-none"
              >
                {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
              </button>
            </div>

            {errors.password && (
              <p className="mt-2.5 text-xs text-red-500 sm:mt-3 sm:text-sm">
                {errors.password}
              </p>
            )}
          </div>

          {/* =================================================
              CREATE ACCOUNT
          ================================================= */}

          <button
            type="submit"
            disabled={loading}
            className="mb-4 w-full cursor-pointer rounded-md bg-[#DB4444] py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:py-3.5 sm:text-[15px] md:py-4 md:text-base"
          >
            {loading ? "Sending verification link..." : "Create Account"}
          </button>
        </form>

        {/* =================================================
            GOOGLE SIGNUP
        ================================================= */}

        <button
          type="button"
          onClick={handleGoogleSignup}
          className="mb-6 flex w-full cursor-pointer items-center justify-center gap-3 rounded-md border border-[#7A7A7A] py-3 transition-colors hover:bg-[#F5F5F5] sm:mb-7 sm:gap-4 sm:py-3.5 md:mb-8 md:py-4"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.54 30.47 0 24 0 14.61 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.03 17.74 9.5 24 9.5z"
            />

            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.61-.15-3.16-.42-4.66H24v9.02h12.94c-.56 2.98-2.23 5.5-4.75 7.2l7.73 6c4.51-4.16 7.06-10.28 7.06-17.56z"
            />

            <path
              fill="#FBBC05"
              d="M10.54 28.59c-.51-1.53-.8-3.16-.8-4.84s.29-3.31.8-4.84l-7.98-6.19C.92 15.36 0 19.53 0 24s.92 8.64 2.56 11.28l7.98-6.19z"
            />

            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.9-5.89l-7.73-6c-2.14 1.44-4.89 2.29-8.17 2.29-6.26 0-11.57-3.53-13.46-8.56l-7.98 6.19C6.51 42.62 14.61 48 24 48z"
            />
          </svg>

          <span className="text-sm sm:text-[15px] md:text-base">
            Sign up with Google
          </span>
        </button>

        {/* =================================================
            LOGIN LINK
        ================================================= */}

        <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:gap-3 sm:text-[15px] md:text-base">
          <p>Already have account?</p>

          <div className="border-b border-[#7A7A7A] font-medium">
            <Link href="/auth/login">Log in</Link>
          </div>
        </div>
      </>
    );
  };

  // =========================================================
  // SUCCESS SCREEN (Check your email)
  // =========================================================

  const renderSuccessScreen = () => {
    return (
      <>
        <h2 className="mb-4 text-2xl font-medium tracking-[4%] sm:mb-5 sm:text-3xl md:mb-6 lg:text-[36px]">
          Check your email
        </h2>

        <p className="mb-8 text-sm leading-6 sm:mb-10 sm:text-[15px] md:mb-12 md:text-base">
          We have sent a verification link to your email address. Please open
          the email and click the link to activate your account.
        </p>

        {/* =================================================
            EMAIL DISPLAY
        ================================================= */}

        <div className="mb-8 rounded-md bg-[#F5F5F5] px-4 py-4 sm:mb-10 sm:px-5 sm:py-5">
          <p className="mb-1 text-xs text-[#7A7A7A] sm:text-sm">Sent to</p>

          <p className="break-all text-sm font-medium text-black sm:text-[15px] md:text-base">
            {submittedEmail}
          </p>
        </div>

        {/* =================================================
            SUCCESS MESSAGE (if provided by API)
        ================================================= */}

        {successMessage && (
          <div className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm leading-5 text-green-600">
            {successMessage}
          </div>
        )}

        {/* =================================================
            BACK TO SIGNUP
        ================================================= */}

        <button
          type="button"
          onClick={handleBackToSignup}
          className="mb-6 w-full cursor-pointer rounded-md border border-[#7A7A7A] py-3 text-sm font-medium transition-colors hover:bg-[#F5F5F5] sm:mb-8 sm:py-3.5 sm:text-[15px] md:py-4 md:text-base"
        >
          Use a different email
        </button>

        {/* =================================================
            LOGIN LINK
        ================================================= */}

        <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:gap-3 sm:text-[15px] md:text-base">
          <p>Already have account?</p>

          <div className="border-b border-[#7A7A7A] font-medium">
            <Link href="/auth/login">Log in</Link>
          </div>
        </div>
      </>
    );
  };

  // =========================================================
  // MAIN UI
  // =========================================================

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
                alt="Signup"
              />
            </div>

            {/* ==================================================
                RIGHT - FORM OR SUCCESS
            ================================================== */}

            <div className="w-full">
              {signupSuccess ? renderSuccessScreen() : renderSignupForm()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
