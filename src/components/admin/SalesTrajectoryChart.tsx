"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { TrendingUp, ShoppingBag, DollarSign, Sparkles } from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface DailySalesData {
  dateStr: string;
  label: string;
  revenue: number;
  orders: number;
}

interface SalesTrajectoryChartProps {
  data: DailySalesData[];
  timePreset: string;
  presetLabel?: string;
  onResetPreset?: () => void;
}

export default function SalesTrajectoryChart({
  data,
  timePreset,
  presetLabel,
  onResetPreset,
}: SalesTrajectoryChartProps) {
  const [metricMode, setMetricMode] = useState<"revenue" | "orders">("revenue");
  const [isMounted, setIsMounted] = useState(false);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 0);
  const maxOrders = Math.max(...data.map((d) => d.orders), 0);
  const avgDailyRevenue = data.length > 0 ? Math.round(totalRevenue / data.length) : 0;

  const formatNaira = (amount: number) => {
    return `₦${(amount || 0).toLocaleString("en-NG")}`;
  };

  const getPresetLabel = (preset: string) => {
    switch (preset) {
      case "today":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "lastMonth":
        return "Last Month";
      case "last30":
        return "Last 30 Days";
      case "year":
        return "This Year";
      case "custom":
        return "Custom Range";
      case "all":
      default:
        return "All Time";
    }
  };

  // Prepare Chart.js Data
  const chartData: ChartData<"bar"> = useMemo(() => {
    const labels = data.map((d) => d.label);
    const values = data.map((d) => (metricMode === "revenue" ? d.revenue : d.orders));

    return {
      labels,
      datasets: [
        {
          label: metricMode === "revenue" ? "Gross Revenue (NGN)" : "Paid Orders",
          data: values,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) {
              return metricMode === "revenue" ? "#000000" : "#CA8A04";
            }
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            if (metricMode === "revenue") {
              gradient.addColorStop(0, "#000000");
              gradient.addColorStop(1, "#262626");
            } else {
              gradient.addColorStop(0, "#CA8A04");
              gradient.addColorStop(1, "#FED501");
            }
            return gradient;
          },
          hoverBackgroundColor: "#FED501",
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 44,
        },
      ],
    };
  }, [data, metricMode]);

  // Chart.js Options
  const chartOptions: ChartOptions<"bar"> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 500,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#000000",
          titleColor: "#FED501",
          titleFont: {
            size: 12,
            weight: "bold",
          },
          bodyColor: "#FFFFFF",
          bodyFont: {
            size: 11,
          },
          borderColor: "#FED501",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            title: (items) => {
              if (!items.length) return "";
              const idx = items[0].dataIndex;
              const entry = data[idx];
              return entry ? `${entry.label} (${entry.dateStr})` : items[0].label;
            },
            label: (item) => {
              const idx = item.dataIndex;
              const entry = data[idx];
              if (!entry) return "";
              if (metricMode === "revenue") {
                return [
                  `Revenue: ₦${(entry.revenue || 0).toLocaleString("en-NG")}`,
                  `Orders: ${entry.orders} ${entry.orders === 1 ? "order" : "orders"}`,
                ];
              } else {
                return [
                  `Orders: ${entry.orders}`,
                  `Revenue: ₦${(entry.revenue || 0).toLocaleString("en-NG")}`,
                ];
              }
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#64748B",
            font: {
              size: 11,
              weight: 500,
            },
          },
          border: {
            color: "#E2E8F0",
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "#F1F5F9",
          },
          ticks: {
            color: "#94A3B8",
            font: {
              size: 10,
            },
            callback: (val) => {
              const num = Number(val);
              if (metricMode === "revenue") {
                if (num >= 1_000_000) return `₦${(num / 1_000_000).toFixed(1)}m`;
                if (num >= 1_000) return `₦${(num / 1_000).toFixed(0)}k`;
                return `₦${num}`;
              }
              return `${num}`;
            },
          },
          border: {
            display: false,
          },
        },
      },
    };
  }, [data, metricMode]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
      {/* Top Header & Interactive Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Sales Trajectory & Cadence
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-[#000000]/5 text-[#000000] text-[10px] font-bold">
              {presetLabel || getPresetLabel(timePreset)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time visual order trends, revenue velocity, and peak checkout cadence
          </p>
        </div>

        {/* View Metric Mode Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setMetricMode("revenue")}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                metricMode === "revenue"
                  ? "bg-[#000000] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <DollarSign size={12} className={metricMode === "revenue" ? "text-[#FED501]" : ""} />
              <span>Revenue</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricMode("orders")}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
                metricMode === "orders"
                  ? "bg-[#000000] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShoppingBag size={12} className={metricMode === "orders" ? "text-[#FED501]" : ""} />
              <span>Orders</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Pills Bar */}
      {data.length > 0 && (maxRevenue > 0 || maxOrders > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 pb-1">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Revenue</span>
            <span className="text-xs sm:text-sm font-extrabold text-emerald-700">
              {formatNaira(totalRevenue)}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {timePreset === "year" ? "Peak Month" : "Peak Day"}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-[#000000]">
              {metricMode === "revenue" ? formatNaira(maxRevenue) : `${maxOrders} orders`}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {timePreset === "year" ? "Monthly Average" : "Daily Average"}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-700">
              {formatNaira(avgDailyRevenue)}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Orders</span>
            <span className="text-xs sm:text-sm font-extrabold text-amber-800">
              {totalOrders} {totalOrders === 1 ? "order" : "orders"}
            </span>
          </div>
        </div>
      )}

      {/* Chart Canvas Area */}
      {data.length === 0 || (maxRevenue === 0 && maxOrders === 0) ? (
        <div className="py-12 text-center space-y-2.5 border border-dashed border-slate-200 rounded-2xl bg-slate-50/60">
          <TrendingUp className="w-9 h-9 text-slate-300 mx-auto" />
          <h4 className="text-xs font-bold text-slate-700">No completed orders in this date range</h4>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Try adjusting your timeframe filter or switch to another month/year to inspect sales.
          </p>
          {onResetPreset && (
            <button
              type="button"
              onClick={onResetPreset}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#000000] text-white text-xs font-bold hover:bg-[#1A1A1A] transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles size={12} className="text-[#FED501]" />
              <span>Reset Date Filter</span>
            </button>
          )}
        </div>
      ) : (
        <div className="w-full h-64 sm:h-72 pt-3">
          {isMounted ? (
            <Bar ref={chartRef} data={chartData} options={chartOptions} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
              Loading chart visuals...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
