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
  FiEdit3,
  FiMail,
  FiPhone,
  FiShield,
  FiX,
  FiSave,
} from "react-icons/fi";

const Profile = ({ user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const pathname = usePathname();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: user?.role || "user",
  });

  const userName = profileData.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  const menuItems = [
    { path: "/account", icon: FiHome, label: "Dashboard" },
    { path: "/account/profile", icon: FiUser, label: "My Profile" },
    { path: "/account/orders", icon: FiShoppingBag, label: "My Orders" },
    { path: "/account/wishlist", icon: FiHeart, label: "Wishlist" },
    { path: "/cart", icon: FiShoppingCart, label: "Cart" },
    { path: "/account/addresses", icon: FiMapPin, label: "Addresses" },
    { path: "/account/settings", icon: FiSettings, label: "Settings" },
  ];

  // ============================================================
  // CLOSE MOBILE SIDEBAR ON ROUTE CHANGE
  // ============================================================

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // ============================================================
  // PREVENT BODY SCROLL WHEN MOBILE SIDEBAR IS OPEN
  // ============================================================

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

  // ============================================================
  // LOGOUT
  // ============================================================

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

  // ============================================================
  // EDIT / CANCEL
  // ============================================================

  const handleEdit = () => {
    setFormData({
      name: profileData.name || "",
      email: profileData.email || "",
      phone: profileData.phone || "",
    });

    setError("");
    setSuccess("");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      name: profileData.name || "",
      email: profileData.email || "",
      phone: profileData.phone || "",
    });

    setError("");
    setSuccess("");
    setIsEditing(false);
  };

  // ============================================================
  // INPUT CHANGE
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ============================================================
  // SAVE
  // ============================================================

  const handleSave = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedPhone = formData.phone.trim();

    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    if (trimmedName.length > 30) {
      setError("Name must not exceed 30 characters.");
      return;
    }

    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(trimmedEmail)) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    if (trimmedPhone) {
      const phoneRegex = /^[6-9][0-9]{9}$/;

      if (!phoneRegex.test(trimmedPhone)) {
        setError("Please enter a valid 10-digit Indian phone number.");
        return;
      }
    }

    try {
      setSaving(true);

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update profile.");
        return;
      }

      setProfileData({
        name: data.user.name,
        email: data.user.email || "",
        phone: data.user.phone || "",
        role: data.user.role,
      });

      setFormData({
        name: data.user.name,
        email: data.user.email || "",
        phone: data.user.phone || "",
      });

      setSuccess("Profile updated successfully.");
      setIsEditing(false);
    } catch (error) {
      console.error("Update profile error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // SIDEBAR CONTENT (shared between desktop & mobile drawer)
  // ============================================================

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

        {/* Menu */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center ${
                    expanded ? "gap-3 px-3" : "justify-center px-2"
                  } py-2.5 rounded-md text-[13px] transition-colors ${
                    isActive
                      ? "bg-[#FFF5F5] text-[#DB4444] font-medium"
                      : "text-[#7A7A7A] hover:bg-[#F5F5F5] hover:text-black"
                  }`}
                  title={!expanded ? item.label : ""}
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
            className={`w-full flex items-center ${
              expanded ? "gap-3 px-3" : "justify-center px-2"
            } py-2.5 rounded-md text-[13px] text-[#7A7A7A] hover:bg-[#FFF5F5] hover:text-[#DB4444] transition-colors disabled:opacity-50`}
            title={!expanded ? "Logout" : ""}
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

      <main className="flex-1 min-w-0 w-full">
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
                {profileData.role === "user" ? "Customer" : profileData.role}
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 sm:p-5 lg:p-7 xl:p-8">
          {/* Heading */}
          <div className="mb-5 sm:mb-6">
            <p className="text-xs sm:text-[13px] text-[#7A7A7A] mb-1">
              Account
            </p>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-black">
              My Profile
              <span className="text-[#DB4444]">.</span>
            </h1>

            <p className="text-xs sm:text-[13px] text-[#7A7A7A] mt-1">
              Manage your personal information and account details.
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 sm:mb-5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-md border border-red-200 bg-red-50 text-red-600 text-xs sm:text-[13px]">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 sm:mb-5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-md border border-green-200 bg-green-50 text-green-600 text-xs sm:text-[13px]">
              {success}
            </div>
          )}

          {/* Profile Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Profile Card */}
            <div className="bg-white border border-[#E5E5E5] rounded-lg p-5 sm:p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#DB4444] text-white flex items-center justify-center text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4">
                  {userInitial}
                </div>

                <h2 className="text-base sm:text-lg font-semibold text-black wrap-break-words max-w-full">
                  {userName}
                </h2>

                <p className="text-[11px] sm:text-[12px] text-[#7A7A7A] mt-1">
                  {profileData.role === "user"
                    ? "Customer Account"
                    : profileData.role}
                </p>

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="mt-4 sm:mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-black text-white text-xs sm:text-[13px] font-medium hover:bg-[#DB4444] transition-colors"
                  >
                    <FiEdit3 size={15} />
                    Edit Profile
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="mt-4 sm:mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-[#E5E5E5] text-xs sm:text-[13px] text-[#7A7A7A] hover:text-black hover:border-black transition-colors disabled:opacity-50"
                  >
                    <FiX size={15} />
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div className="lg:col-span-2 bg-white border border-[#E5E5E5] rounded-lg p-5 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-black">
                  Personal Information
                </h2>

                <p className="text-[11px] sm:text-[12px] text-[#7A7A7A] mt-1">
                  Update your registered account information.
                </p>
              </div>

              {!isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Name */}
                  <div className="border border-[#E5E5E5] rounded-md p-3.5 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FiUser size={16} className="text-[#DB4444] shrink-0" />

                      <p className="text-[11px] sm:text-[12px] text-[#7A7A7A]">
                        Full Name
                      </p>
                    </div>

                    <p className="text-[13px] sm:text-[14px] font-medium text-black wrap-break-words">
                      {profileData.name || "Not available"}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="border border-[#E5E5E5] rounded-md p-3.5 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FiMail size={16} className="text-[#DB4444] shrink-0" />

                      <p className="text-[11px] sm:text-[12px] text-[#7A7A7A]">
                        Email Address
                      </p>
                    </div>

                    <p className="text-[13px] sm:text-[14px] font-medium text-black break-all">
                      {profileData.email || "Not available"}
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="border border-[#E5E5E5] rounded-md p-3.5 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FiPhone size={16} className="text-[#DB4444] shrink-0" />

                      <p className="text-[11px] sm:text-[12px] text-[#7A7A7A]">
                        Phone Number
                      </p>
                    </div>

                    <p className="text-[13px] sm:text-[14px] font-medium text-black wrap-break-words">
                      {profileData.phone || "Not available"}
                    </p>
                  </div>

                  {/* Account Type */}
                  <div className="border border-[#E5E5E5] rounded-md p-3.5 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FiShield size={16} className="text-[#DB4444] shrink-0" />

                      <p className="text-[11px] sm:text-[12px] text-[#7A7A7A]">
                        Account Type
                      </p>
                    </div>

                    <p className="text-[13px] sm:text-[14px] font-medium text-black wrap-break-words">
                      {profileData.role === "user"
                        ? "Customer"
                        : profileData.role || "User"}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSave}>
                  <div className="space-y-4 sm:space-y-5">
                    {/* Name */}
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-black mb-2">
                        Full Name
                      </label>

                      <div className="relative">
                        <FiUser
                          size={17}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7A7A]"
                        />

                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          maxLength={30}
                          className="w-full h-10 sm:h-11 pl-10 pr-3 sm:pr-4 border border-[#E5E5E5] rounded-md text-xs sm:text-[13px] text-black outline-none focus:border-[#DB4444] transition-colors"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-black mb-2">
                        Email Address
                      </label>

                      <div className="relative">
                        <FiMail
                          size={17}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7A7A]"
                        />

                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          maxLength={50}
                          className="w-full h-10 sm:h-11 pl-10 pr-3 sm:pr-4 border border-[#E5E5E5] rounded-md text-xs sm:text-[13px] text-black outline-none focus:border-[#DB4444] transition-colors"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-black mb-2">
                        Phone Number
                      </label>

                      <div className="relative">
                        <FiPhone
                          size={17}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7A7A]"
                        />

                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          maxLength={10}
                          className="w-full h-10 sm:h-11 pl-10 pr-3 sm:pr-4 border border-[#E5E5E5] rounded-md text-xs sm:text-[13px] text-black outline-none focus:border-[#DB4444] transition-colors"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-md border border-[#E5E5E5] text-xs sm:text-[13px] text-[#7A7A7A] hover:text-black hover:border-black transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#DB4444] text-white text-xs sm:text-[13px] font-medium hover:bg-black transition-colors disabled:opacity-50"
                      >
                        <FiSave size={15} />

                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Security */}
          <div className="mt-4 sm:mt-5 bg-white border border-[#E5E5E5] rounded-lg p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-black">
                  Account Security
                </h2>

                <p className="text-[11px] sm:text-[12px] text-[#7A7A7A] mt-1">
                  Password and security settings are managed from Settings.
                </p>
              </div>

              <Link
                href="/account/settings"
                className="inline-flex w-full sm:w-auto items-center justify-center px-5 py-2.5 rounded-md bg-black text-white text-xs sm:text-[13px] font-medium hover:bg-[#DB4444] transition-colors shrink-0"
              >
                Go to Settings
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
