"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiUser,
  FiShoppingBag,
  FiHeart,
  FiShoppingCart,
  FiMapPin,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiLock,
  FiShield,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiX,
} from "react-icons/fi";

const Settings = ({ user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [deleteLoading, setDeleteLoading] = useState(false);

  const pathname = usePathname();

  // --------------------------------------------------------------------------
  // Sidebar Menu
  // --------------------------------------------------------------------------

  const menuItems = [
    { path: "/account", icon: FiHome, label: "Dashboard" },
    { path: "/account/profile", icon: FiUser, label: "My Profile" },
    { path: "/account/orders", icon: FiShoppingBag, label: "My Orders" },
    { path: "/account/wishlist", icon: FiHeart, label: "Wishlist" },
    { path: "/cart", icon: FiShoppingCart, label: "Cart" },
    { path: "/account/addresses", icon: FiMapPin, label: "Addresses" },
    { path: "/account/settings", icon: FiSettings, label: "Settings" },
  ];

  // --------------------------------------------------------------------------
  // User Information
  // --------------------------------------------------------------------------

  const userName = user?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  // --------------------------------------------------------------------------
  // Close mobile sidebar on route change
  // --------------------------------------------------------------------------

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // --------------------------------------------------------------------------
  // Prevent body scroll when mobile sidebar is open
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  // --------------------------------------------------------------------------
  // Logout
  // --------------------------------------------------------------------------

  const handleLogout = async () => {
    if (logoutLoading) return;

    try {
      setLogoutLoading(true);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      window.location.href = "/auth/login";
    }
  };

  // --------------------------------------------------------------------------
  // Password Input Change
  // --------------------------------------------------------------------------

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setPasswordError("");
    setPasswordSuccess("");
  };

  // --------------------------------------------------------------------------
  // Password Validation
  // --------------------------------------------------------------------------

  const validatePasswordForm = () => {
    const currentPassword = passwordData.currentPassword.trim();
    const newPassword = passwordData.newPassword.trim();
    const confirmPassword = passwordData.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill all password fields.");
      return false;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return false;
    }

    if (newPassword.length > 100) {
      setPasswordError("New password must not exceed 100 characters.");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return false;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from your current password.",
      );
      return false;
    }

    return true;
  };

  // --------------------------------------------------------------------------
  // Change Password
  // --------------------------------------------------------------------------

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    const isValid = validatePasswordForm();

    if (!isValid) return;

    try {
      setPasswordLoading(true);

      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data?.message || "Failed to change password.");
        return;
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordSuccess("Password changed successfully.");
    } catch (error) {
      console.error("Change password error:", error);

      setPasswordError("Something went wrong while changing your password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Delete Account
  // --------------------------------------------------------------------------

  const handleDeleteAccount = async () => {
    if (deleteLoading) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone.",
    );

    if (!confirmed) return;

    try {
      setDeleteLoading(true);

      const response = await fetch("/api/auth/profile", {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        window.alert(data?.message || "Failed to delete your account.");
        return;
      }

      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Delete account error:", error);

      window.alert("Something went wrong while deleting your account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Sidebar Content (shared between desktop & mobile drawer)
  // --------------------------------------------------------------------------

  const SidebarContent = ({ isMobile = false }) => {
    const expanded = isMobile ? true : sidebarOpen;

    return (
      <>
        {/* Logo */}
        <div className="h-16 sm:h-17 flex items-center px-4 border-b border-[#E5E5E5] shrink-0 justify-between">
          {expanded ? (
            <Link
              href="/account"
              className="text-lg sm:text-xl md:text-[22px] font-bold text-black tracking-[0.04em]"
            >
              Exclusive
              <span className="text-[#DB4444]">.</span>
            </Link>
          ) : (
            <Link
              href="/account"
              className="text-lg sm:text-xl md:text-[22px] font-bold text-[#DB4444] mx-auto"
            >
              E.
            </Link>
          )}

          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="text-[#7A7A7A] hover:text-[#DB4444] transition-colors"
              aria-label="Close sidebar"
            >
              <FiX size={22} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  title={!expanded ? item.label : ""}
                  className={`flex items-center ${
                    expanded ? "gap-3 px-3" : "justify-center px-2"
                  } py-2.5 rounded-md text-[13px] transition-colors ${
                    isActive
                      ? "bg-[#FFF5F5] text-[#DB4444] font-medium"
                      : "text-[#7A7A7A] hover:bg-[#F5F5F5] hover:text-black"
                  }`}
                >
                  <Icon size={18} className="shrink-0" />

                  {expanded && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-[#E5E5E5] shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutLoading}
            title={!expanded ? "Logout" : ""}
            className={`w-full flex items-center ${
              expanded ? "gap-3 px-3" : "justify-center px-2"
            } py-2.5 rounded-md text-[13px] text-[#7A7A7A] hover:bg-[#FFF5F5] hover:text-[#DB4444] transition-colors disabled:opacity-50`}
          >
            <FiLogOut size={18} className="shrink-0" />

            {expanded && (
              <span>{logoutLoading ? "Logging out..." : "Logout"}</span>
            )}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-poppins flex">
      {/* ============================================================ */}
      {/* DESKTOP SIDEBAR (md and up) */}
      {/* ============================================================ */}

      <aside
        className={`hidden md:flex ${
          sidebarOpen ? "md:w-57.5" : "md:w-18"
        } bg-white border-r border-[#E5E5E5] transition-all duration-300 flex-col shrink-0 sticky top-0 h-screen overflow-y-auto`}
      >
        <SidebarContent />
      </aside>

      {/* ============================================================ */}
      {/* MOBILE SIDEBAR DRAWER */}
      {/* ============================================================ */}

      {/* Overlay */}
      <div
        onClick={() => setMobileSidebarOpen(false)}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          mobileSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 sm:w-72 bg-white border-r border-[#E5E5E5] z-50 flex flex-col overflow-y-auto transition-transform duration-300 md:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent isMobile={true} />
      </aside>

      {/* ============================================================ */}
      {/* MAIN */}
      {/* ============================================================ */}

      <main className="flex-1 min-w-0 min-h-screen w-full">
        {/* Topbar */}

        <header className="h-16 sm:h-17 bg-white border-b border-[#E5E5E5] flex items-center justify-between px-4 sm:px-5 lg:px-7 sticky top-0 z-20">
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileSidebarOpen(true);
              } else {
                setSidebarOpen(!sidebarOpen);
              }
            }}
            className="text-[#7A7A7A] hover:text-[#DB4444] transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            <FiMenu size={22} />
          </button>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#DB4444] text-white flex items-center justify-center font-semibold text-[13px] sm:text-[15px]">
              {userInitial}
            </div>

            <div className="hidden sm:block">
              <p className="text-[12px] sm:text-[13px] font-semibold text-black leading-tight">
                {userName}
              </p>

              <p className="text-[10px] sm:text-[11px] text-[#7A7A7A] leading-tight">
                Customer
              </p>
            </div>
          </div>
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* Content */}
        {/* ---------------------------------------------------------------- */}

        <div className="p-4 sm:p-5 lg:p-7 xl:p-8">
          {/* Heading */}

          <div className="mb-5 sm:mb-7">
            <p className="text-xs sm:text-[13px] text-[#7A7A7A] mb-1">
              Account
            </p>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-black">
              Account Settings
              <span className="text-[#DB4444]">.</span>
            </h1>

            <p className="text-xs sm:text-[13px] text-[#7A7A7A] mt-1">
              Manage your account preferences, security and password.
            </p>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Account Information */}
          {/* ---------------------------------------------------------------- */}

          <section className="mb-4 sm:mb-5 bg-white border border-[#E5E5E5] rounded-lg p-4 sm:p-5 md:p-6">
            <div className="mb-4 sm:mb-6 flex items-start gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-[#FFF5F5] text-[#DB4444] flex items-center justify-center">
                <FiUser size={18} className="sm:hidden" />
                <FiUser size={19} className="hidden sm:block" />
              </div>

              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-black sm:text-[16px]">
                  Account Information
                </h2>

                <p className="mt-1 text-[11px] text-[#7A7A7A] sm:text-[12px]">
                  Your current account information.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              {/* Name */}

              <div>
                <label className="mb-2 block text-[11px] font-medium text-[#555] sm:text-[12px]">
                  Full Name
                </label>

                <div className="h-10 sm:h-11 flex items-center px-3 sm:px-4 rounded-md bg-[#F9F9F9] border border-[#E5E5E5] text-xs sm:text-[13px] text-black wrap-break-words">
                  {user?.name || "Not available"}
                </div>
              </div>

              {/* Email */}

              <div>
                <label className="mb-2 block text-[11px] font-medium text-[#555] sm:text-[12px]">
                  Email Address
                </label>

                <div className="h-10 sm:h-11 flex items-center px-3 sm:px-4 rounded-md bg-[#F9F9F9] border border-[#E5E5E5] text-xs sm:text-[13px] text-black break-all">
                  {user?.email || "Not available"}
                </div>
              </div>

              {/* Phone */}

              <div>
                <label className="mb-2 block text-[11px] font-medium text-[#555] sm:text-[12px]">
                  Phone Number
                </label>

                <div className="h-10 sm:h-11 flex items-center px-3 sm:px-4 rounded-md bg-[#F9F9F9] border border-[#E5E5E5] text-xs sm:text-[13px] text-black">
                  {user?.phone || "Not available"}
                </div>
              </div>

              {/* Role */}

              <div>
                <label className="mb-2 block text-[11px] font-medium text-[#555] sm:text-[12px]">
                  Account Type
                </label>

                <div className="h-10 sm:h-11 flex items-center px-3 sm:px-4 rounded-md bg-[#F9F9F9] border border-[#E5E5E5] text-xs sm:text-[13px] text-black capitalize">
                  {user?.role || "user"}
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-[#E5E5E5]">
              <Link
                href="/account/profile"
                className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 rounded-md bg-black text-white text-[11px] sm:text-[12px] font-medium hover:bg-[#DB4444] transition-colors"
              >
                Edit Profile
              </Link>
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Change Password */}
          {/* ---------------------------------------------------------------- */}

          <section className="mb-4 sm:mb-5 bg-white border border-[#E5E5E5] rounded-lg p-4 sm:p-5 md:p-6">
            <div className="mb-4 sm:mb-6 flex items-start gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-[#FFF5F5] text-[#DB4444] flex items-center justify-center">
                <FiLock size={18} className="sm:hidden" />
                <FiLock size={19} className="hidden sm:block" />
              </div>

              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-black sm:text-[16px]">
                  Change Password
                </h2>

                <p className="mt-1 text-[11px] text-[#7A7A7A] sm:text-[12px]">
                  Update your password to keep your account secure.
                </p>
              </div>
            </div>

            {/* Password Messages */}

            {passwordError && (
              <div className="mb-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-md border border-red-200 bg-red-50 text-red-600 text-[11px] sm:text-[12px] sm:mb-5">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-md border border-green-200 bg-green-50 text-green-600 text-[11px] sm:text-[12px] flex items-center gap-2 sm:mb-5">
                <FiCheck size={15} />
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="grid grid-cols-1 gap-4 sm:gap-5 max-w-2xl">
                {/* Current Password */}

                <div>
                  <label className="mb-2 block text-[11px] font-medium text-[#555] sm:text-[12px]">
                    Current Password *
                  </label>

                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      maxLength={100}
                      autoComplete="current-password"
                      placeholder="Enter current password"
                      className="w-full h-10 sm:h-11 px-3 sm:px-4 pr-10 sm:pr-11 border border-[#E5E5E5] rounded-md text-xs sm:text-[13px] outline-none focus:border-[#DB4444]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7A7A] hover:text-[#DB4444]"
                      aria-label={
                        showCurrentPassword
                          ? "Hide current password"
                          : "Show current password"
                      }
                    >
                      {showCurrentPassword ? (
                        <FiEyeOff size={17} />
                      ) : (
                        <FiEye size={17} />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}

                <div>
                  <label className="mb-2 block text-[11px] font-medium text-[#555] sm:text-[12px]">
                    New Password *
                  </label>

                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      maxLength={100}
                      autoComplete="new-password"
                      placeholder="Enter new password"
                      className="w-full h-10 sm:h-11 px-3 sm:px-4 pr-10 sm:pr-11 border border-[#E5E5E5] rounded-md text-xs sm:text-[13px] outline-none focus:border-[#DB4444]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7A7A] hover:text-[#DB4444]"
                      aria-label={
                        showNewPassword
                          ? "Hide new password"
                          : "Show new password"
                      }
                    >
                      {showNewPassword ? (
                        <FiEyeOff size={17} />
                      ) : (
                        <FiEye size={17} />
                      )}
                    </button>
                  </div>

                  <p className="mt-1.5 text-[10px] text-[#7A7A7A] sm:text-[11px]">
                    Password must contain at least 8 characters.
                  </p>
                </div>

                {/* Confirm Password */}

                <div>
                  <label className="mb-2 block text-[11px] font-medium text-[#555] sm:text-[12px]">
                    Confirm New Password *
                  </label>

                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      maxLength={100}
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      className="w-full h-10 sm:h-11 px-3 sm:px-4 pr-10 sm:pr-11 border border-[#E5E5E5] rounded-md text-xs sm:text-[13px] outline-none focus:border-[#DB4444]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7A7A] hover:text-[#DB4444]"
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff size={17} />
                      ) : (
                        <FiEye size={17} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-[#E5E5E5]">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#DB4444] text-white text-[11px] sm:text-[12px] font-medium hover:bg-black transition-colors disabled:opacity-50"
                >
                  <FiLock size={15} />

                  {passwordLoading ? "Updating Password..." : "Update Password"}
                </button>
              </div>
            </form>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Account Security */}
          {/* ---------------------------------------------------------------- */}

          <section className="mb-4 sm:mb-5 bg-white border border-[#E5E5E5] rounded-lg p-4 sm:p-5 md:p-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-[#FFF5F5] text-[#DB4444] flex items-center justify-center">
                <FiShield size={18} className="sm:hidden" />
                <FiShield size={19} className="hidden sm:block" />
              </div>

              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-black sm:text-[16px]">
                  Account Security
                </h2>

                <p className="mt-1 text-[11px] text-[#7A7A7A] sm:text-[12px]">
                  Keep your account protected with a strong password.
                </p>

                <div className="mt-4 p-3 sm:p-4 rounded-md bg-[#F9F9F9] border border-[#E5E5E5]">
                  <p className="text-[11px] leading-5 text-[#555] sm:text-[12px]">
                    Your account is protected using password-based
                    authentication. Never share your password with anyone.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Delete Account */}
          {/* ---------------------------------------------------------------- */}

          <section className="bg-white border border-red-200 rounded-lg p-4 sm:p-5 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                  <FiTrash2 size={18} className="sm:hidden" />
                  <FiTrash2 size={19} className="hidden sm:block" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-red-600 sm:text-[16px]">
                    Delete Account
                  </h2>

                  <p className="mt-1 max-w-xl text-[11px] text-[#7A7A7A] sm:text-[12px]">
                    Deleting your account will deactivate your account and
                    remove your access to the website.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 px-5 py-2.5 rounded-md border border-red-200 text-red-600 text-[11px] sm:text-[12px] font-medium hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
              >
                <FiTrash2 size={15} />

                {deleteLoading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Settings;
