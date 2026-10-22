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
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiCheck,
  FiX,
  FiStar,
} from "react-icons/fi";

const emptyForm = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  addressType: "Home",
  isDefault: false,
};

const Addresses = ({ user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [defaultLoadingId, setDefaultLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState(emptyForm);

  const pathname = usePathname();

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
  // Fetch addresses
  // --------------------------------------------------------------------------

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/addresses", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "Failed to load addresses.");
        return;
      }

      setAddresses(data?.addresses || []);
    } catch (error) {
      console.error("Fetch addresses error:", error);
      setError("Something went wrong while loading addresses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

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
  // Form change
  // --------------------------------------------------------------------------

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
    setSuccess("");
  };

  // --------------------------------------------------------------------------
  // Reset form
  // --------------------------------------------------------------------------

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setEditingAddressId(null);
  };

  // --------------------------------------------------------------------------
  // Open Add Form
  // --------------------------------------------------------------------------

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  // --------------------------------------------------------------------------
  // Open Edit Form
  // --------------------------------------------------------------------------

  const openEditForm = (address) => {
    setFormData({
      fullName: address?.fullName || "",
      phone: address?.phone || "",
      addressLine1: address?.addressLine1 || "",
      addressLine2: address?.addressLine2 || "",
      city: address?.city || "",
      state: address?.state || "",
      postalCode: address?.postalCode || "",
      country: address?.country || "India",
      addressType: address?.addressType || "Home",
      isDefault: Boolean(address?.isDefault),
    });

    setEditingAddressId(address?._id);
    setShowForm(true);
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --------------------------------------------------------------------------
  // Close Form
  // --------------------------------------------------------------------------

  const closeForm = () => {
    if (saving) return;

    resetForm();
    setShowForm(false);
    setError("");
  };

  // --------------------------------------------------------------------------
  // Validate Form
  // --------------------------------------------------------------------------

  const validateForm = () => {
    const trimmedFullName = formData.fullName.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedAddressLine1 = formData.addressLine1.trim();
    const trimmedAddressLine2 = formData.addressLine2.trim();
    const trimmedCity = formData.city.trim();
    const trimmedState = formData.state.trim();
    const trimmedPostalCode = formData.postalCode.trim();
    const trimmedCountry = formData.country.trim();

    if (
      !trimmedFullName ||
      !trimmedPhone ||
      !trimmedAddressLine1 ||
      !trimmedCity ||
      !trimmedState ||
      !trimmedPostalCode
    ) {
      setError("Please fill all required fields.");
      return null;
    }

    if (trimmedFullName.length < 2) {
      setError("Full name must be at least 2 characters.");
      return null;
    }

    if (trimmedFullName.length > 50) {
      setError("Full name must not exceed 50 characters.");
      return null;
    }

    const phoneRegex = /^[6-9][0-9]{9}$/;

    if (!phoneRegex.test(trimmedPhone)) {
      setError("Please enter a valid 10-digit Indian phone number.");
      return null;
    }

    if (trimmedAddressLine1.length > 150) {
      setError("Address must not exceed 150 characters.");
      return null;
    }

    if (trimmedAddressLine2.length > 150) {
      setError("Address Line 2 must not exceed 150 characters.");
      return null;
    }

    if (trimmedCity.length > 50) {
      setError("City must not exceed 50 characters.");
      return null;
    }

    if (trimmedState.length > 50) {
      setError("State must not exceed 50 characters.");
      return null;
    }

    const postalCodeRegex = /^[1-9][0-9]{5}$/;

    if (!postalCodeRegex.test(trimmedPostalCode)) {
      setError("Please enter a valid 6-digit postal code.");
      return null;
    }

    return {
      fullName: trimmedFullName,
      phone: trimmedPhone,
      addressLine1: trimmedAddressLine1,
      addressLine2: trimmedAddressLine2,
      city: trimmedCity,
      state: trimmedState,
      postalCode: trimmedPostalCode,
      country: trimmedCountry || "India",
      addressType: formData.addressType,
      isDefault: formData.isDefault,
    };
  };

  // --------------------------------------------------------------------------
  // Add / Edit Address
  // --------------------------------------------------------------------------

  const handleSubmitAddress = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validatedData = validateForm();

    if (!validatedData) return;

    try {
      setSaving(true);

      const isEditing = Boolean(editingAddressId);

      const url = isEditing
        ? `/api/addresses/${editingAddressId}`
        : "/api/addresses";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.message || `Failed to ${isEditing ? "update" : "add"} address.`,
        );
        return;
      }

      await fetchAddresses();

      resetForm();
      setShowForm(false);

      setSuccess(
        isEditing
          ? "Address updated successfully."
          : "Address added successfully.",
      );
    } catch (error) {
      console.error("Save address error:", error);
      setError("Something went wrong while saving the address.");
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // Set Default Address
  // --------------------------------------------------------------------------

  const handleSetDefault = async (addressId) => {
    if (defaultLoadingId) return;

    setError("");
    setSuccess("");

    try {
      setDefaultLoadingId(addressId);

      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isDefault: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "Failed to set default address.");
        return;
      }

      await fetchAddresses();

      setSuccess("Default address updated successfully.");
    } catch (error) {
      console.error("Set default address error:", error);
      setError("Something went wrong while updating the default address.");
    } finally {
      setDefaultLoadingId(null);
    }
  };

  // --------------------------------------------------------------------------
  // Delete Address
  // --------------------------------------------------------------------------

  const handleDelete = async (address) => {
    if (deletingId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete your ${address.addressType.toLowerCase()} address?`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      setDeletingId(address._id);

      const response = await fetch(`/api/addresses/${address._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "Failed to delete address.");
        return;
      }

      await fetchAddresses();

      setSuccess("Address deleted successfully.");
    } catch (error) {
      console.error("Delete address error:", error);
      setError("Something went wrong while deleting the address.");
    } finally {
      setDeletingId(null);
    }
  };

  // --------------------------------------------------------------------------
  // User information
  // --------------------------------------------------------------------------

  const userName = user?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

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

  // --------------------------------------------------------------------------
  // UI
  // --------------------------------------------------------------------------

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

        {/* Content */}
        <div className="p-4 sm:p-5 lg:p-7 xl:p-8">
          {/* Heading */}
          <div className="mb-5 sm:mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs sm:text-[13px] text-[#7A7A7A] mb-1">
                Account
              </p>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-black">
                My Addresses
                <span className="text-[#DB4444]">.</span>
              </h1>

              <p className="text-xs sm:text-[13px] text-[#7A7A7A] mt-1">
                Manage your saved delivery addresses.
              </p>
            </div>

            {!showForm && (
              <button
                type="button"
                onClick={openAddForm}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-black sm:w-auto sm:text-[13px]"
              >
                <FiPlus size={17} />
                Add New Address
              </button>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-md border border-red-200 bg-red-50 text-red-600 text-xs sm:text-[13px] sm:mb-5">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-md border border-green-200 bg-green-50 text-green-600 text-xs sm:text-[13px] sm:mb-5">
              {success}
            </div>
          )}

          {/* Add / Edit Form */}
          {showForm && (
            <div className="mb-5 rounded-lg border border-[#E5E5E5] bg-white p-4 sm:p-6">
              <div className="mb-4 sm:mb-6 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-black">
                    {editingAddressId ? "Edit Address" : "Add New Address"}
                  </h2>

                  <p className="mt-1 text-[11px] sm:text-[12px] text-[#7A7A7A]">
                    {editingAddressId
                      ? "Update your delivery address details."
                      : "Enter your delivery address details."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="shrink-0 text-[#7A7A7A] hover:text-[#DB4444] disabled:opacity-50"
                  aria-label="Close form"
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitAddress}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  {/* Full Name */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[13px]">
                      Full Name *
                    </label>

                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      maxLength={50}
                      placeholder="Enter full name"
                      className="h-10 sm:h-11 w-full rounded-md border border-[#E5E5E5] px-3 sm:px-4 text-xs sm:text-[13px] outline-none focus:border-[#DB4444]"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[13px]">
                      Phone Number *
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={10}
                      inputMode="numeric"
                      placeholder="Enter 10-digit phone number"
                      className="h-10 sm:h-11 w-full rounded-md border border-[#E5E5E5] px-3 sm:px-4 text-xs sm:text-[13px] outline-none focus:border-[#DB4444]"
                    />
                  </div>

                  {/* Address Line 1 */}
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[13px]">
                      Address Line 1 *
                    </label>

                    <input
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleChange}
                      maxLength={150}
                      placeholder="House no., building, street"
                      className="h-10 sm:h-11 w-full rounded-md border border-[#E5E5E5] px-3 sm:px-4 text-xs sm:text-[13px] outline-none focus:border-[#DB4444]"
                    />
                  </div>

                  {/* Address Line 2 */}
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[13px]">
                      Address Line 2
                    </label>

                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleChange}
                      maxLength={150}
                      placeholder="Apartment, landmark, etc. (optional)"
                      className="h-10 sm:h-11 w-full rounded-md border border-[#E5E5E5] px-3 sm:px-4 text-xs sm:text-[13px] outline-none focus:border-[#DB4444]"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[13px]">
                      City *
                    </label>

                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      maxLength={50}
                      placeholder="Enter city"
                      className="h-10 sm:h-11 w-full rounded-md border border-[#E5E5E5] px-3 sm:px-4 text-xs sm:text-[13px] outline-none focus:border-[#DB4444]"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[13px]">
                      State *
                    </label>

                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      maxLength={50}
                      placeholder="Enter state"
                      className="h-10 sm:h-11 w-full rounded-md border border-[#E5E5E5] px-3 sm:px-4 text-xs sm:text-[13px] outline-none focus:border-[#DB4444]"
                    />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[13px]">
                      Postal Code *
                    </label>

                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="Enter 6-digit PIN"
                      className="h-10 sm:h-11 w-full rounded-md border border-[#E5E5E5] px-3 sm:px-4 text-xs sm:text-[13px] outline-none focus:border-[#DB4444]"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[13px]">
                      Country
                    </label>

                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Enter country"
                      className="h-10 sm:h-11 w-full rounded-md border border-[#E5E5E5] px-3 sm:px-4 text-xs sm:text-[13px] outline-none focus:border-[#DB4444]"
                    />
                  </div>

                  {/* Address Type */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[13px]">
                      Address Type
                    </label>

                    <select
                      name="addressType"
                      value={formData.addressType}
                      onChange={handleChange}
                      className="h-10 sm:h-11 w-full rounded-md border border-[#E5E5E5] bg-white px-3 sm:px-4 text-xs sm:text-[13px] outline-none focus:border-[#DB4444]"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Default */}
                  <div className="flex items-center pb-2 sm:items-end sm:col-span-2">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        name="isDefault"
                        checked={formData.isDefault}
                        onChange={handleChange}
                        className="h-4 w-4 accent-[#DB4444]"
                      />

                      <span className="text-xs text-black sm:text-[13px]">
                        Make this my default address
                      </span>
                    </label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-5 flex flex-col-reverse gap-2.5 border-t border-[#E5E5E5] pt-4 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3 sm:pt-5">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="w-full rounded-md border border-[#E5E5E5] px-5 py-2.5 text-xs text-[#7A7A7A] transition-colors hover:border-black hover:text-black disabled:opacity-50 sm:w-auto sm:text-[13px]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-black disabled:opacity-50 sm:w-auto sm:text-[13px]"
                  >
                    <FiCheck size={16} />

                    {saving
                      ? "Saving..."
                      : editingAddressId
                        ? "Update Address"
                        : "Save Address"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Address List */}
          {loading ? (
            <div className="rounded-lg border border-[#E5E5E5] bg-white p-8 text-center sm:p-10">
              <p className="text-xs text-[#7A7A7A] sm:text-[13px]">
                Loading your addresses...
              </p>
            </div>
          ) : addresses.length === 0 ? (
            <div className="rounded-lg border border-[#E5E5E5] bg-white p-8 text-center sm:p-10">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF5F5] text-[#DB4444] sm:h-14 sm:w-14">
                <FiMapPin size={22} className="sm:hidden" />
                <FiMapPin size={24} className="hidden sm:block" />
              </div>

              <h2 className="text-base font-semibold text-black sm:text-lg">
                No saved addresses
              </h2>

              <p className="mt-1 mb-5 text-xs text-[#7A7A7A] sm:text-[13px]">
                Add an address to make your checkout faster.
              </p>

              {!showForm && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-black px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#DB4444] sm:text-[13px]"
                >
                  <FiPlus size={16} />
                  Add New Address
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
              {addresses.map((address) => (
                <div
                  key={address._id}
                  className="rounded-lg border border-[#E5E5E5] bg-white p-4 sm:p-5"
                >
                  {/* Card Header */}
                  <div className="mb-3 sm:mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF5F5] text-[#DB4444]">
                        <FiMapPin size={16} className="sm:hidden" />
                        <FiMapPin size={17} className="hidden sm:block" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-[13px] sm:text-[14px] font-semibold text-black truncate">
                          {address.addressType}
                        </h3>

                        <p className="text-[10px] sm:text-[11px] text-[#7A7A7A]">
                          Saved address
                        </p>
                      </div>
                    </div>

                    {address.isDefault && (
                      <span className="shrink-0 flex items-center gap-1 rounded-full bg-[#FFF5F5] px-2 py-0.5 text-[10px] font-medium text-[#DB4444] sm:px-2.5 sm:py-1">
                        <FiCheck size={11} />
                        Default
                      </span>
                    )}
                  </div>

                  {/* Address Details */}
                  <div className="space-y-1.5 text-xs text-[#555] sm:text-[13px]">
                    <p className="font-medium text-black wrap-break-words">
                      {address.fullName}
                    </p>

                    <p className="wrap-break-words">{address.phone}</p>
                    <p className="wrap-break-words">{address.addressLine1}</p>

                    {address.addressLine2 && (
                      <p className="wrap-break-words">{address.addressLine2}</p>
                    )}

                    <p className="wrap-break-words">
                      {address.city}, {address.state} - {address.postalCode}
                    </p>

                    <p className="wrap-break-words">{address.country}</p>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-3 sm:gap-4 border-t border-[#E5E5E5] pt-3 sm:pt-4">
                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => openEditForm(address)}
                      disabled={
                        saving ||
                        deletingId === address._id ||
                        defaultLoadingId === address._id
                      }
                      className="flex items-center gap-1.5 text-[11px] sm:text-[12px] text-[#7A7A7A] transition-colors hover:text-[#DB4444] disabled:opacity-50"
                    >
                      <FiEdit3 size={14} />
                      Edit
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(address)}
                      disabled={
                        deletingId || saving || defaultLoadingId === address._id
                      }
                      className="flex items-center gap-1.5 text-[11px] sm:text-[12px] text-[#7A7A7A] transition-colors hover:text-red-600 disabled:opacity-50"
                    >
                      <FiTrash2 size={14} />

                      {deletingId === address._id ? "Deleting..." : "Delete"}
                    </button>

                    {/* Make Default */}
                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(address._id)}
                        disabled={
                          defaultLoadingId ||
                          deletingId === address._id ||
                          saving
                        }
                        className="flex items-center gap-1.5 text-[11px] sm:text-[12px] text-[#7A7A7A] transition-colors hover:text-[#DB4444] disabled:opacity-50"
                      >
                        <FiStar size={14} />

                        {defaultLoadingId === address._id
                          ? "Updating..."
                          : "Make Default"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Addresses;
