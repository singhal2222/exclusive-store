"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiTrendingUp,
} from "react-icons/fi";

const Dashboard = () => {
  // ==================================================
  // DASHBOARD STATE
  // ==================================================

  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [statsError, setStatsError] = useState("");
  const [ordersError, setOrdersError] = useState("");

  // ==================================================
  // FETCH DASHBOARD STATISTICS
  // ==================================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingStats(true);
        setStatsError("");

        const response = await fetch("/api/admin/dashboard", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to load dashboard statistics",
          );
        }

        setDashboardData({
          totalRevenue: Number(data?.data?.totalRevenue || 0),
          totalOrders: Number(data?.data?.totalOrders || 0),
          totalCustomers: Number(data?.data?.totalCustomers || 0),
          totalProducts: Number(data?.data?.totalProducts || 0),
        });
      } catch (error) {
        console.error("Dashboard statistics error:", error);

        setStatsError(error?.message || "Failed to load dashboard statistics");
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ==================================================
  // FETCH RECENT ORDERS
  // ==================================================

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        setLoadingOrders(true);
        setOrdersError("");

        const response = await fetch("/api/admin/dashboard/orders", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load recent orders");
        }

        setRecentOrders(Array.isArray(data?.data) ? data.data : []);
      } catch (error) {
        console.error("Recent orders error:", error);

        setOrdersError(error?.message || "Failed to load recent orders");
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchRecentOrders();
  }, []);

  // ==================================================
  // STATS
  // ==================================================

  const stats = [
    {
      label: "Total Revenue",
      value: loadingStats
        ? "..."
        : `₹${Number(dashboardData.totalRevenue || 0).toLocaleString("en-IN")}`,
      icon: FiDollarSign,
      color: "#DB4444",
    },
    {
      label: "Total Orders",
      value: loadingStats
        ? "..."
        : Number(dashboardData.totalOrders || 0).toLocaleString("en-IN"),
      icon: FiShoppingBag,
      color: "#2F80ED",
    },
    {
      label: "Total Customers",
      value: loadingStats
        ? "..."
        : Number(dashboardData.totalCustomers || 0).toLocaleString("en-IN"),
      icon: FiUsers,
      color: "#27AE60",
    },
    {
      label: "Total Products",
      value: loadingStats
        ? "..."
        : Number(dashboardData.totalProducts || 0).toLocaleString("en-IN"),
      icon: FiTrendingUp,
      color: "#F2994A",
    },
  ];

  // ==================================================
  // STATUS COLORS
  // ==================================================

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-purple-100 text-purple-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-indigo-100 text-indigo-700",
    out_for_delivery: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  // ==================================================
  // STATUS LABEL
  // ==================================================

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // ==================================================
  // FORMAT DATE
  // ==================================================

  const formatDate = (date) => {
    if (!date) return "-";

    const formattedDate = new Date(date);

    if (Number.isNaN(formattedDate.getTime())) {
      return "-";
    }

    return formattedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==================================================
  // FORMAT AMOUNT
  // ==================================================

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  // ==================================================
  // RETURN
  // ==================================================

  return (
    <div className="font-poppins">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="mb-5 sm:mb-6">
        <h1 className="mb-1.5 text-xl font-semibold tracking-[0.02em] text-black sm:text-2xl lg:text-[28px] xl:text-[32px]">
          Dashboard Overview
        </h1>

        <p className="text-xs text-[#7A7A7A] sm:text-[13px] lg:text-[15px]">
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>

      {/* ==================================================
          STATS ERROR
      ================================================== */}

      {statsError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {statsError}
        </div>
      )}

      {/* ==================================================
          STATS
      ================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={index}
              className="rounded-xl border border-[#E5E5E5] bg-white p-4 transition-shadow hover:shadow-md lg:p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg sm:h-11 sm:w-11"
                  style={{
                    backgroundColor: `${stat.color}15`,
                  }}
                >
                  <Icon
                    size={20}
                    style={{
                      color: stat.color,
                    }}
                    className="sm:hidden"
                  />

                  <Icon
                    size={21}
                    style={{
                      color: stat.color,
                    }}
                    className="hidden sm:block"
                  />
                </div>
              </div>

              <p className="mb-1 text-[11px] text-[#7A7A7A] sm:text-[12px] lg:text-[13px]">
                {stat.label}
              </p>

              <p className="text-lg font-semibold text-black sm:text-xl lg:text-[24px]">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* ==================================================
          RECENT ORDERS
      ================================================== */}

      <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white">
        {/* Header */}

        <div className="flex items-center justify-between gap-3 border-b border-[#E5E5E5] p-4 sm:p-5">
          <h2 className="text-base font-semibold text-black sm:text-lg lg:text-[19px]">
            Recent Orders
          </h2>

          <Link
            href="/admin/orders"
            className="text-xs font-medium text-[#DB4444] hover:underline sm:text-[13px]"
          >
            View All
          </Link>
        </div>

        {/* Orders Error */}

        {ordersError && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 sm:px-5">
            {ordersError}
          </div>
        )}

        {/* Table */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-150">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#7A7A7A] sm:px-5 sm:py-3 sm:text-[12px]">
                  Order ID
                </th>

                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#7A7A7A] sm:px-5 sm:py-3 sm:text-[12px]">
                  Customer
                </th>

                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#7A7A7A] sm:px-5 sm:py-3 sm:text-[12px]">
                  Amount
                </th>

                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#7A7A7A] sm:px-5 sm:py-3 sm:text-[12px]">
                  Status
                </th>

                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#7A7A7A] sm:px-5 sm:py-3 sm:text-[12px]">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Loading */}

              {loadingOrders && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-[#7A7A7A]"
                  >
                    Loading recent orders...
                  </td>
                </tr>
              )}

              {/* No Orders */}

              {!loadingOrders && !ordersError && recentOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-[#7A7A7A]"
                  >
                    No orders found.
                  </td>
                </tr>
              )}

              {/* Orders */}

              {!loadingOrders &&
                recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[#F5F5F5] transition-colors hover:bg-[#FAFAFA]"
                  >
                    {/* Order ID */}

                    <td className="px-3 py-3 text-[11px] font-medium text-black sm:px-5 sm:py-3.5 sm:text-[13px]">
                      {order.id || "-"}
                    </td>

                    {/* Customer */}

                    <td className="px-3 py-3 text-[11px] text-black sm:px-5 sm:py-3.5 sm:text-[13px]">
                      {order.customer || "Guest Customer"}
                    </td>

                    {/* Amount */}

                    <td className="px-3 py-3 text-[11px] font-semibold text-[#DB4444] sm:px-5 sm:py-3.5 sm:text-[13px]">
                      {formatAmount(order.amount)}
                    </td>

                    {/* Status */}

                    <td className="px-3 py-3 sm:px-5 sm:py-3.5">
                      <span
                        className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium sm:px-2.5 sm:py-1 sm:text-[11px] ${
                          statusColors[order.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {formatStatus(order.status)}
                      </span>
                    </td>

                    {/* Date */}

                    <td className="px-3 py-3 text-[11px] text-[#7A7A7A] sm:px-5 sm:py-3.5 sm:text-[13px]">
                      {formatDate(order.date)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
