"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiHome,
  FiPackage,
  FiShoppingCart,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiBell,
  FiSearch,
  FiChevronDown,
  FiCheck,
  FiMessageSquare,
  FiTag,
  FiStar,
  FiMonitor,
} from "react-icons/fi";

const AdminDashboard = ({ children, admin }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // ============================================================
  // ADMIN SEARCH STATES
  // ============================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [searchProducts, setSearchProducts] = useState([]);
  const [searchOrders, setSearchOrders] = useState([]);
  const [searchCustomers, setSearchCustomers] = useState([]);

  const [searchError, setSearchError] = useState("");

  // ============================================================
  // NOTIFICATION STATES
  // ============================================================

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [markingNotificationId, setMarkingNotificationId] = useState(null);

  // ============================================================
  // REFS
  // ============================================================

  const searchRef = useRef(null);
  const notificationFetchingRef = useRef(false);

  // ============================================================
  // ROUTER
  // ============================================================

  const pathname = usePathname();
  const router = useRouter();

  // ============================================================
  // SIDEBAR MENU
  // ============================================================

  const menuItems = [
    {
      path: "/admin",
      icon: FiHome,
      label: "Dashboard",
    },
    {
      path: "/admin/pos",
      icon: FiMonitor,
      label: "POS",
    },
    {
      path: "/admin/products",
      icon: FiPackage,
      label: "Products",
    },
    {
      path: "/admin/categories",
      icon: FiBarChart2,
      label: "Categories",
    },
    {
      path: "/admin/orders",
      icon: FiShoppingCart,
      label: "Orders",
    },
    {
      path: "/admin/customers",
      icon: FiUsers,
      label: "Customers",
    },
    {
      path: "/admin/coupons",
      icon: FiTag,
      label: "Coupons",
    },
    {
      path: "/admin/reviews",
      icon: FiStar,
      label: "Reviews",
    },
    {
      path: "/admin/contact-messages",
      icon: FiMessageSquare,
      label: "Contact Messages",
    },
    {
      path: "/admin/settings",
      icon: FiSettings,
      label: "Settings",
    },
  ];

  // ============================================================
  // FETCH NOTIFICATIONS
  // ============================================================

  const fetchNotifications = async ({ showLoading = true } = {}) => {
    if (notificationFetchingRef.current) {
      return;
    }

    try {
      notificationFetchingRef.current = true;

      if (showLoading) {
        setNotificationLoading(true);
      }

      setNotificationError("");

      const response = await fetch("/api/admin/notifications", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load notifications.");
      }

      const notificationList = Array.isArray(data?.data?.notifications)
        ? data.data.notifications
        : [];

      const count = Number(data?.data?.unreadCount || 0);

      setNotifications(notificationList);
      setUnreadCount(count);
    } catch (error) {
      console.error("Fetch notifications error:", error);

      /*
       * Do not clear existing notifications during a silent
       * background refresh failure.
       *
       * This prevents the notification UI from suddenly becoming
       * empty if the server is temporarily unavailable.
       */
      if (showLoading) {
        setNotifications([]);
        setUnreadCount(0);
      }

      setNotificationError(error?.message || "Failed to load notifications.");
    } finally {
      notificationFetchingRef.current = false;

      if (showLoading) {
        setNotificationLoading(false);
      }
    }
  };

  // ============================================================
  // INITIAL NOTIFICATION FETCH
  // ============================================================

  useEffect(() => {
    fetchNotifications({ showLoading: true });
  }, []);

  // ============================================================
  // AUTOMATIC NOTIFICATION REFRESH
  // ============================================================

  useEffect(() => {
    const refreshNotifications = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      fetchNotifications({ showLoading: false });
    };

    /*
     * Refresh notifications every 10 seconds while the admin
     * dashboard is open.
     */
    const interval = setInterval(refreshNotifications, 10000);

    /*
     * Refresh immediately when the admin returns to the tab.
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications({ showLoading: false });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // ============================================================
  // FORMAT NOTIFICATION TIME
  // ============================================================

  const formatNotificationTime = (date) => {
    if (!date) {
      return "";
    }

    const notificationDate = new Date(date);

    if (Number.isNaN(notificationDate.getTime())) {
      return "";
    }

    const now = new Date();

    const differenceInSeconds = Math.floor(
      (now.getTime() - notificationDate.getTime()) / 1000,
    );

    if (differenceInSeconds < 60) {
      return "Just now";
    }

    const differenceInMinutes = Math.floor(differenceInSeconds / 60);

    if (differenceInMinutes < 60) {
      return `${differenceInMinutes} ${
        differenceInMinutes === 1 ? "minute" : "minutes"
      } ago`;
    }

    const differenceInHours = Math.floor(differenceInMinutes / 60);

    if (differenceInHours < 24) {
      return `${differenceInHours} ${
        differenceInHours === 1 ? "hour" : "hours"
      } ago`;
    }

    const differenceInDays = Math.floor(differenceInHours / 24);

    if (differenceInDays < 7) {
      return `${differenceInDays} ${
        differenceInDays === 1 ? "day" : "days"
      } ago`;
    }

    return notificationDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // MARK ONE NOTIFICATION AS READ
  // ============================================================

  const handleNotificationClick = async (notification) => {
    if (!notification?.id || markingNotificationId) {
      return;
    }

    const notificationId = notification.id;

    try {
      setMarkingNotificationId(notificationId);

      // --------------------------------------------------------
      // Mark as read only if currently unread
      // --------------------------------------------------------

      if (!notification.isRead) {
        const response = await fetch(
          `/api/admin/notifications/${notificationId}/read`,
          {
            method: "PATCH",
            credentials: "include",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to mark notification as read.",
          );
        }

        // ------------------------------------------------------
        // Update notification locally
        // ------------------------------------------------------

        setNotifications((currentNotifications) =>
          currentNotifications.map((item) =>
            item.id === notificationId
              ? {
                  ...item,
                  isRead: true,
                  readAt: data?.data?.readAt || new Date().toISOString(),
                }
              : item,
          ),
        );

        // ------------------------------------------------------
        // Decrease unread count
        // ------------------------------------------------------

        setUnreadCount((currentCount) => Math.max(0, currentCount - 1));
      }

      // --------------------------------------------------------
      // Close notification dropdown
      // --------------------------------------------------------

      setNotifOpen(false);

      // --------------------------------------------------------
      // Navigate to related page
      // --------------------------------------------------------

      if (notification.link) {
        router.push(notification.link);
      }
    } catch (error) {
      console.error("Mark notification as read error:", error);

      setNotificationError(error?.message || "Failed to open notification.");
    } finally {
      setMarkingNotificationId(null);
    }
  };

  // ============================================================
  // MARK ALL NOTIFICATIONS AS READ
  // ============================================================

  const handleMarkAllAsRead = async () => {
    if (markAllLoading || unreadCount === 0) {
      return;
    }

    try {
      setMarkAllLoading(true);
      setNotificationError("");

      const response = await fetch("/api/admin/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to mark all notifications as read.",
        );
      }

      // --------------------------------------------------------
      // Update all notifications locally
      // --------------------------------------------------------

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        })),
      );

      // --------------------------------------------------------
      // Reset unread count
      // --------------------------------------------------------

      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all notifications as read error:", error);

      setNotificationError(
        error?.message || "Failed to mark all notifications as read.",
      );
    } finally {
      setMarkAllLoading(false);
    }
  };

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
  // CLOSE DROPDOWNS ON OUTSIDE CLICK
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifOpen && !event.target.closest("[data-notif-dropdown]")) {
        setNotifOpen(false);
      }

      if (profileOpen && !event.target.closest("[data-profile-dropdown]")) {
        setProfileOpen(false);
      }

      if (searchOpen && !event.target.closest("[data-admin-search]")) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifOpen, profileOpen, searchOpen]);

  // ============================================================
  // ADMIN SEARCH
  // ============================================================

  useEffect(() => {
    const query = searchTerm.trim();

    // ----------------------------------------------------------
    // CLEAR SEARCH
    // ----------------------------------------------------------

    if (!query) {
      setSearchProducts([]);
      setSearchOrders([]);
      setSearchCustomers([]);
      setSearchLoading(false);
      setSearchError("");

      return;
    }

    const controller = new AbortController();

    // ----------------------------------------------------------
    // DEBOUNCE SEARCH
    // ----------------------------------------------------------

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError("");

        const params = new URLSearchParams();

        params.set("q", query);

        const response = await fetch(`/api/admin/search?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to search admin data.");
        }

        const products = Array.isArray(data?.data?.products)
          ? data.data.products
          : [];

        const orders = Array.isArray(data?.data?.orders)
          ? data.data.orders
          : [];

        const customers = Array.isArray(data?.data?.customers)
          ? data.data.customers
          : [];

        setSearchProducts(products);
        setSearchOrders(orders);
        setSearchCustomers(customers);
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("Admin search error:", error);

        setSearchProducts([]);
        setSearchOrders([]);
        setSearchCustomers([]);

        setSearchError(
          error?.message || "Something went wrong while searching.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm]);

  // ============================================================
  // SEARCH INPUT CHANGE
  // ============================================================

  const handleSearchChange = (event) => {
    const value = event.target.value;

    setSearchTerm(value);

    if (value.trim().length > 0) {
      setSearchOpen(true);
    } else {
      setSearchOpen(false);
    }
  };

  // ============================================================
  // SEARCH KEYBOARD
  // ============================================================

  const handleSearchKeyDown = (event) => {
    // ----------------------------------------------------------
    // ESCAPE
    // ----------------------------------------------------------

    if (event.key === "Escape") {
      setSearchOpen(false);
      return;
    }

    // ----------------------------------------------------------
    // ENTER
    // ----------------------------------------------------------

    if (event.key === "Enter") {
      event.preventDefault();

      const query = searchTerm.trim();

      if (!query) {
        return;
      }

      // --------------------------------------------------------
      // FIRST PRODUCT
      // --------------------------------------------------------

      if (searchProducts.length > 0) {
        handleProductClick(searchProducts[0]);
        return;
      }

      // --------------------------------------------------------
      // FIRST ORDER
      // --------------------------------------------------------

      if (searchOrders.length > 0) {
        handleOrderClick(searchOrders[0]);
        return;
      }

      // --------------------------------------------------------
      // FIRST CUSTOMER
      // --------------------------------------------------------

      if (searchCustomers.length > 0) {
        handleCustomerClick(searchCustomers[0]);
      }
    }
  };

  // ============================================================
  // PRODUCT CLICK
  // ============================================================

  const handleProductClick = (product) => {
    const productName = product?.name;

    if (!productName) {
      return;
    }

    setSearchOpen(false);
    setSearchTerm("");

    router.push(`/admin/products?search=${encodeURIComponent(productName)}`);
  };

  // ============================================================
  // ORDER CLICK
  // ============================================================

  const handleOrderClick = (order) => {
    const orderNumber = order?.orderNumber;

    if (!orderNumber) {
      return;
    }

    setSearchOpen(false);
    setSearchTerm("");

    router.push(`/admin/orders?search=${encodeURIComponent(orderNumber)}`);
  };

  // ============================================================
  // CUSTOMER CLICK
  // ============================================================

  const handleCustomerClick = (customer) => {
    const customerName = customer?.name;

    if (!customerName) {
      return;
    }

    setSearchOpen(false);
    setSearchTerm("");

    router.push(`/admin/customers?search=${encodeURIComponent(customerName)}`);
  };

  // ============================================================
  // SEARCH RESULT COUNT
  // ============================================================

  const hasSearchResults =
    searchProducts.length > 0 ||
    searchOrders.length > 0 ||
    searchCustomers.length > 0;

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
  // GET ADMIN INITIAL
  // ============================================================

  const getInitial = () => {
    if (!admin?.name) {
      return "A";
    }

    return admin.name.trim().charAt(0).toUpperCase();
  };

  // ============================================================
  // ACTIVE SIDEBAR PATH
  // ============================================================

  const isActivePath = (path) => {
    if (path === "/admin") {
      return pathname === "/admin";
    }

    return pathname.startsWith(path);
  };

  // ============================================================
  // FORMAT ORDER STATUS
  // ============================================================

  const formatStatus = (status) => {
    if (!status) {
      return "Unknown";
    }

    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // ============================================================
  // SIDEBAR CONTENT
  // ============================================================

  const SidebarContent = ({ isMobile = false }) => {
    const expanded = isMobile ? true : sidebarOpen;

    return (
      <>
        {/* ======================================================
            LOGO
        ====================================================== */}

        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#E5E5E5] px-4 sm:h-17">
          {expanded ? (
            <Link
              href="/admin"
              className="text-lg font-bold tracking-[0.04em] text-black sm:text-xl md:text-[22px]"
            >
              Exclusive
              <span className="text-[#DB4444]">.</span>
            </Link>
          ) : (
            <Link
              href="/admin"
              className="mx-auto text-lg font-bold text-[#DB4444] sm:text-xl md:text-[22px]"
            >
              E.
            </Link>
          )}

          {/* ====================================================
              MOBILE CLOSE BUTTON
          ==================================================== */}

          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="text-[#7A7A7A] transition-colors hover:text-[#DB4444]"
              aria-label="Close sidebar"
            >
              <FiX size={22} />
            </button>
          )}
        </div>

        {/* ======================================================
            MENU
        ====================================================== */}

        <nav className="flex-1 overflow-y-auto py-4 sm:py-5">
          <ul className="space-y-1 px-2.5 sm:space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs transition-all duration-200 sm:py-3 sm:text-[13px] md:text-[14px] ${
                      isActive
                        ? "bg-[#DB4444] text-white shadow-md shadow-[#DB4444]/20"
                        : "text-[#7A7A7A] hover:bg-[#FFF5F5] hover:text-[#DB4444]"
                    }`}
                  >
                    <Icon size={20} className="shrink-0" />

                    {expanded && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ======================================================
            LOGOUT
        ====================================================== */}

        <div className="border-t border-[#E5E5E5] p-2.5">
          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutLoading}
            className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs text-[#7A7A7A] transition-all duration-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 sm:py-3 sm:text-[13px] md:text-[14px]"
          >
            <FiLogOut size={20} className="shrink-0" />

            {expanded && (
              <span className="font-medium">
                {logoutLoading ? "Logging out..." : "Logout"}
              </span>
            )}
          </button>
        </div>
      </>
    );
  };

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <div className="flex min-h-screen bg-[#F5F5F5] font-poppins">
      {/* ========================================================
          DESKTOP SIDEBAR
      ======================================================== */}

      <aside
        className={`hidden lg:flex ${
          sidebarOpen ? "lg:w-57.5" : "lg:w-18"
        } fixed z-30 h-full flex-col border-r border-[#E5E5E5] bg-white transition-all duration-300`}
      >
        <SidebarContent />
      </aside>

      {/* ========================================================
          TABLET / MOBILE SIDEBAR
      ======================================================== */}

      {/* Overlay */}

      <div
        onClick={() => setMobileSidebarOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${
          mobileSidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Drawer */}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col overflow-y-auto border-r border-[#E5E5E5] bg-white transition-transform duration-300 sm:w-72 lg:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent isMobile={true} />
      </aside>

      {/* ========================================================
          MAIN CONTENT
      ======================================================== */}

      <main
        className={`min-w-0 flex-1 transition-all duration-300 ${
          sidebarOpen ? "lg:ml-57.5" : "lg:ml-18"
        }`}
      >
        {/* ======================================================
            TOP BAR
        ====================================================== */}

        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E5E5E5] bg-white px-4 sm:h-17 sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {/* ==================================================
                SINGLE SIDEBAR TOGGLE BUTTON
            ================================================== */}

            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileSidebarOpen(true);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
              className="shrink-0 text-[#7A7A7A] transition-colors hover:text-[#DB4444]"
              aria-label="Toggle sidebar"
            >
              <FiMenu size={22} />
            </button>

            {/* ==================================================
                ADMIN SEARCH
            ================================================== */}

            <div
              ref={searchRef}
              data-admin-search
              className="relative hidden md:block"
            >
              <FiSearch
                size={18}
                className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[#7A7A7A]"
              />

              <input
                type="text"
                placeholder="Search products, orders..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (searchTerm.trim()) {
                    setSearchOpen(true);
                  }
                }}
                onKeyDown={handleSearchKeyDown}
                className="w-60 rounded-lg bg-[#F5F5F5] py-2.5 pl-10 pr-4 text-[13px] outline-none transition-all placeholder:text-[#7A7A7A] focus:ring-2 focus:ring-[#DB4444]/20 lg:w-70 xl:w-[320px] xl:text-[14px]"
              />

              {/* ==================================================
                  SEARCH RESULTS
              ================================================== */}

              {searchOpen && searchTerm.trim() && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border border-[#E5E5E5] bg-white shadow-xl">
                  {/* SEARCH LOADING */}

                  {searchLoading && (
                    <div className="px-4 py-5 text-center text-xs text-[#7A7A7A]">
                      Searching...
                    </div>
                  )}

                  {/* SEARCH ERROR */}

                  {!searchLoading && searchError && (
                    <div className="px-4 py-4 text-xs text-red-500">
                      {searchError}
                    </div>
                  )}

                  {/* NO RESULTS */}

                  {!searchLoading && !searchError && !hasSearchResults && (
                    <div className="px-4 py-5 text-center text-xs text-[#7A7A7A]">
                      No products, orders or customers found.
                    </div>
                  )}

                  {/* ==================================================
                      PRODUCTS
                  ================================================== */}

                  {!searchLoading &&
                    !searchError &&
                    searchProducts.length > 0 && (
                      <div className="border-b border-[#E5E5E5] px-3 py-3">
                        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-[#7A7A7A]">
                          Products
                        </p>

                        <div className="space-y-1">
                          {searchProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleProductClick(product)}
                              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-[#FFF5F5]"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F5F5F5]">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name || "Product"}
                                    className="max-h-full max-w-full object-contain p-1"
                                  />
                                ) : (
                                  <FiPackage
                                    size={17}
                                    className="text-[#999999]"
                                  />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-black sm:text-[13px]">
                                  {product.name}
                                </p>

                                <p className="mt-0.5 truncate text-[10px] text-[#7A7A7A] sm:text-[11px]">
                                  {product.category?.name || "No Category"}
                                </p>
                              </div>

                              <span className="shrink-0 text-[11px] font-semibold text-[#DB4444] sm:text-xs">
                                ₹
                                {Number(product.price || 0).toLocaleString(
                                  "en-IN",
                                )}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* ==================================================
                      ORDERS
                  ================================================== */}

                  {!searchLoading &&
                    !searchError &&
                    searchOrders.length > 0 && (
                      <div className="border-b border-[#E5E5E5] px-3 py-3">
                        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-[#7A7A7A]">
                          Orders
                        </p>

                        <div className="space-y-1">
                          {searchOrders.map((order) => (
                            <button
                              key={order.id}
                              type="button"
                              onClick={() => handleOrderClick(order)}
                              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-[#FFF5F5]"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F5F5F5]">
                                <FiShoppingCart
                                  size={17}
                                  className="text-[#7A7A7A]"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-black sm:text-[13px]">
                                  {order.orderNumber}
                                </p>

                                <p className="mt-0.5 truncate text-[10px] text-[#7A7A7A] sm:text-[11px]">
                                  {order.customer?.name || "Unknown Customer"}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium ${
                                  order.orderStatus === "delivered"
                                    ? "bg-green-100 text-green-700"
                                    : order.orderStatus === "cancelled"
                                      ? "bg-red-100 text-red-700"
                                      : order.orderStatus === "shipped"
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {formatStatus(order.orderStatus)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* ==================================================
                      CUSTOMERS
                  ================================================== */}

                  {!searchLoading &&
                    !searchError &&
                    searchCustomers.length > 0 && (
                      <div className="px-3 py-3">
                        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-[#7A7A7A]">
                          Customers
                        </p>

                        <div className="space-y-1">
                          {searchCustomers.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => handleCustomerClick(customer)}
                              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-[#FFF5F5]"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DB4444] text-xs font-semibold text-white">
                                {customer?.name
                                  ?.trim()
                                  ?.charAt(0)
                                  ?.toUpperCase() || "C"}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-black sm:text-[13px]">
                                  {customer.name}
                                </p>

                                <p className="mt-0.5 truncate text-[10px] text-[#7A7A7A] sm:text-[11px]">
                                  {customer.email ||
                                    customer.phone ||
                                    "No contact"}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* ======================================================
              RIGHT SIDE
          ====================================================== */}

          <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
            {/* ==================================================
                NOTIFICATIONS
            ================================================== */}

            <div className="relative" data-notif-dropdown>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setProfileOpen(false);
                }}
                className="relative text-[#7A7A7A] transition-colors hover:text-[#DB4444]"
                aria-label="Notifications"
              >
                <FiBell size={21} />

                {/* ==================================================
                    UNREAD BADGE
                ================================================== */}

                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DB4444] px-1 text-[10px] font-semibold text-white sm:h-4.5 sm:min-w-4.5">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-11 w-[calc(100vw-2rem)] max-w-80 overflow-hidden rounded-lg border border-[#E5E5E5] bg-white shadow-xl sm:w-90">
                  {/* ==================================================
                      NOTIFICATION HEADER
                  ================================================== */}

                  <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-3.5">
                    <div>
                      <h3 className="text-sm font-semibold text-black sm:text-[15px]">
                        Notifications
                      </h3>

                      {unreadCount > 0 && (
                        <p className="mt-0.5 text-[10px] text-[#7A7A7A] sm:text-[11px]">
                          {unreadCount} unread
                        </p>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        disabled={markAllLoading}
                        className="flex items-center gap-1 text-[10px] font-medium text-[#DB4444] hover:underline disabled:cursor-not-allowed disabled:opacity-50 sm:text-[11px]"
                      >
                        <FiCheck size={13} />

                        {markAllLoading ? "Marking..." : "Mark all as read"}
                      </button>
                    )}
                  </div>

                  {/* ==================================================
                      NOTIFICATION ERROR
                  ================================================== */}

                  {notificationError && (
                    <div className="border-b border-red-100 bg-red-50 px-4 py-2.5 text-[10px] text-red-500 sm:text-[11px]">
                      {notificationError}
                    </div>
                  )}

                  {/* ==================================================
                      NOTIFICATION LIST
                  ================================================== */}

                  <div className="max-h-80 overflow-y-auto">
                    {/* LOADING */}

                    {notificationLoading && (
                      <div className="px-4 py-8 text-center text-xs text-[#7A7A7A]">
                        Loading notifications...
                      </div>
                    )}

                    {/* EMPTY */}

                    {!notificationLoading && notifications.length === 0 && (
                      <div className="px-4 py-8 text-center">
                        <FiBell
                          size={24}
                          className="mx-auto mb-2 text-[#B5B5B5]"
                        />

                        <p className="text-xs font-medium text-black sm:text-[13px]">
                          No notifications
                        </p>

                        <p className="mt-1 text-[10px] text-[#7A7A7A] sm:text-[11px]">
                          You&apos;re all caught up.
                        </p>
                      </div>
                    )}

                    {/* NOTIFICATIONS */}

                    {!notificationLoading &&
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          disabled={markingNotificationId === notification.id}
                          className={`flex w-full items-start gap-3 border-b border-[#F5F5F5] px-4 py-3 text-left transition-colors hover:bg-[#F8F8F8] disabled:cursor-wait ${
                            notification.isRead ? "bg-white" : "bg-[#FFF8F8]"
                          }`}
                        >
                          {/* Unread Indicator */}

                          <div className="mt-1.5 shrink-0">
                            <span
                              className={`block h-2 w-2 rounded-full ${
                                notification.isRead
                                  ? "bg-transparent"
                                  : "bg-[#DB4444]"
                              }`}
                            />
                          </div>

                          {/* Notification Content */}

                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs sm:text-[13px] ${
                                notification.isRead
                                  ? "font-medium text-[#555555]"
                                  : "font-semibold text-black"
                              }`}
                            >
                              {notification.title}
                            </p>

                            <p className="mt-1 text-[10px] leading-4 text-[#7A7A7A] sm:text-[11px]">
                              {notification.message}
                            </p>

                            <p className="mt-1.5 text-[9px] text-[#A0A0A0] sm:text-[10px]">
                              {formatNotificationTime(notification.createdAt)}
                            </p>
                          </div>

                          {/* Loading Indicator */}

                          {markingNotificationId === notification.id && (
                            <span className="mt-1 shrink-0 text-[9px] text-[#DB4444]">
                              Opening...
                            </span>
                          )}
                        </button>
                      ))}
                  </div>

                  {/* ==================================================
                      VIEW ALL
                  ================================================== */}

                  <div className="border-t border-[#E5E5E5] px-4 py-3 text-center">
                    <Link
                      href="/admin/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-medium text-[#DB4444] hover:underline sm:text-[13px]"
                    >
                      View All
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ==================================================
                PROFILE
            ================================================== */}

            <div className="relative" data-profile-dropdown>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotifOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DB4444] text-[13px] font-semibold text-white sm:h-9 sm:w-9 sm:text-[15px]">
                  {getInitial()}
                </div>

                <div className="hidden max-w-30 text-left sm:block md:max-w-37.5">
                  <p className="truncate text-xs font-semibold leading-tight text-black sm:text-[13px]">
                    {admin.name}
                  </p>

                  <p className="truncate text-[10px] capitalize leading-tight text-[#7A7A7A] sm:text-[11px]">
                    {admin.role}
                  </p>
                </div>

                <FiChevronDown
                  size={16}
                  className="hidden text-[#7A7A7A] sm:block"
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-lg border border-[#E5E5E5] bg-white shadow-xl sm:w-64">
                  <div className="border-b border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3">
                    <p className="truncate text-[13px] font-semibold text-black sm:text-[14px]">
                      {admin.name}
                    </p>

                    <p className="mt-0.5 truncate text-[11px] text-[#7A7A7A] sm:text-[12px]">
                      {admin.email || admin.phone || "No contact"}
                    </p>

                    <p className="mt-1 text-[10px] font-medium capitalize text-[#DB4444] sm:text-[11px]">
                      {admin.role}
                    </p>
                  </div>

                  <Link
                    href="/admin/settings"
                    className="block px-4 py-2.5 text-xs text-black hover:bg-[#F5F5F5] sm:text-[13px]"
                  >
                    Settings
                  </Link>

                  <hr className="border-[#E5E5E5]" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="block w-full px-4 py-2.5 text-left text-xs text-red-500 hover:bg-red-50 disabled:opacity-50 sm:text-[13px]"
                  >
                    {logoutLoading ? "Logging out..." : "Logout"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ======================================================
            PAGE CONTENT
        ====================================================== */}

        <div className="p-4 sm:p-5 lg:p-6">{children}</div>
      </main>
    </div>
  );
};

export default AdminDashboard;
