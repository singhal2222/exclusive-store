"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiPackage,
  FiShoppingBag,
  FiUserPlus,
  FiAlertCircle,
  FiXCircle,
  FiRefreshCw,
  FiArrowLeft,
} from "react-icons/fi";

const AdminNotifications = () => {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [markingNotificationId, setMarkingNotificationId] = useState(null);

  // --------------------------------------------------
  // FETCH NOTIFICATIONS
  // --------------------------------------------------

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/notifications", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load notifications"
        );
      }

      setNotifications(result.data?.notifications || []);
      setUnreadCount(result.data?.unreadCount || 0);
    } catch (error) {
      console.error("Fetch notifications error:", error);

      setError(
        error.message || "Something went wrong while loading notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // --------------------------------------------------
  // FORMAT TIME
  // --------------------------------------------------

  const formatRelativeTime = (date) => {
    if (!date) return "";

    const notificationDate = new Date(date);
    const now = new Date();

    const difference = now.getTime() - notificationDate.getTime();

    const seconds = Math.floor(difference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }

    if (hours < 24) {
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }

    if (days < 7) {
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    }

    return notificationDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // --------------------------------------------------
  // NOTIFICATION ICON
  // --------------------------------------------------

  const getNotificationIcon = (type) => {
    switch (type) {
      case "new_order":
        return <FiShoppingBag size={20} />;

      case "new_customer":
        return <FiUserPlus size={20} />;

      case "low_stock":
        return <FiAlertCircle size={20} />;

      case "out_of_stock":
        return <FiXCircle size={20} />;

      case "payment_received":
        return <FiCreditCard size={20} />;

      case "order_status":
        return <FiPackage size={20} />;

      case "order_cancelled":
        return <FiXCircle size={20} />;

      default:
        return <FiBell size={20} />;
    }
  };

  // --------------------------------------------------
  // NOTIFICATION ICON BACKGROUND
  // --------------------------------------------------

  const getNotificationIconClass = (type) => {
    switch (type) {
      case "new_order":
        return "bg-blue-100 text-blue-600";

      case "new_customer":
        return "bg-green-100 text-green-600";

      case "low_stock":
        return "bg-yellow-100 text-yellow-600";

      case "out_of_stock":
        return "bg-red-100 text-red-600";

      case "payment_received":
        return "bg-emerald-100 text-emerald-600";

      case "order_status":
        return "bg-purple-100 text-purple-600";

      case "order_cancelled":
        return "bg-red-100 text-red-600";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // --------------------------------------------------
  // MARK ONE NOTIFICATION AS READ
  // --------------------------------------------------

  const handleNotificationClick = async (notification) => {
    if (!notification?.id) {
      return;
    }

    try {
      setMarkingNotificationId(notification.id);

      if (!notification.isRead) {
        const response = await fetch(
          `/api/admin/notifications/${notification.id}/read`,
          {
            method: "PATCH",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to mark notification as read"
          );
        }

        setNotifications((previousNotifications) =>
          previousNotifications.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : item
          )
        );

        setUnreadCount((previousCount) =>
          Math.max(previousCount - 1, 0)
        );
      }

      if (notification.link) {
        router.push(notification.link);
      }
    } catch (error) {
      console.error("Mark notification as read error:", error);

      setError(
        error.message || "Failed to update notification."
      );
    } finally {
      setMarkingNotificationId(null);
    }
  };

  // --------------------------------------------------
  // MARK ALL AS READ
  // --------------------------------------------------

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      setMarkAllLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/notifications/read-all",
        {
          method: "PATCH",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to mark all notifications as read"
        );
      }

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all notifications error:", error);

      setError(
        error.message || "Failed to mark all notifications as read."
      );
    } finally {
      setMarkAllLoading(false);
    }
  };

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="flex animate-pulse gap-4 border-b border-gray-100 p-5 last:border-b-0"
            >
              <div className="h-11 w-11 shrink-0 rounded-full bg-gray-200" />

              <div className="flex-1">
                <div className="h-4 w-48 rounded bg-gray-200" />
                <div className="mt-3 h-3 w-full max-w-xl rounded bg-gray-200" />
                <div className="mt-2 h-3 w-24 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <div className="w-full">
      {/* PAGE HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-black"
              aria-label="Go back"
            >
              <FiArrowLeft size={18} />
            </button>

            <h1 className="text-2xl font-semibold text-gray-900">
              Notifications
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Manage and view all your admin notifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* REFRESH */}
          <button
            type="button"
            onClick={fetchNotifications}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>

          {/* MARK ALL */}
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={markAllLoading || unreadCount === 0}
            className="flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiCheck size={16} />

            {markAllLoading
              ? "Marking..."
              : "Mark all as read"}
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Notifications
              </p>

              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {notifications.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700">
              <FiBell size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Unread Notifications
              </p>

              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {unreadCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <FiCheckCircle size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="font-medium text-red-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* NOTIFICATIONS */}
      {notifications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <FiBell size={28} />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-gray-900">
            No notifications
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            You don't have any notifications right now. New orders,
            customers, payments and other admin activities will appear
            here.
          </p>

          <button
            type="button"
            onClick={fetchNotifications}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {notifications.map((notification) => {
            const isMarking =
              markingNotificationId === notification.id;

            return (
              <button
                key={notification.id}
                type="button"
                onClick={() =>
                  handleNotificationClick(notification)
                }
                disabled={isMarking}
                className={`group flex w-full items-start gap-4 border-b border-gray-100 p-5 text-left transition last:border-b-0 ${
                  notification.isRead
                    ? "bg-white hover:bg-gray-50"
                    : "bg-purple-50/40 hover:bg-purple-50"
                } ${
                  isMarking
                    ? "cursor-wait opacity-70"
                    : "cursor-pointer"
                }`}
              >
                {/* ICON */}
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${getNotificationIconClass(
                    notification.type
                  )}`}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                {/* CONTENT */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm font-semibold ${
                          notification.isRead
                            ? "text-gray-800"
                            : "text-gray-950"
                        }`}
                      >
                        {notification.title}
                      </h3>

                      {!notification.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-purple-600" />
                      )}
                    </div>

                    <span className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
                      <FiClock size={13} />
                      {formatRelativeTime(
                        notification.createdAt
                      )}
                    </span>
                  </div>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {notification.message}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    {notification.isRead ? (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <FiCheck size={13} />
                        Read
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-purple-600">
                        Unread
                      </span>
                    )}

                    {notification.link && (
                      <span className="text-xs text-gray-400">
                        • Click to view
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
