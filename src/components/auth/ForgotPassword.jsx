"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";

const ForgotPassword = () => {
  const router = useRouter();

  /*
   * ==================================================
   * FORM DATA
   * ==================================================
   */

  const [formData, setFormData] = useState({
    contact: "",
  });

  const [verificationData, setVerificationData] = useState({
    resetCode: "",
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  /*
   * ==================================================
   * PASSWORD VISIBILITY TOGGLES
   * ==================================================
   */

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /*
   * ==================================================
   * STATES
   * ==================================================
   */

  const [errors, setErrors] = useState({});

  const [verificationErrors, setVerificationErrors] = useState({});

  const [passwordErrors, setPasswordErrors] = useState({});

  const [loading, setLoading] = useState(false);

  const [verificationLoading, setVerificationLoading] = useState(false);

  const [resetLoading, setResetLoading] = useState(false);

  const [resetId, setResetId] = useState("");

  const [resetToken, setResetToken] = useState("");

  const [step, setStep] = useState("contact");

  const [successMessage, setSuccessMessage] = useState("");

  const [serverError, setServerError] = useState("");

  /*
   * ==================================================
   * RESPONSE HELPER
   * ==================================================
   *
   * Safely handles JSON and non-JSON responses.
   */

  const getResponseData = async (response) => {
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      try {
        return await response.json();
      } catch {
        return {
          success: false,
          message: "Invalid server response.",
        };
      }
    }

    const text = await response.text();

    return {
      success: false,
      message: text || "Something went wrong.",
    };
  };

  /*
   * ==================================================
   * CONTACT CHANGE
   * ==================================================
   */

  const handleContactChange = (e) => {
    const { value } = e.target;

    setFormData({
      contact: value,
    });

    setErrors({
      ...errors,
      contact: "",
    });

    setServerError("");
  };

  /*
   * ==================================================
   * VERIFICATION CODE CHANGE
   * ==================================================
   */

  const handleVerificationChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);

    setVerificationData({
      resetCode: value,
    });

    setVerificationErrors({
      ...verificationErrors,
      resetCode: "",
    });

    setServerError("");
  };

  /*
   * ==================================================
   * PASSWORD CHANGE
   * ==================================================
   */

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData({
      ...passwordData,
      [name]: value,
    });

    setPasswordErrors({
      ...passwordErrors,
      [name]: "",
    });

    setServerError("");
  };

  /*
   * ==================================================
   * CONTACT VALIDATION
   * ==================================================
   */

  const validateContact = () => {
    const newErrors = {};

    const contact = formData.contact.trim();

    if (!contact) {
      newErrors.contact = "Email or phone number is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      const phoneRegex = /^[0-9]{10}$/;

      const isEmail = emailRegex.test(contact.toLowerCase());

      const isPhone = phoneRegex.test(contact);

      if (!isEmail && !isPhone) {
        newErrors.contact = "Enter a valid email or 10-digit phone number";
      } else if (isEmail && contact.length > 50) {
        newErrors.contact = "Email must not exceed 50 characters";
      } else if (isPhone && !/^[6-9][0-9]{9}$/.test(contact)) {
        newErrors.contact = "Enter a valid Indian mobile number";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /*
   * ==================================================
   * VERIFICATION VALIDATION
   * ==================================================
   */

  const validateVerification = () => {
    const newErrors = {};

    if (!verificationData.resetCode) {
      newErrors.resetCode = "Verification code is required";
    } else if (!/^[0-9]{6}$/.test(verificationData.resetCode)) {
      newErrors.resetCode = "Verification code must be 6 digits";
    }

    setVerificationErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /*
   * ==================================================
   * PASSWORD VALIDATION
   * ==================================================
   */

  const validatePassword = () => {
    const newErrors = {};

    const { newPassword, confirmPassword } = passwordData;

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (newPassword.length > 30) {
      newErrors.newPassword = "Password must not exceed 30 characters";
    } else if (/\s/.test(newPassword)) {
      newErrors.newPassword = "Password must not contain spaces";
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword =
        "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(newPassword)) {
      newErrors.newPassword =
        "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = "Password must contain at least one number";
    } else if (!/[!@#$%^&*]/.test(newPassword)) {
      newErrors.newPassword =
        "Password must contain at least one special character";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /*
   * ==================================================
   * SEND RESET CODE
   * ==================================================
   */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerError("");
    setSuccessMessage("");

    if (!validateContact()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact: formData.contact.trim(),
        }),
      });

      const data = await getResponseData(response);

      console.log("Forgot password response:", data);

      if (!response.ok) {
        setServerError(data?.message || "Unable to send verification code.");

        return;
      }

      /*
       * We need resetId for the
       * verification step.
       */
      if (!data?.resetId) {
        setServerError(data?.message || "Unable to start password reset.");

        return;
      }

      setResetId(data.resetId);

      setVerificationData({
        resetCode: "",
      });

      setStep("verification");

      setSuccessMessage(data?.message || "A verification code has been sent.");
    } catch (error) {
      console.error("Forgot password request error:", error);

      setServerError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /*
   * ==================================================
   * VERIFY RESET CODE
   * ==================================================
   */

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();

    setServerError("");
    setSuccessMessage("");

    if (!validateVerification()) {
      return;
    }

    if (!resetId) {
      setServerError(
        "Password reset session is missing. Please request a new code.",
      );

      setStep("contact");

      return;
    }

    setVerificationLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resetId,
          resetCode: verificationData.resetCode,
        }),
      });

      const data = await getResponseData(response);

      console.log("Forgot password verification response:", data);

      if (!response.ok) {
        setServerError(data?.message || "Invalid verification code.");

        return;
      }

      if (!data?.resetToken) {
        setServerError(
          "Verification succeeded, but the reset session could not be created.",
        );

        return;
      }

      /*
       * Store reset token only
       * in React state.
       */
      setResetToken(data.resetToken);

      setPasswordData({
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordErrors({});

      setStep("password");

      setSuccessMessage(
        data?.message ||
          "Verification successful. You can now create a new password.",
      );
    } catch (error) {
      console.error("Verification request error:", error);

      setServerError("Unable to connect to the server. Please try again.");
    } finally {
      setVerificationLoading(false);
    }
  };

  /*
   * ==================================================
   * RESET PASSWORD
   * ==================================================
   */

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    setServerError("");
    setSuccessMessage("");

    if (!validatePassword()) {
      return;
    }

    if (!resetToken) {
      setServerError(
        "Password reset session is missing. Please request a new code.",
      );

      setStep("contact");

      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resetToken,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }),
      });

      const data = await getResponseData(response);

      console.log("Reset password response:", data);

      if (!response.ok) {
        setServerError(data?.message || "Unable to reset password.");

        return;
      }

      /*
       * Password has successfully
       * been changed.
       */
      setSuccessMessage(
        data?.message || "Your password has been reset successfully.",
      );

      /*
       * Clear sensitive reset data.
       */
      setResetToken("");
      setResetId("");

      setPasswordData({
        newPassword: "",
        confirmPassword: "",
      });

      // Reset visibility to hidden after a successful reset.
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
    } catch (error) {
      console.error("Reset password request error:", error);

      setServerError("Unable to connect to the server. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  /*
   * ==================================================
   * REQUEST NEW CODE
   * ==================================================
   */

  const handleRequestNewCode = () => {
    setVerificationData({
      resetCode: "",
    });

    setVerificationErrors({});

    setServerError("");
    setSuccessMessage("");

    setStep("contact");
  };

  /*
   * ==================================================
   * BACK TO CONTACT
   * ==================================================
   */

  const handleBackToContact = () => {
    setResetId("");
    setResetToken("");

    setVerificationData({
      resetCode: "",
    });

    setPasswordData({
      newPassword: "",
      confirmPassword: "",
    });

    setErrors({});
    setVerificationErrors({});
    setPasswordErrors({});
    setServerError("");
    setSuccessMessage("");

    // Reset password visibility toggles.
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setStep("contact");
  };

  /*
   * ==================================================
   * MAIN UI
   * ==================================================
   */

  return (
    <div className="mb-12 mt-8 w-full sm:mb-16 sm:mt-12 md:mb-20 md:mt-16 lg:mb-24 lg:mt-18">
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
                alt="Forgot Password"
              />
            </div>

            {/* ==================================================
                            RIGHT - FORM
                        ================================================== */}

            <div className="w-full">
              {/* ==================================================
                                STEP 1 - CONTACT
                            ================================================== */}

              {step === "contact" && (
                <>
                  <h2 className="mb-4 text-2xl font-medium tracking-[4%] sm:mb-5 sm:text-3xl md:mb-6 lg:mb-7 lg:text-[36px]">
                    Forgot Password
                  </h2>

                  <p className="mb-8 text-sm sm:mb-10 sm:text-[15px] md:mb-12 md:text-base lg:mb-13">
                    Enter your email or phone number below
                  </p>

                  <form onSubmit={handleSubmit}>
                    <div className="mb-6 sm:mb-8 md:mb-10">
                      <input
                        type="text"
                        name="contact"
                        value={formData.contact}
                        onChange={handleContactChange}
                        placeholder="Email or Phone Number"
                        autoComplete="username"
                        disabled={loading}
                        className="w-full border-b border-[#7A7A7A] py-2.5 text-sm placeholder:text-[#7A7A7A] placeholder:text-sm placeholder:font-normal outline-0 pe-4 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-[15px] sm:placeholder:text-[15px] md:text-base md:placeholder:text-[16px]"
                      />

                      {errors.contact && (
                        <p className="mt-2.5 text-xs text-red-500 sm:mt-3 sm:text-sm">
                          {errors.contact}
                        </p>
                      )}

                      {serverError && (
                        <p className="mt-2.5 text-xs text-red-500 sm:mt-3 sm:text-sm">
                          {serverError}
                        </p>
                      )}

                      {successMessage && (
                        <p className="mt-2.5 text-xs text-green-600 sm:mt-3 sm:text-sm">
                          {successMessage}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full cursor-pointer rounded-md bg-[#DB4444] py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:py-3.5 sm:text-[15px] md:py-4 md:text-base"
                    >
                      {loading ? "Sending..." : "Send Code"}
                    </button>
                  </form>
                </>
              )}

              {/* ==================================================
                                STEP 2 - VERIFICATION
                            ================================================== */}

              {step === "verification" && (
                <>
                  <h2 className="mb-4 text-2xl font-medium tracking-[4%] sm:mb-5 sm:text-3xl md:mb-6 lg:mb-7 lg:text-[36px]">
                    Verify Code
                  </h2>

                  <p className="mb-8 text-sm sm:mb-10 sm:text-[15px] md:mb-12 md:text-base lg:mb-13">
                    Enter the 6-digit verification code sent to your registered
                    contact
                  </p>

                  <form onSubmit={handleVerificationSubmit}>
                    <div className="mb-6 sm:mb-8 md:mb-10">
                      <input
                        type="text"
                        inputMode="numeric"
                        name="resetCode"
                        value={verificationData.resetCode}
                        onChange={handleVerificationChange}
                        placeholder="Enter 6-digit code"
                        autoComplete="one-time-code"
                        maxLength={6}
                        disabled={verificationLoading}
                        className="w-full border-b border-[#7A7A7A] py-2.5 text-sm tracking-[4px] placeholder:tracking-normal placeholder:text-[#7A7A7A] placeholder:text-sm placeholder:font-normal outline-0 pe-4 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-[15px] sm:placeholder:text-[15px] md:text-base md:placeholder:text-[16px]"
                      />

                      {verificationErrors.resetCode && (
                        <p className="mt-2.5 text-xs text-red-500 sm:mt-3 sm:text-sm">
                          {verificationErrors.resetCode}
                        </p>
                      )}

                      {serverError && (
                        <p className="mt-2.5 text-xs text-red-500 sm:mt-3 sm:text-sm">
                          {serverError}
                        </p>
                      )}

                      {successMessage && (
                        <p className="mt-2.5 text-xs text-green-600 sm:mt-3 sm:text-sm">
                          {successMessage}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={verificationLoading}
                      className="w-full cursor-pointer rounded-md bg-[#DB4444] py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:py-3.5 sm:text-[15px] md:py-4 md:text-base"
                    >
                      {verificationLoading ? "Verifying..." : "Verify Code"}
                    </button>
                  </form>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm sm:mt-7 sm:text-[15px]">
                    <button
                      type="button"
                      onClick={handleBackToContact}
                      className="cursor-pointer text-gray-600 hover:text-black"
                    >
                      Change email
                    </button>

                    <button
                      type="button"
                      onClick={handleRequestNewCode}
                      className="cursor-pointer font-medium underline underline-offset-4"
                    >
                      Request new code
                    </button>
                  </div>
                </>
              )}

              {/* ==================================================
                                STEP 3 - NEW PASSWORD
                            ================================================== */}

              {step === "password" && (
                <>
                  <h2 className="mb-4 text-2xl font-medium tracking-[4%] sm:mb-5 sm:text-3xl md:mb-6 lg:mb-7 lg:text-[36px]">
                    Create New Password
                  </h2>

                  <p className="mb-8 text-sm sm:mb-10 sm:text-[15px] md:mb-12 md:text-base lg:mb-13">
                    Enter and confirm your new password below
                  </p>

                  <form onSubmit={handlePasswordSubmit}>
                    {/* New Password */}

                    <div className="mb-6 sm:mb-7 md:mb-8">
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="New Password"
                          autoComplete="new-password"
                          disabled={resetLoading}
                          className="w-full border-b border-[#7A7A7A] py-2.5 pr-10 text-sm placeholder:text-[#7A7A7A] placeholder:text-sm placeholder:font-normal outline-0 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:pr-11 sm:text-[15px] sm:placeholder:text-[15px] md:text-base md:placeholder:text-[16px]"
                        />

                        <button
                          type="button"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          tabIndex={-1}
                          aria-label={
                            showNewPassword
                              ? "Hide new password"
                              : "Show new password"
                          }
                          className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#7A7A7A] transition-colors hover:text-[#DB4444] focus:outline-none"
                        >
                          {showNewPassword ? (
                            <FiEyeOff size={17} />
                          ) : (
                            <FiEye size={17} />
                          )}
                        </button>
                      </div>

                      {passwordErrors.newPassword && (
                        <p className="mt-2.5 text-xs text-red-500 sm:mt-3 sm:text-sm">
                          {passwordErrors.newPassword}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}

                    <div className="mb-6 sm:mb-8 md:mb-10">
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="Confirm New Password"
                          autoComplete="new-password"
                          disabled={resetLoading}
                          className="w-full border-b border-[#7A7A7A] py-2.5 pr-10 text-sm placeholder:text-[#7A7A7A] placeholder:text-sm placeholder:font-normal outline-0 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:pr-11 sm:text-[15px] sm:placeholder:text-[15px] md:text-base md:placeholder:text-[16px]"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                          tabIndex={-1}
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                          className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#7A7A7A] transition-colors hover:text-[#DB4444] focus:outline-none"
                        >
                          {showConfirmPassword ? (
                            <FiEyeOff size={17} />
                          ) : (
                            <FiEye size={17} />
                          )}
                        </button>
                      </div>

                      {passwordErrors.confirmPassword && (
                        <p className="mt-2.5 text-xs text-red-500 sm:mt-3 sm:text-sm">
                          {passwordErrors.confirmPassword}
                        </p>
                      )}

                      {serverError && (
                        <p className="mt-2.5 text-xs text-red-500 sm:mt-3 sm:text-sm">
                          {serverError}
                        </p>
                      )}

                      {successMessage && (
                        <p className="mt-2.5 text-xs text-green-600 sm:mt-3 sm:text-sm">
                          {successMessage}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full cursor-pointer rounded-md bg-[#DB4444] py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:py-3.5 sm:text-[15px] md:py-4 md:text-base"
                    >
                      {resetLoading ? "Resetting..." : "Reset Password"}
                    </button>
                  </form>
                </>
              )}

              {/* ==================================================
                                LOGIN LINK
                            ================================================== */}

              <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm sm:mt-9 sm:gap-3 sm:text-[15px] md:text-base">
                <p>Remember your password?</p>

                <div className="border-b border-[#7A7A7A] font-medium">
                  <Link href="/auth/login" className="hover:text-[#DB4444]">
                    Log in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
