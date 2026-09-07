"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  Calendar,
  Download,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Crown,
  Ruler,
  AlertCircle,
  X,
  Store,
  MessageSquare,
  Globe,
} from "lucide-react";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function TwitterIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </svg>
  );
}

import { Order } from "@/types/order";
import { Product } from "@/types/product";
import { Collection } from "@/types/collection";
import { CustomerDirectoryEntry, CustomerBookMetrics } from "@/server/services/customer.service";
import AdminPagination from "@/components/admin/AdminPagination";
import SalesTrajectoryChart from "@/components/admin/SalesTrajectoryChart";
import { toast } from "sonner";

interface DashboardData {
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    craftingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    averageOrderValue: number;
  };
  orders: Order[];
  products: Product[];
  customers: CustomerDirectoryEntry[];
  customerMetrics: CustomerBookMetrics;
  collections: Collection[];
  totalProducts: number;
  lowStockCount: number;
  lowStockProducts: Product[];
  recentOrders: Order[];
}

// Helper to display dates from YYYY-MM-DD strings safely without timezone shifts
const formatDateDisplay = (ymd: string, includeYear = true) => {
  if (!ymd) return "";
  const parts = ymd.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return ymd;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
  });
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Exact Date Filter States (matching Order Fulfillment)
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [datePreset, setDatePreset] = useState<"all" | "today" | "week" | "month" | "lastMonth" | "last30" | "year" | "custom">("all");

  // Pagination state for recent orders
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(6);

  const currentPresetLabel = useMemo(() => {
    if (datePreset === "today") return "Today";
    if (datePreset === "week") return "This Week";
    if (datePreset === "month") return "This Month";
    if (datePreset === "lastMonth") return "Last Month";
    if (datePreset === "last30") return "Last 30 Days";
    if (datePreset === "year") return "This Year";
    if (startDate && endDate) {
      return startDate === endDate
        ? formatDateDisplay(startDate, true)
        : `${formatDateDisplay(startDate, false)} – ${formatDateDisplay(endDate, true)}`;
    }
    if (startDate) return `From ${formatDateDisplay(startDate, true)}`;
    if (endDate) return `Up to ${formatDateDisplay(endDate, true)}`;
    return "All Time";
  }, [datePreset, startDate, endDate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      toast.error("Dashboard Sync Failed", {
        description: "Error loading overview data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsSilent = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {}
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Listen for real-time order/stock events to instantly refresh metrics
  useEffect(() => {
    const handleLiveUpdate = () => {
      fetchStatsSilent();
    };

    window.addEventListener("filayoruba:order-updated", handleLiveUpdate);
    window.addEventListener("filayoruba:admin-event", handleLiveUpdate);
    return () => {
      window.removeEventListener("filayoruba:order-updated", handleLiveUpdate);
      window.removeEventListener("filayoruba:admin-event", handleLiveUpdate);
    };
  }, []);

  const formatNaira = (amount: number) => {
    return `₦${(amount || 0).toLocaleString("en-NG")}`;
  };

  // Preset Date Switcher (Full range preset calculations)
  const applyDatePreset = (preset: "all" | "today" | "week" | "month" | "lastMonth" | "last30" | "year") => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
      return;
    }

    const formatYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "today") {
      const todayStr = formatYMD(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "week") {
      const d = new Date(now);
      const day = d.getDay();
      const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
      const endOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday + 6);
      setStartDate(formatYMD(startOfWeek));
      setEndDate(formatYMD(endOfWeek));
    } else if (preset === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(formatYMD(startOfMonth));
      setEndDate(formatYMD(endOfMonth));
    } else if (preset === "lastMonth") {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(formatYMD(startOfLastMonth));
      setEndDate(formatYMD(endOfLastMonth));
    } else if (preset === "last30") {
      const past30 = new Date(now);
      past30.setDate(past30.getDate() - 30);
      setStartDate(formatYMD(past30));
      setEndDate(formatYMD(now));
    } else if (preset === "year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      setStartDate(formatYMD(startOfYear));
      setEndDate(formatYMD(endOfYear));
    }
  };

  // Filtered Orders Computation (Timezone-safe boundary check)
  const filteredOrders = useMemo(() => {
    if (!data?.orders) return [];

    return data.orders.filter((order) => {
      if (startDate || endDate) {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        if (isNaN(orderDate.getTime())) return false;

        if (startDate) {
          const [sY, sM, sD] = startDate.split("-").map(Number);
          const start = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
          if (orderDate < start) return false;
        }
        if (endDate) {
          const [eY, eM, eD] = endDate.split("-").map(Number);
          const end = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
          if (orderDate > end) return false;
        }
      }
      return true;
    });
  }, [data?.orders, startDate, endDate]);

  // Aggregated Sales Data
  const stats = useMemo(() => {
    const paidStatuses = ["confirmed", "paid", "crafting", "shipped", "delivered"];
    const paidOrders = filteredOrders.filter((o) => {
      const status = (o.status || "").toLowerCase();
      const paymentStatus = (o.paymentStatus || "").toLowerCase();
      if (status === "cancelled" || status === "failed") return false;
      return (
        paidStatuses.includes(status) ||
        paymentStatus === "paid" ||
        (Number(o.amountPaid) || 0) > 0
      );
    });

    const totalRevenue = paidOrders.reduce(
      (sum, o) => sum + (Number(o.amountPaid) || Number(o.total) || 0),
      0
    );
    const paidCount = paidOrders.length;
    const aov = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;
    const confirmedCount = filteredOrders.filter((o) => (o.status || "").toLowerCase() === "confirmed").length;
    const craftingCount = filteredOrders.filter((o) => (o.status || "").toLowerCase() === "crafting").length;
    const queueCount = confirmedCount + craftingCount;

    // Timeline Data Map
    const padNumber = (n: number) => n.toString().padStart(2, "0");
    const getDayKey = (d: Date) => `${d.getFullYear()}-${padNumber(d.getMonth() + 1)}-${padNumber(d.getDate())}`;
    const getMonthKey = (d: Date) => `${d.getFullYear()}-${padNumber(d.getMonth() + 1)}`;

    const dailyMap = new Map<string, { dateStr: string; label: string; revenue: number; orders: number }>();
    let isYearlyGrouping = datePreset === "year";

    if (datePreset === "year") {
      const targetYear = startDate ? Number(startDate.split("-")[0]) : new Date().getFullYear();
      for (let m = 0; m < 12; m++) {
        const d = new Date(targetYear, m, 1);
        const key = `${targetYear}-${padNumber(m + 1)}`;
        const label = d.toLocaleDateString("en-NG", { month: "short" });
        dailyMap.set(key, { dateStr: key, label, revenue: 0, orders: 0 });
      }
    } else if (datePreset === "today") {
      const todayDate = new Date();
      const todayKey = getDayKey(todayDate);
      const label = todayDate.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
      dailyMap.set(todayKey, { dateStr: todayKey, label, revenue: 0, orders: 0 });
    } else if (startDate && endDate) {
      const [sY, sM, sD] = startDate.split("-").map(Number);
      const [eY, eM, eD] = endDate.split("-").map(Number);
      const start = new Date(sY, sM - 1, sD);
      const end = new Date(eY, eM - 1, eD);
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 62) {
        isYearlyGrouping = true;
        const cur = new Date(start.getFullYear(), start.getMonth(), 1);
        while (cur <= end) {
          const key = getMonthKey(cur);
          const label = cur.toLocaleDateString("en-NG", { month: "short", year: "2-digit" });
          dailyMap.set(key, { dateStr: key, label, revenue: 0, orders: 0 });
          cur.setMonth(cur.getMonth() + 1);
        }
      } else {
        const cur = new Date(start);
        while (cur <= end) {
          const key = getDayKey(cur);
          const label = cur.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
          dailyMap.set(key, { dateStr: key, label, revenue: 0, orders: 0 });
          cur.setDate(cur.getDate() + 1);
        }
      }
    } else {
      // datePreset === "all"
      if (paidOrders.length > 0) {
        const timestamps = paidOrders
          .map((o) => (o.createdAt ? new Date(o.createdAt).getTime() : NaN))
          .filter((t) => !isNaN(t));

        if (timestamps.length > 0) {
          const minTime = Math.min(...timestamps);
          const maxTime = Math.max(...timestamps);
          const start = new Date(minTime);
          const end = new Date(maxTime);
          const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays <= 45) {
            const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
            while (cur <= endDay) {
              const key = getDayKey(cur);
              const label = cur.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
              dailyMap.set(key, { dateStr: key, label, revenue: 0, orders: 0 });
              cur.setDate(cur.getDate() + 1);
            }
          } else {
            isYearlyGrouping = true;
            const cur = new Date(start.getFullYear(), start.getMonth(), 1);
            while (cur <= end) {
              const key = getMonthKey(cur);
              const label = cur.toLocaleDateString("en-NG", { month: "short", year: "2-digit" });
              dailyMap.set(key, { dateStr: key, label, revenue: 0, orders: 0 });
              cur.setMonth(cur.getMonth() + 1);
            }
          }
        }
      }
    }

    for (const o of paidOrders) {
      if (!o.createdAt) continue;
      const d = new Date(o.createdAt);
      if (isNaN(d.getTime())) continue;

      let key: string;
      let label: string;

      if (isYearlyGrouping) {
        key = getMonthKey(d);
        label = d.toLocaleDateString("en-NG", { month: "short" });
      } else {
        key = getDayKey(d);
        label = d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
      }

      const entry = dailyMap.get(key) || { dateStr: key, label, revenue: 0, orders: 0 };
      entry.revenue += Number(o.amountPaid) || Number(o.total) || 0;
      entry.orders += 1;
      dailyMap.set(key, entry);
    }

    const dailyTrend = Array.from(dailyMap.values()).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    const maxDaily = Math.max(...dailyTrend.map((d) => d.revenue), 0);

    // Top Selling Caps
    const productMap = new Map<string, { id: string; name: string; image?: string; units: number; revenue: number }>();
    for (const o of paidOrders) {
      for (const item of o.items) {
        const prodId = item.product?.id || item.product?.slug || "item";
        const prodName = item.product?.name || "Handcrafted Fìlà";
        const key = prodId;
        const entry = productMap.get(key) || {
          id: prodId,
          name: prodName,
          image: item.product?.images?.[0],
          units: 0,
          revenue: 0,
        };
        const qty = item.quantity || 1;
        const unitPrice = Number(item.product?.price) || 0;
        entry.units += qty;
        entry.revenue += unitPrice * qty;
        productMap.set(key, entry);
      }
    }
    const topCaps = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 4);

    // Sizing Demand
    const sizeMap = new Map<string, number>();
    let totalSizedUnits = 0;
    for (const o of paidOrders) {
      for (const item of o.items) {
        if (item.selectedSize) {
          const count = item.quantity || 1;
          sizeMap.set(item.selectedSize, (sizeMap.get(item.selectedSize) || 0) + count);
          totalSizedUnits += count;
        }
      }
    }
    const sizing = Array.from(sizeMap.entries())
      .map(([size, count]) => ({
        size,
        count,
        percent: totalSizedUnits > 0 ? Math.round((count / totalSizedUnits) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Active patrons in the selected timeframe
    const activePatronsSet = new Set<string>();
    for (const o of filteredOrders) {
      const identifier =
        o.customer?.email?.toLowerCase().trim() ||
        o.customer?.phone?.trim() ||
        (o.customer?.firstName ? `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase().trim() : null);
      if (identifier) {
        activePatronsSet.add(identifier);
      }
    }
    const activePatronsCount = activePatronsSet.size;

    // Omnichannel Breakdown
    const channelMap = new Map<string, { revenue: number; orders: number }>();
    for (const o of paidOrders) {
      const ch = o.salesChannel || "ONLINE_STORE";
      const cur = channelMap.get(ch) || { revenue: 0, orders: 0 };
      cur.revenue += Number(o.amountPaid) || Number(o.total) || 0;
      cur.orders += 1;
      channelMap.set(ch, cur);
    }

    const channelBreakdown = [
      { key: "ONLINE_STORE", label: "Online Store", color: "bg-blue-500", dot: "bg-blue-500", icon: Globe },
      { key: "WHATSAPP", label: "WhatsApp", color: "bg-emerald-500", dot: "bg-emerald-500", icon: MessageSquare },
      { key: "INSTAGRAM", label: "Instagram", color: "bg-fuchsia-500", dot: "bg-fuchsia-500", icon: InstagramIcon },
      { key: "X", label: "X (Twitter)", color: "bg-slate-700", dot: "bg-slate-700", icon: TwitterIcon },
      { key: "WALK_IN", label: "Walk-in Store", color: "bg-amber-500", dot: "bg-amber-500", icon: Store },
    ].map((ch) => {
      const item = channelMap.get(ch.key) || { revenue: 0, orders: 0 };
      const percent = totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;
      return {
        ...ch,
        revenue: item.revenue,
        orders: item.orders,
        percent,
      };
    });

    return {
      totalRevenue,
      paidCount,
      aov,
      confirmedCount,
      craftingCount,
      queueCount,
      activePatronsCount,
      dailyTrend,
      maxDaily,
      topCaps,
      sizing,
      channelBreakdown,
      totalOrders: filteredOrders.length,
    };
  }, [filteredOrders, datePreset, startDate, endDate]);

  // Reset page when date filter changes
  useEffect(() => {
    setOrderPage(1);
  }, [datePreset, startDate, endDate]);

  const paginatedRecentOrders = useMemo(() => {
    const start = (orderPage - 1) * orderPageSize;
    return filteredOrders.slice(start, start + orderPageSize);
  }, [filteredOrders, orderPage, orderPageSize]);

  // 18-Column Omnichannel CSV Export
  const exportCSV = () => {
    const headers = [
      "Order Number",
      "Created Date",
      "Sales Channel",
      "Order Status",
      "Payment Status",
      "Payment Method",
      "Fulfillment Type",
      "Customer Name",
      "Customer Phone",
      "Customer Email",
      "Subtotal",
      "Discount",
      "Shipping Fee",
      "Total",
      "Amount Paid",
      "Amount Due",
      "Amount Refunded",
      "Payment Reference",
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber || o.id}"`,
      `"${o.createdAt ? new Date(o.createdAt).toISOString() : ""}"`,
      `"${o.salesChannel || "ONLINE_STORE"}"`,
      `"${o.status.toUpperCase()}"`,
      `"${(o.paymentStatus || "unpaid").toUpperCase()}"`,
      `"${o.paymentMethod || "N/A"}"`,
      `"${(o.fulfillmentType || "delivery").toUpperCase()}"`,
      `"${(`${o.customer?.firstName || ""} ${o.customer?.lastName || ""}`).trim()}"`,
      `"${o.customer?.phone || ""}"`,
      `"${o.customer?.email || ""}"`,
      (Number(o.subtotal) || 0).toFixed(2),
      (Number(o.discount) || 0).toFixed(2),
      (Number(o.shipping) || 0).toFixed(2),
      (Number(o.total) || 0).toFixed(2),
      (Number(o.amountPaid) || 0).toFixed(2),
      (Number(o.amountDue) || 0).toFixed(2),
      (Number(o.amountRefunded) || 0).toFixed(2),
      `"${o.paymentReference || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filenameSuffix =
      datePreset === "all"
        ? "All_Time"
        : datePreset === "custom" && startDate && endDate
        ? `${startDate}_to_${endDate}`
        : datePreset;
    link.setAttribute("download", `FilaYoruba_Omnichannel_Sales_${filenameSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Export Complete", {
      description: `Omnichannel 18-column sales dataset for ${currentPresetLabel} exported successfully.`,
    });
  };

  const getStatusBadge = (status: string, paymentStatus?: string) => {
    const sLower = (status || "").toLowerCase();
    const pLower = (paymentStatus || "").toLowerCase();

    if (sLower === "confirmed" || sLower === "paid" || pLower === "paid") {
      if (sLower === "crafting") {
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md border bg-purple-50 text-purple-700 border-purple-200">In Crafting</span>;
      }
      if (sLower === "shipped") {
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md border bg-indigo-50 text-indigo-700 border-indigo-200">Shipped</span>;
      }
      if (sLower === "delivered") {
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">Delivered</span>;
      }
      return (
        <span className="px-2 py-0.5 text-[11px] font-bold rounded-md border bg-blue-50 text-blue-700 border-blue-200">
          Confirmed & Paid
        </span>
      );
    }

    const map: Record<string, { label: string; bg: string }> = {
      crafting: { label: "In Crafting", bg: "bg-purple-50 text-purple-700 border-purple-200" },
      shipped: { label: "Shipped", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
      delivered: { label: "Delivered", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      pending: { label: "Pending Payment", bg: "bg-amber-50 text-amber-700 border-amber-200" },
      cancelled: { label: "Cancelled", bg: "bg-slate-100 text-slate-600 border-slate-200" },
      failed: { label: "Payment Failed", bg: "bg-red-50 text-red-700 border-red-200" },
    };
    const s = map[sLower] || { label: status || "Pending", bg: "bg-slate-100 text-slate-700 border-slate-200" };
    return (
      <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${s.bg}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Clean, Modern Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#000000] tracking-tight">
            Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Store performance, revenue analytics, and live fulfillment.
          </p>
        </div>

        {/* Date Filter & Export Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Exact Calendar Date Range Filter & Presets */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs hover:border-[#FED501]/50 focus-within:border-[#FED501] focus-within:ring-2 focus-within:ring-[#FED501]/20 transition-all flex-wrap">
            {/* Presets Dropdown */}
            <div className="flex items-center pl-2 pr-1 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-[#FED501] mr-1.5 shrink-0" />
              <select
                value={datePreset}
                onChange={(e) =>
                  applyDatePreset(e.target.value as "all" | "today" | "week" | "month" | "lastMonth" | "last30" | "year")
                }
                className="bg-transparent text-xs font-bold text-[#000000] focus:outline-none cursor-pointer pr-6"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="last30">Last 30 Days</option>
                <option value="year">This Year</option>
                {datePreset === "custom" && <option value="custom">Custom Range</option>}
              </select>
            </div>

            {/* From Date */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="bg-transparent text-xs font-mono text-slate-800 focus:outline-none cursor-pointer"
                title="Start Date"
              />
            </div>

            {/* To Date */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="bg-transparent text-xs font-mono text-slate-800 focus:outline-none cursor-pointer"
                title="End Date"
              />
            </div>

            {/* Clear Date */}
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setDatePreset("all");
                }}
                className="p-1 text-slate-400 hover:text-red-600 cursor-pointer rounded transition-colors"
                title="Clear date filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            title="Export CSV"
          >
            <Download size={13} className="text-slate-500" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-2xs"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-[#FED501]" : ""} />
          </button>
        </div>
      </div>

      {/* Active Date Filter Pill Bar */}
      {(startDate || endDate) && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs animate-fade-down">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-semibold text-[11px]">Active Filter:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#000000] text-white text-[11px] font-semibold">
              <span>
                {startDate && endDate
                  ? startDate === endDate
                    ? formatDateDisplay(startDate, true)
                    : `${formatDateDisplay(startDate, false)} – ${formatDateDisplay(endDate, true)}`
                  : startDate
                  ? `From ${formatDateDisplay(startDate, true)}`
                  : `Up to ${formatDateDisplay(endDate, true)}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setDatePreset("all");
                }}
                className="hover:text-[#FED501] cursor-pointer ml-0.5"
                title="Remove date filter"
              >
                <X size={12} />
              </button>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setDatePreset("all");
            }}
            className="text-[11px] font-bold text-[#FED501] hover:underline cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* 4 Clean Metric Cards (2x2 on mobile, 4x1 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Revenue */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            Gross Revenue
          </span>
          <div className="text-lg sm:text-2xl font-bold text-[#000000] tracking-tight truncate">
            {loading ? "..." : formatNaira(stats.totalRevenue)}
          </div>
          <span className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold block truncate">
            {stats.paidCount} paid {stats.paidCount === 1 ? "order" : "orders"}
          </span>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
            Total Orders
          </span>
          <div className="text-lg sm:text-2xl font-bold text-[#000000] tracking-tight">
            {loading ? "..." : stats.totalOrders}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block truncate">
            Avg: <strong className="text-slate-700">{formatNaira(stats.aov)}</strong>
          </span>
        </div>

        {/* Total Patrons */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              {startDate || endDate ? "Active Patrons" : "Patrons"}
            </span>
            <Link href="/admin/customers" className="text-[10px] font-bold text-[#FED501] hover:underline hidden sm:inline">
              Book →
            </Link>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-[#000000] tracking-tight">
            {loading
              ? "..."
              : startDate || endDate
              ? stats.activePatronsCount
              : Math.max(data?.customers?.length || 0, stats.activePatronsCount)}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block truncate">
            {startDate || endDate
              ? `${stats.activePatronsCount} ordering in period`
              : `VIP: ${data?.customerMetrics?.vipCount || 0}`}
          </span>
        </div>

        {/* Fulfillment Queue */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Fulfillment Queue
            </span>
            <Link href="/admin/orders" className="text-[10px] font-bold text-[#FED501] hover:underline hidden sm:inline">
              Orders →
            </Link>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-[#000000] tracking-tight">
            {loading ? "..." : stats.queueCount}
          </div>
          <span className="text-[10px] sm:text-[11px] text-amber-700 font-semibold block truncate">
            {stats.queueCount > 0
              ? `${stats.confirmedCount} confirmed • ${stats.craftingCount} crafting`
              : "Queue clear"}
          </span>
        </div>
      </div>

      {/* Main Grid: Left (Recent Orders & Revenue Chart) | Right (Top Products & Sizing) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left Column (2 Cols): Sales Trajectory & Orders */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          {/* Sales Trajectory Bar Chart */}
          <SalesTrajectoryChart
            data={stats.dailyTrend}
            timePreset={datePreset}
            presetLabel={currentPresetLabel}
            onResetPreset={() => applyDatePreset("all")}
          />

          {/* Recent Orders Table / Mobile Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-[#000000]">Recent Orders</h2>
                <p className="text-[11px] text-slate-400">Latest customer purchases awaiting fulfillment</p>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-bold text-[#FED501] hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 italic">No orders found in this period.</div>
            ) : (
              <>
                {/* 1. Mobile Cards View (< sm screens) */}
                <div className="divide-y divide-slate-100 sm:hidden">
                  {paginatedRecentOrders.map((order) => (
                    <div key={order.id} className="p-3.5 space-y-2 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#000000] text-xs">
                          {order.orderNumber || order.id.slice(0, 8)}
                        </span>
                        {getStatusBadge(order.status, order.paymentStatus)}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800">
                            {order.customer.firstName} {order.customer.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400">{order.customer.email}</div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-[#000000]">
                            {formatNaira(order.total)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(order.createdAt || Date.now()).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-end">
                        <Link
                          href={`/admin/orders?search=${encodeURIComponent(order.orderNumber || order.id)}`}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-[#000000] hover:text-white font-bold transition-colors text-[11px] text-[#000000]"
                        >
                          Fulfill Pipeline ↗
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. Desktop Table View (>= sm screens) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Total</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedRecentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#000000]">
                            {order.orderNumber || order.id.slice(0, 8)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">
                              {order.customer.firstName} {order.customer.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400">{order.customer.email}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(order.createdAt || Date.now()).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                            })}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#000000]">
                            {formatNaira(order.total)}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(order.status, order.paymentStatus)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/admin/orders?search=${encodeURIComponent(order.orderNumber || order.id)}`}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#000000] hover:text-white font-bold transition-colors inline-block text-[11px]"
                            >
                              Fulfill ↗
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls for Recent Orders */}
                <AdminPagination
                  currentPage={orderPage}
                  totalItems={filteredOrders.length}
                  pageSize={orderPageSize}
                  onPageChange={setOrderPage}
                  onPageSizeChange={setOrderPageSize}
                  pageSizeOptions={[6, 12, 24]}
                  itemLabel="orders"
                />
              </>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Top Caps, Sizing & Alerts */}
        <div className="space-y-6">
          {/* Top Selling Caps */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Top Selling Fìlàs
              </h3>
              <Link href="/admin/products" className="text-[11px] font-bold text-[#FED501] hover:underline">
                Catalog →
              </Link>
            </div>

            {stats.topCaps.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No sales yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.topCaps.map((p, idx) => (
                  <div key={p.id || idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-900 shrink-0 relative border border-slate-200">
                        <ImageWithFallback
                          src={p.image}
                          alt={p.name}
                          fill
                          className="object-cover"
                          fallbackTitle={p.name}
                          fallbackVariant="sm"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{p.name}</p>
                        <p className="text-slate-400 text-[10px]">{p.units} sold</p>
                      </div>
                    </div>
                    <span className="font-bold text-[#000000] shrink-0 ml-2">{formatNaira(p.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sales by Channel (Omnichannel Analytics Widget) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-500" />
                Sales by Channel
              </h3>
              <Link href="/admin/orders" className="text-[11px] font-bold text-[#FED501] hover:underline">
                Orders →
              </Link>
            </div>

            <div className="space-y-3">
              {stats.channelBreakdown.map((ch) => {
                const IconComponent = ch.icon;
                return (
                  <div key={ch.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <IconComponent className="w-3.5 h-3.5 text-slate-500" />
                        <span>{ch.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({ch.orders} {ch.orders === 1 ? "sale" : "sales"})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{formatNaira(ch.revenue)}</span>
                        <span className="text-[10px] font-bold text-slate-400 w-7 text-right">
                          {ch.percent}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${ch.percent}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${ch.color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sizing Demand */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Sizing Demand
            </h3>

            {stats.sizing.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center">No sizing history.</p>
            ) : (
              <div className="space-y-2">
                {stats.sizing.map((s, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Size: {s.size}&quot;</span>
                      <span className="font-bold text-[#000000]">{s.percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div style={{ width: `${s.percent}%` }} className="bg-[#000000] h-full rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock Alerts (Only shows if any low stock exists) */}
          {data?.lowStockProducts && data.lowStockProducts.length > 0 && (
            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertCircle size={14} className="text-amber-600 shrink-0" />
                <span>Low Inventory Alert ({data.lowStockProducts.length})</span>
              </div>
              <div className="space-y-1 text-[11px] text-amber-800">
                {data.lowStockProducts.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="truncate max-w-[160px]">{p.name}</span>
                    <span className="font-bold text-red-600">{p.stock} left</span>
                  </div>
                ))}
              </div>
              <Link
                href="/admin/products"
                className="block text-center font-bold text-amber-900 hover:underline pt-1 text-[11px]"
              >
                Restock in Catalog →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
