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
  FiX,
} from "react-icons/fi";

const Dashboard = ({ user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const pathname = usePathname();

  const userName = user?.name || "User";
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

    setLogoutLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Logout request failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      window.location.href = "/auth/login";
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

          {/* Mobile Close Button */}
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
        <nav className="flex-1 py-4 sm:py-5 overflow-y-auto">
          <ul className="space-y-1 sm:space-y-1.5 px-2.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center gap-3 px-3.5 py-2.5 sm:py-3 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? "bg-[#DB4444] text-white shadow-md shadow-[#DB4444]/20"
                        : "text-[#7A7A7A] hover:bg-[#FFF5F5] hover:text-[#DB4444]"
                    }`}
                  >
                    <Icon size={20} className="shrink-0" />

                    {expanded && (
                      <span className="font-medium text-[13px] sm:text-[14px]">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-2.5 border-t border-[#E5E5E5] shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutLoading}
            className="flex items-center gap-3 px-3.5 py-2.5 sm:py-3 rounded-lg w-full text-[#7A7A7A] hover:bg-red-50 hover:text-red-500 transition-all duration-200 disabled:opacity-50"
          >
            <FiLogOut size={20} className="shrink-0" />

            {expanded && (
              <span className="font-medium text-[13px] sm:text-[14px]">
                {logoutLoading ? "Logging out..." : "Logout"}
              </span>
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
      {/* MAIN CONTENT */}
      {/* ============================================================ */}

      <main className="flex-1 min-w-0 w-full">
        {/* Top Bar */}
        <header className="h-16 sm:h-17 bg-white border-b border-[#E5E5E5] flex items-center justify-between px-4 sm:px-5 lg:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Hamburger - opens mobile drawer on small, toggles desktop sidebar on md+ */}
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

            <div className="min-w-0">
              <h1 className="text-sm sm:text-[16px] font-semibold text-black truncate">
                My Account
              </h1>

              <p className="text-[10px] sm:text-[11px] text-[#7A7A7A] truncate">
                Manage your account
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#DB4444] text-white flex items-center justify-center font-semibold text-[13px] sm:text-[15px]">
              {userInitial}
            </div>

            <div className="hidden sm:block">
              <p className="text-[12px] sm:text-[13px] font-semibold text-black leading-tight">
                {userName}
              </p>

              <p className="text-[10px] sm:text-[11px] text-[#7A7A7A] leading-tight">
                {user?.role === "user" ? "Customer" : user?.role}
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="mb-5 sm:mb-6">
            <p className="text-xs sm:text-[13px] text-[#7A7A7A] mb-1">
              My Account
            </p>

            <h1 className="text-xl sm:text-2xl font-semibold text-black">
              Dashboard
            </h1>

            <p className="mt-1.5 text-xs sm:text-[13px] text-[#7A7A7A]">
              Manage your orders, profile, wishlist and account settings.
            </p>
          </div>

          {/* Welcome Card */}
          <section className="mb-5 sm:mb-6 bg-white border border-[#E5E5E5] rounded-lg p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-5">
              <div className="min-w-0">
                <p className="text-xs sm:text-[13px] text-[#7A7A7A] mb-1.5 sm:mb-2">
                  Welcome back
                </p>

                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-black wrap-break-words">
                  Welcome back, {userName}
                  <span className="text-[#DB4444]">.</span>
                </h2>

                <p className="mt-1.5 sm:mt-2 text-xs sm:text-[13px] leading-5 sm:leading-6 text-[#7A7A7A] max-w-xl">
                  Manage your account, orders, wishlist and shopping activity
                  from one place.
                </p>
              </div>

              <div className="hidden sm:flex w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FFF5F5] items-center justify-center shrink-0">
                <FiUser size={22} className="text-[#DB4444] sm:hidden" />
                <FiUser size={25} className="text-[#DB4444] hidden sm:block" />
              </div>
            </div>
          </section>

          {/* Account Overview */}
          <section className="mb-6 sm:mb-7">
            <div className="mb-3 sm:mb-4">
              <h2 className="text-base sm:text-[18px] font-semibold text-black">
                Account Overview
              </h2>

              <p className="mt-1 text-[11px] sm:text-[12px] text-[#7A7A7A]">
                Quick access to your account information.
              </p>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {/* Orders */}
              <Link
                href="/account/orders"
                className="group bg-white border border-[#E5E5E5] rounded-lg p-4 sm:p-5 transition-all duration-200 hover:border-[#DB4444] hover:shadow-md"
              >
                <div className="mb-3 sm:mb-4 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#FFF5F5] flex items-center justify-center">
                  <FiShoppingBag
                    size={18}
                    className="text-[#DB4444] sm:hidden"
                  />
                  <FiShoppingBag
                    size={20}
                    className="text-[#DB4444] hidden sm:block"
                  />
                </div>

                <h3 className="text-sm sm:text-[15px] font-semibold text-black">
                  My Orders
                </h3>

                <p className="mt-1.5 text-[11px] sm:text-[12px] leading-5 text-[#7A7A7A]">
                  View and track your recent orders.
                </p>

                <span className="mt-3 sm:mt-4 inline-block text-[11px] sm:text-[12px] font-medium text-[#DB4444] group-hover:underline">
                  View Orders →
                </span>
              </Link>

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                className="group bg-white border border-[#E5E5E5] rounded-lg p-4 sm:p-5 transition-all duration-200 hover:border-[#DB4444] hover:shadow-md"
              >
                <div className="mb-3 sm:mb-4 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#FFF5F5] flex items-center justify-center">
                  <FiHeart size={18} className="text-[#DB4444] sm:hidden" />
                  <FiHeart
                    size={20}
                    className="text-[#DB4444] hidden sm:block"
                  />
                </div>

                <h3 className="text-sm sm:text-[15px] font-semibold text-black">
                  Wishlist
                </h3>

                <p className="mt-1.5 text-[11px] sm:text-[12px] leading-5 text-[#7A7A7A]">
                  View products you have saved for later.
                </p>

                <span className="mt-3 sm:mt-4 inline-block text-[11px] sm:text-[12px] font-medium text-[#DB4444] group-hover:underline">
                  View Wishlist →
                </span>
              </Link>

              {/* Profile */}
              <Link
                href="/account/profile"
                className="group bg-white border border-[#E5E5E5] rounded-lg p-4 sm:p-5 transition-all duration-200 hover:border-[#DB4444] hover:shadow-md"
              >
                <div className="mb-3 sm:mb-4 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#FFF5F5] flex items-center justify-center">
                  <FiUser size={18} className="text-[#DB4444] sm:hidden" />
                  <FiUser
                    size={20}
                    className="text-[#DB4444] hidden sm:block"
                  />
                </div>

                <h3 className="text-sm sm:text-[15px] font-semibold text-black">
                  My Profile
                </h3>

                <p className="mt-1.5 text-[11px] sm:text-[12px] leading-5 text-[#7A7A7A]">
                  View and update your personal information.
                </p>

                <span className="mt-3 sm:mt-4 inline-block text-[11px] sm:text-[12px] font-medium text-[#DB4444] group-hover:underline">
                  View Profile →
                </span>
              </Link>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <div className="mb-3 sm:mb-4">
              <h2 className="text-base sm:text-[18px] font-semibold text-black">
                Quick Actions
              </h2>

              <p className="mt-1 text-[11px] sm:text-[12px] text-[#7A7A7A]">
                Quickly access important account sections.
              </p>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {/* Cart */}
              <Link
                href="/cart"
                className="group flex items-center gap-3 sm:gap-4 bg-white border border-[#E5E5E5] rounded-lg p-4 sm:p-5 transition-all duration-200 hover:border-[#DB4444] hover:shadow-md"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full bg-[#FFF5F5] flex items-center justify-center">
                  <FiShoppingCart
                    size={18}
                    className="text-[#DB4444] sm:hidden"
                  />
                  <FiShoppingCart
                    size={20}
                    className="text-[#DB4444] hidden sm:block"
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="text-xs sm:text-[13px] font-semibold text-black">
                    Shopping Cart
                  </h3>

                  <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-[#7A7A7A]">
                    View your cart
                  </p>
                </div>
              </Link>

              {/* Addresses */}
              <Link
                href="/account/addresses"
                className="group flex items-center gap-3 sm:gap-4 bg-white border border-[#E5E5E5] rounded-lg p-4 sm:p-5 transition-all duration-200 hover:border-[#DB4444] hover:shadow-md"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full bg-[#FFF5F5] flex items-center justify-center">
                  <FiMapPin size={18} className="text-[#DB4444] sm:hidden" />
                  <FiMapPin
                    size={20}
                    className="text-[#DB4444] hidden sm:block"
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="text-xs sm:text-[13px] font-semibold text-black">
                    Addresses
                  </h3>

                  <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-[#7A7A7A]">
                    Manage your addresses
                  </p>
                </div>
              </Link>

              {/* Settings */}
              <Link
                href="/account/settings"
                className="group flex items-center gap-3 sm:gap-4 bg-white border border-[#E5E5E5] rounded-lg p-4 sm:p-5 transition-all duration-200 hover:border-[#DB4444] hover:shadow-md"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full bg-[#FFF5F5] flex items-center justify-center">
                  <FiSettings size={18} className="text-[#DB4444] sm:hidden" />
                  <FiSettings
                    size={20}
                    className="text-[#DB4444] hidden sm:block"
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="text-xs sm:text-[13px] font-semibold text-black">
                    Account Settings
                  </h3>

                  <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-[#7A7A7A]">
                    Manage account settings
                  </p>
                </div>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
