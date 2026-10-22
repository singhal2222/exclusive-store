// FILE LOCATION: src/components/admin/Settings.jsx

"use client";

import React, { useEffect, useState } from "react";
import {
  FiSave,
  FiUser,
  FiLock,
  FiBell,
  FiGlobe,
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

// ============================================================
// DEFAULT NOTIFICATIONS
// ============================================================

const DEFAULT_NOTIFICATIONS = {
  newOrder: true,
  newCustomer: true,
  lowStock: true,
  paymentReceived: true,
  orderStatus: true,
  orderCancelled: true,
  contactMessage: true,
};

// ============================================================
// EMPTY SETTINGS
// ============================================================

const EMPTY_SETTINGS = {
  storeName: "",
  storeEmail: "",
  storePhone: "",
  storeAddress: "",
  currency: "INR",
  language: "English",
  notifications: {
    ...DEFAULT_NOTIFICATIONS,
  },
};

// ============================================================
// SETTINGS COMPONENT
// ============================================================

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");

  const [settings, setSettings] = useState({
    ...EMPTY_SETTINGS,
    notifications: {
      ...DEFAULT_NOTIFICATIONS,
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ----------------------------------------------------------
  // PASSWORD VISIBILITY TOGGLES
  // ----------------------------------------------------------

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // NORMALIZE SETTINGS
  // =========================================================

  const normalizeSettings = (serverSettings = {}) => {
    return {
      storeName: serverSettings.storeName || "",
      storeEmail: serverSettings.storeEmail || "",
      storePhone: serverSettings.storePhone || "",
      storeAddress: serverSettings.storeAddress || "",
      currency: serverSettings.currency || "INR",
      language: serverSettings.language || "English",

      notifications: {
        ...DEFAULT_NOTIFICATIONS,
        ...(serverSettings.notifications || {}),
      },
    };
  };

  // =========================================================
  // FETCH SETTINGS
  // =========================================================

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/admin/settings", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load settings.");
      }

      const serverSettings = data?.settings;

      if (!serverSettings) {
        throw new Error("Settings data was not found.");
      }

      setSettings(normalizeSettings(serverSettings));
    } catch (err) {
      console.error("Fetch settings error:", err);

      setError(err?.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // =========================================================
  // CLEAR MESSAGES
  // =========================================================

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  // =========================================================
  // HANDLE STORE SETTINGS CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setSettings((previous) => ({
      ...previous,
      [name]: value,
    }));

    clearMessages();
  };

  // =========================================================
  // HANDLE NOTIFICATION TOGGLE
  // =========================================================

  const handleNotificationChange = (name, checked) => {
    setSettings((previous) => ({
      ...previous,

      notifications: {
        ...previous.notifications,
        [name]: checked,
      },
    }));

    clearMessages();
  };

  // =========================================================
  // HANDLE PASSWORD CHANGE
  // =========================================================

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((previous) => ({
      ...previous,
      [name]: value,
    }));

    clearMessages();
  };

  // =========================================================
  // SAVE STORE SETTINGS
  // =========================================================

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      clearMessages();

      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",

        body: JSON.stringify({
          storeName: settings.storeName,
          storeEmail: settings.storeEmail,
          storePhone: settings.storePhone,
          storeAddress: settings.storeAddress,
          currency: settings.currency,
          language: settings.language,

          // Preserve all notification preferences.
          notifications: {
            ...settings.notifications,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to save settings.");
      }

      if (data?.settings) {
        setSettings(normalizeSettings(data.settings));
      }

      setMessage("Store settings saved successfully.");
    } catch (err) {
      console.error("Save settings error:", err);

      setError(err?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // SAVE NOTIFICATION SETTINGS
  // =========================================================

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      clearMessages();

      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",

        body: JSON.stringify({
          notifications: {
            ...settings.notifications,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to save notification settings.",
        );
      }

      if (data?.settings) {
        setSettings(normalizeSettings(data.settings));
      }

      setMessage("Notification preferences saved successfully.");
    } catch (err) {
      console.error("Save notification settings error:", err);

      setError(err?.message || "Failed to save notification preferences.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  const handleChangePassword = async () => {
    try {
      setSaving(true);
      clearMessages();

      const { currentPassword, newPassword, confirmPassword } = passwordData;

      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error("Please fill in all password fields.");
      }

      if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters long.");
      }

      if (newPassword.length > 100) {
        throw new Error("New password must not exceed 100 characters.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("New password and confirm password do not match.");
      }

      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",

        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to change password.");
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Reset visibility to hidden after a successful change.
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setMessage("Password changed successfully.");
    } catch (err) {
      console.error("Change password error:", err);

      setError(err?.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // TABS
  // =========================================================

  const tabs = [
    {
      id: "general",
      label: "General",
      icon: FiUser,
    },
    {
      id: "security",
      label: "Security",
      icon: FiLock,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: FiBell,
    },
    {
      id: "localization",
      label: "Localization",
      icon: FiGlobe,
    },
  ];

  // =========================================================
  // NOTIFICATION OPTIONS
  // =========================================================

  const notificationOptions = [
    {
      key: "newOrder",
      label: "New Order",
      desc: "Get notified when a new order is placed.",
    },
    {
      key: "newCustomer",
      label: "New Customer",
      desc: "Get notified when a new customer registers.",
    },
    {
      key: "lowStock",
      label: "Low Stock",
      desc: "Get notified when a product reaches low stock.",
    },
    {
      key: "paymentReceived",
      label: "Payment Received",
      desc: "Get notified when an online payment is received.",
    },
    {
      key: "orderStatus",
      label: "Order Status",
      desc: "Get notified when an order status changes.",
    },
    {
      key: "orderCancelled",
      label: "Order Cancelled",
      desc: "Get notified when a customer cancels an order.",
    },
    {
      key: "contactMessage",
      label: "Contact Messages",
      desc: "Get notified when a customer sends a message through the Contact Us form.",
    },
  ];

  // =========================================================
  // TOGGLE COMPONENT
  // =========================================================

  const Toggle = ({ checked, onChange, label }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? "bg-[#DB4444]" : "bg-[#E5E5E5]"
      }`}
      aria-label={`Toggle ${label}`}
      aria-pressed={checked}
    >
      <div
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="font-poppins">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-1.5 text-2xl font-semibold tracking-[2%] text-black sm:mb-2 sm:text-3xl lg:text-[36px]">
            Settings
          </h1>

          <p className="text-xs text-[#7A7A7A] sm:text-sm md:text-[15px] lg:text-[16px]">
            Manage your store preferences and account settings
          </p>
        </div>

        <div className="flex min-h-100 items-center justify-center rounded-xl border border-[#E5E5E5] bg-white">
          <div className="flex items-center gap-2 text-sm text-[#7A7A7A]">
            <FiLoader className="animate-spin" size={20} />
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="font-poppins">
      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="mb-5 sm:mb-8">
        <h1 className="mb-1.5 text-2xl font-semibold tracking-[2%] text-black sm:mb-2 sm:text-3xl lg:text-[36px]">
          Settings
        </h1>

        <p className="text-xs text-[#7A7A7A] sm:text-sm md:text-[15px] lg:text-[16px]">
          Manage your store preferences and account settings
        </p>
      </div>

      {/* ================================================== */}
      {/* SUCCESS MESSAGE */}
      {/* ================================================== */}

      {message && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <FiCheckCircle className="mt-0.5 shrink-0" size={18} />

          <p>{message}</p>
        </div>
      )}

      {/* ================================================== */}
      {/* ERROR MESSAGE */}
      {/* ================================================== */}

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <FiAlertCircle className="mt-0.5 shrink-0" size={18} />

          <p>{error}</p>
        </div>
      )}

      {/* ================================================== */}
      {/* MAIN GRID */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        {/* ================================================= */}
        {/* TABS */}
        {/* ================================================= */}

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-2.5 sm:p-3 lg:sticky lg:top-28">
            <div className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1 lg:space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      clearMessages();
                    }}
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs transition-all sm:gap-3 sm:px-4 sm:py-3 sm:text-[14px] lg:w-full lg:shrink lg:text-[15px] ${
                      activeTab === tab.id
                        ? "bg-[#DB4444] text-white"
                        : "text-[#7A7A7A] hover:bg-[#F5F5F5]"
                    }`}
                  >
                    <Icon size={18} className="shrink-0 sm:hidden" />

                    <Icon size={20} className="hidden shrink-0 sm:block" />

                    <span className="whitespace-nowrap font-medium">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* CONTENT */}
        {/* ================================================= */}

        <div className="lg:col-span-3">
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5 lg:p-6">
            {/* ============================================== */}
            {/* GENERAL */}
            {/* ============================================== */}

            {activeTab === "general" && (
              <div>
                <h2 className="mb-4 text-base font-semibold text-black sm:mb-6 sm:text-lg lg:text-[22px]">
                  General Settings
                </h2>

                <div className="space-y-4 sm:space-y-5">
                  {/* Store Name */}

                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                      Store Name
                    </label>

                    <input
                      type="text"
                      name="storeName"
                      value={settings.storeName}
                      onChange={handleChange}
                      maxLength={100}
                      placeholder="Enter store name"
                      className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2.5 text-xs outline-none transition-all focus:border-[#DB4444] sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px]"
                    />
                  </div>

                  {/* Email + Phone */}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                        Store Email
                      </label>

                      <input
                        type="email"
                        name="storeEmail"
                        value={settings.storeEmail}
                        onChange={handleChange}
                        maxLength={100}
                        placeholder="Enter store email"
                        className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2.5 text-xs outline-none transition-all focus:border-[#DB4444] sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                        Store Phone
                      </label>

                      <input
                        type="text"
                        name="storePhone"
                        value={settings.storePhone}
                        onChange={handleChange}
                        maxLength={20}
                        placeholder="Enter store phone"
                        className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2.5 text-xs outline-none transition-all focus:border-[#DB4444] sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px]"
                      />
                    </div>
                  </div>

                  {/* Address */}

                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                      Store Address
                    </label>

                    <textarea
                      name="storeAddress"
                      value={settings.storeAddress}
                      onChange={handleChange}
                      maxLength={300}
                      rows={3}
                      placeholder="Enter store address"
                      className="w-full resize-none rounded-lg border border-[#E5E5E5] px-3 py-2.5 text-xs outline-none transition-all focus:border-[#DB4444] sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px]"
                    />
                  </div>
                </div>

                {/* Save */}

                <div className="mt-6 flex justify-end border-t border-[#E5E5E5] pt-4 sm:mt-8 sm:pt-6">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white shadow-lg shadow-[#DB4444]/30 transition-colors hover:bg-[#c73d3d] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6 sm:py-3.5 sm:text-[14px] lg:text-[15px]"
                  >
                    {saving ? (
                      <FiLoader size={18} className="animate-spin" />
                    ) : (
                      <FiSave size={18} />
                    )}

                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/* SECURITY */}
            {/* ============================================== */}

            {activeTab === "security" && (
              <div>
                <h2 className="mb-4 text-base font-semibold text-black sm:mb-6 sm:text-lg lg:text-[22px]">
                  Security Settings
                </h2>

                <div className="space-y-4 sm:space-y-5">
                  {/* Current Password */}

                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                      Current Password
                    </label>

                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        autoComplete="current-password"
                        placeholder="Enter current password"
                        className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2.5 pr-10 text-xs outline-none transition-all focus:border-[#DB4444] sm:px-4 sm:py-3 sm:pr-11 sm:text-[14px] lg:text-[15px]"
                      />

                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        tabIndex={-1}
                        aria-label={
                          showCurrentPassword
                            ? "Hide current password"
                            : "Show current password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#7A7A7A] transition-colors hover:text-[#DB4444] focus:outline-none sm:right-3.5"
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
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                      New Password
                    </label>

                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        autoComplete="new-password"
                        placeholder="Enter new password"
                        className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2.5 pr-10 text-xs outline-none transition-all focus:border-[#DB4444] sm:px-4 sm:py-3 sm:pr-11 sm:text-[14px] lg:text-[15px]"
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#7A7A7A] transition-colors hover:text-[#DB4444] focus:outline-none sm:right-3.5"
                      >
                        {showNewPassword ? (
                          <FiEyeOff size={17} />
                        ) : (
                          <FiEye size={17} />
                        )}
                      </button>
                    </div>

                    <p className="mt-1.5 text-[11px] text-[#7A7A7A] sm:text-xs">
                      Password must be between 8 and 100 characters.
                    </p>
                  </div>

                  {/* Confirm Password */}

                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                      Confirm Password
                    </label>

                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        autoComplete="new-password"
                        placeholder="Confirm new password"
                        className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2.5 pr-10 text-xs outline-none transition-all focus:border-[#DB4444] sm:px-4 sm:py-3 sm:pr-11 sm:text-[14px] lg:text-[15px]"
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        tabIndex={-1}
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#7A7A7A] transition-colors hover:text-[#DB4444] focus:outline-none sm:right-3.5"
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

                {/* Change Password */}

                <div className="mt-6 flex justify-end border-t border-[#E5E5E5] pt-4 sm:mt-8 sm:pt-6">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white shadow-lg shadow-[#DB4444]/30 transition-colors hover:bg-[#c73d3d] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6 sm:py-3.5 sm:text-[14px] lg:text-[15px]"
                  >
                    {saving ? (
                      <FiLoader size={18} className="animate-spin" />
                    ) : (
                      <FiLock size={18} />
                    )}

                    {saving ? "Changing Password..." : "Change Password"}
                  </button>
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/* NOTIFICATIONS */}
            {/* ============================================== */}

            {activeTab === "notifications" && (
              <div>
                <h2 className="mb-4 text-base font-semibold text-black sm:mb-6 sm:text-lg lg:text-[22px]">
                  Notification Preferences
                </h2>

                <p className="mb-5 text-xs leading-5 text-[#7A7A7A] sm:text-[14px]">
                  Choose which store events should appear in your admin
                  notification system.
                </p>

                <div className="space-y-3 sm:space-y-4">
                  {notificationOptions.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-3 rounded-lg bg-[#F5F5F5] p-3.5 sm:p-4"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                          {item.label}
                        </p>

                        <p className="mt-0.5 text-[10px] text-[#7A7A7A] sm:text-[12px] lg:text-[13px]">
                          {item.desc}
                        </p>
                      </div>

                      <Toggle
                        checked={settings.notifications?.[item.key] ?? true}
                        onChange={(checked) =>
                          handleNotificationChange(item.key, checked)
                        }
                        label={item.label}
                      />
                    </div>
                  ))}
                </div>

                {/* Save */}

                <div className="mt-6 flex justify-end border-t border-[#E5E5E5] pt-4 sm:mt-8 sm:pt-6">
                  <button
                    type="button"
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white shadow-lg shadow-[#DB4444]/30 transition-colors hover:bg-[#c73d3d] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6 sm:py-3.5 sm:text-[14px] lg:text-[15px]"
                  >
                    {saving ? (
                      <FiLoader size={18} className="animate-spin" />
                    ) : (
                      <FiSave size={18} />
                    )}

                    {saving ? "Saving..." : "Save Notifications"}
                  </button>
                </div>
              </div>
            )}

            {/* ============================================== */}
            {/* LOCALIZATION */}
            {/* ============================================== */}

            {activeTab === "localization" && (
              <div>
                <h2 className="mb-4 text-base font-semibold text-black sm:mb-6 sm:text-lg lg:text-[22px]">
                  Localization
                </h2>

                <div className="space-y-4 sm:space-y-5">
                  {/* Currency */}

                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                      Currency
                    </label>

                    <select
                      name="currency"
                      value={settings.currency}
                      onChange={handleChange}
                      className="w-full cursor-pointer rounded-lg border border-[#E5E5E5] px-3 py-2.5 text-xs outline-none transition-all focus:border-[#DB4444] sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px]"
                    >
                      <option value="INR">INR - Indian Rupee</option>

                      <option value="USD">USD - US Dollar</option>

                      <option value="EUR">EUR - Euro</option>

                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>

                  {/* Language */}

                  <div>
                    <label className="mb-2 block text-xs font-medium text-black sm:text-[14px] lg:text-[15px]">
                      Language
                    </label>

                    <select
                      name="language"
                      value={settings.language}
                      onChange={handleChange}
                      className="w-full cursor-pointer rounded-lg border border-[#E5E5E5] px-3 py-2.5 text-xs outline-none transition-all focus:border-[#DB4444] sm:px-4 sm:py-3 sm:text-[14px] lg:text-[15px]"
                    >
                      <option value="English">English</option>
                    </select>

                    <p className="mt-1.5 text-[11px] text-[#7A7A7A] sm:text-xs">
                      More languages can be added when multilingual support is
                      implemented.
                    </p>
                  </div>
                </div>

                {/* Save */}

                <div className="mt-6 flex justify-end border-t border-[#E5E5E5] pt-4 sm:mt-8 sm:pt-6">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#DB4444] px-5 py-2.5 text-xs font-medium text-white shadow-lg shadow-[#DB4444]/30 transition-colors hover:bg-[#c73d3d] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6 sm:py-3.5 sm:text-[14px] lg:text-[15px]"
                  >
                    {saving ? (
                      <FiLoader size={18} className="animate-spin" />
                    ) : (
                      <FiSave size={18} />
                    )}

                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
