// FILE LOCATION: src/components/auth/Login.jsx

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";

const Login = () => {
  const [formData, setFormData] = useState({
    contact: "",
    password: "",
  });

  // =========================================================
  // PASSWORD VISIBILITY
  // =========================================================

  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
      login: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    const contact = formData.contact.trim();
    const password = formData.password;

    // --------------------------------------------------
    // CONTACT VALIDATION
    // --------------------------------------------------

    if (!contact) {
      newErrors.contact = "Email or phone number is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[6-9][0-9]{9}$/;

      if (emailRegex.test(contact)) {
        if (contact.length > 50) {
          newErrors.contact = "Email must not exceed 50 characters";
        }
      } else if (phoneRegex.test(contact)) {
        // Valid Indian mobile number
      } else {
        newErrors.contact = "Enter a valid email or Indian mobile number";
      }
    }

    // --------------------------------------------------
    // PASSWORD VALIDATION
    // --------------------------------------------------

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          contact: formData.contact.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          login: data.message || "Invalid credentials",
        });

        return;
      }

      console.log("Login successful:", data.user);

      // --------------------------------------------------
      // REDIRECT BASED ON ROLE
      // --------------------------------------------------

      if (data.user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Login error:", error);

      setErrors({
        login: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-12 mt-8 w-full sm:mb-16 sm:mt-12 md:mb-20 md:mt-16 lg:mb-24 lg:mt-18">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 xl:pe-30">
        <div className="font-poppins text-sm font-normal leading-normal tracking-normal text-black sm:text-[15px] md:text-base">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-[60fr_40fr] lg:gap-16 xl:gap-36">
            {/* ================================================== */}
            {/* LEFT - IMAGE */}
            {/* ================================================== */}

            <div className="w-full">
              <img
                src="/assets/login.png"
                className="mx-auto h-auto w-full max-w-md object-contain lg:mx-0 lg:max-w-none"
                alt="Login"
              />
            </div>

            {/* ================================================== */}
            {/* RIGHT - FORM */}
            {/* ================================================== */}

            <div className="w-full">
              <h2 className="mb-4 text-2xl font-medium tracking-[4%] sm:mb-5 sm:text-3xl md:mb-6 lg:mb-7 lg:text-[36px]">
                Log in to Exclusive
              </h2>

              <p className="mb-8 text-sm sm:mb-10 sm:text-[15px] md:mb-12 md:text-base lg:mb-13">
                Enter your details below
              </p>

              <form onSubmit={handleSubmit}>
                {/* Contact */}
                <div className="mb-6 sm:mb-8 md:mb-10">
                  <input
                    type="text"
                    name="contact"
                    placeholder="Email"
                    value={formData.contact}
                    onChange={handleChange}
                    className="w-full border-b border-[#7A7A7A] py-2.5 text-sm placeholder:text-[#7A7A7A] placeholder:text-sm placeholder:font-normal outline-0 pe-4 sm:py-3 sm:text-[15px] sm:placeholder:text-[15px] md:text-base md:placeholder:text-[16px]"
                  />

                  {errors.contact && (
                    <p className="mt-2.5 text-xs text-red-500 sm:mt-3 sm:text-sm">
                      {errors.contact}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="mb-6 sm:mb-8 md:mb-10">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full border-b border-[#7A7A7A] py-2.5 pr-10 text-sm placeholder:text-[#7A7A7A] placeholder:text-sm placeholder:font-normal outline-0 sm:py-3 sm:pr-11 sm:text-[15px] sm:placeholder:text-[15px] md:text-base md:placeholder:text-[16px]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#7A7A7A] transition-colors hover:text-[#DB4444] focus:outline-none"
                    >
                      {showPassword ? (
                        <FiEyeOff size={17} />
                      ) : (
                        <FiEye size={17} />
                      )}
                    </button>
                  </div>

                  {errors.password && (
                    <p className="mt-2.5 text-xs text-red-500 sm:mt-3 sm:text-sm">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Login Error */}
                {errors.login && (
                  <p className="mb-4 text-xs text-red-500 sm:mb-5 sm:text-sm">
                    {errors.login}
                  </p>
                )}

                {/* Login Button + Forgot Password */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full cursor-pointer rounded-md bg-[#DB4444] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10 sm:py-3.5 sm:text-[15px] md:px-13 md:py-4 md:text-base"
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>

                  <Link
                    href="/auth/forgot-password"
                    className="text-center text-sm text-[#DB4444] transition-colors hover:text-black sm:text-left sm:text-[15px] md:text-base"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </form>

              {/* Signup Link */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm sm:mt-9 sm:gap-3 sm:text-[15px] md:text-base">
                <p>Don't have an account?</p>

                <div className="border-b border-[#7A7A7A] font-medium">
                  <Link href="/auth/signup">Sign up</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
