"use client";

import { useEffect, useState, useMemo } from "react";
import {
  History,
  Search,
  RefreshCw,
  ShieldCheck,
  Package,
  ShoppingBag,
  Lock,
  Users,
  Eye,
  X,
  Clock,
  Globe,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileCode,
  Sparkles,
} from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userId: string | null;
  userEmail: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditStats {
  totalEvents: number;
  todayEvents: number;
  authEvents: number;
  orderEvents: number;
}

const entityIcons: Record<string, typeof Package> = {
  Order: Package,
  Product: ShoppingBag,
  Auth: Lock,
  Team: Users,
  ProductMedia: Sparkles,
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActionBadgeStyle(action: string): { bg: string; text: string; label: string } {
  if (action.includes("FAILED") || action.includes("RATE_LIMITED") || action.includes("HARD_DELETE")) {
    return {
      bg: "bg-rose-50 border-rose-200",
      text: "text-rose-700",
      label: action.replace(/_/g, " "),
    };
  }
  if (action.includes("TRASH")) {
    return {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      label: action.replace(/_/g, " "),
    };
  }
  if (action.includes("RESTORE") || action.includes("SUCCESS") || action.includes("VERIFY")) {
    return {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      label: action.replace(/_/g, " "),
    };
  }
  if (action.includes("TEAM")) {
    return {
      bg: "bg-purple-50 border-purple-200",
      text: "text-purple-700",
      label: action.replace(/_/g, " "),
    };
  }
  if (action.includes("PRODUCT")) {
    return {
      bg: "bg-teal-50 border-teal-200",
      text: "text-teal-700",
      label: action.replace(/_/g, " "),
    };
  }
  return {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    label: action.replace(/_/g, " "),
  };
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async (currentPage = page, currentLimit = pageSize) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", currentLimit.toString());
      if (search.trim()) params.set("search", search.trim());
      if (selectedEntity !== "all") params.set("entity", selectedEntity);

      const res = await fetch(`/api/admin/activity?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Failed to load activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, pageSize);
  }, [page, selectedEntity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(1);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FED501]/10 text-[#8F7216] border border-[#FED501]/30 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#FED501]" /> Immutable Audit Trail
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#000000] mt-1">
            Administrative Activity Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Real-time traceability for order fulfillment status, stock adjustments, media uploads, and team actions.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(page)}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Metrics Cards Grid (2x2 on Mobile, 4-col on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Recorded</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#000000]">
            {stats ? stats.totalEvents.toLocaleString() : "..."}
          </div>
          <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500 truncate">Security & audit trail records</div>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Today&apos;s Activity</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#000000]">
            {stats ? stats.todayEvents.toLocaleString() : "..."}
          </div>
          <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-emerald-600 font-semibold truncate">Events logged today</div>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Order Ops</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#000000]">
            {stats ? stats.orderEvents.toLocaleString() : "..."}
          </div>
          <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500 truncate">Fulfillments & Paystack</div>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Auth & Team</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#000000]">
            {stats ? stats.authEvents.toLocaleString() : "..."}
          </div>
          <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500 truncate">Logins & access changes</div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4">
        {/* Entity Selector Dropdown */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs hover:border-[#FED501]/60 focus-within:border-[#FED501] focus-within:ring-2 focus-within:ring-[#FED501]/20 transition-all self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-[#FED501] shrink-0" />
          <select
            value={selectedEntity}
            onChange={(e) => {
              setSelectedEntity(e.target.value);
              setPage(1);
            }}
            className="bg-transparent text-xs font-bold text-[#000000] focus:outline-none cursor-pointer pr-6"
          >
            <option value="all">All Entities</option>
            <option value="Order">Orders</option>
            <option value="Product">Products</option>
            <option value="Auth">Auth & Security</option>
            <option value="Team">Team Management</option>
            <option value="ProductMedia">Media Uploads</option>
          </select>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 flex-1 sm:min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by action, email, IP, #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                  setTimeout(() => fetchLogs(1), 0);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#000000] text-white text-xs font-bold rounded-xl hover:bg-[#262626] transition-colors shadow-sm cursor-pointer shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-slate-300" />
            Loading activity log records...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-700">No activity records found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Administrative actions will automatically stream here.
            </p>
          </div>
        ) : (
          <>
            {/* 1. MOBILE CARD LIST (< md) */}
            <div className="divide-y divide-slate-100 md:hidden">
              {logs.map((log) => {
                const badge = getActionBadgeStyle(log.action);
                const Icon = entityIcons[log.entity] || Package;

                return (
                  <div key={log.id} className="p-3.5 space-y-2.5">
                    {/* Top Row: Action Badge + Relative Time */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium shrink-0">
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </div>

                    {/* Middle Row: Entity & Actor */}
                    <div className="flex items-center justify-between gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700 min-w-0">
                        <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{log.entity}</span>
                        {log.entityId && (
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[80px]">
                            #{log.entityId.slice(-6)}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-600 font-medium truncate max-w-[130px] text-right">
                        {log.userEmail || "System"}
                      </div>
                    </div>

                    {/* Bottom Row: IP & Inspect Button */}
                    <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>{log.ipAddress || "127.0.0.1"}</span>
                      </div>

                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#000000] hover:text-white text-slate-700 font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. DESKTOP MULTI-COLUMN TABLE (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Timestamp</th>
                    <th className="py-4 px-6">Action / Event</th>
                    <th className="py-4 px-6">Entity</th>
                    <th className="py-4 px-6">Admin Actor</th>
                    <th className="py-4 px-6">IP Address</th>
                    <th className="py-4 px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    const badge = getActionBadgeStyle(log.action);
                    const Icon = entityIcons[log.entity] || Package;

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Timestamp */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-800 text-xs">
                            {formatRelativeTime(log.createdAt)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {new Date(log.createdAt).toLocaleTimeString("en-NG", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-bold border inline-block ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Entity */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                            <Icon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{log.entity}</span>
                          </div>
                          {log.entityId && (
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5 truncate max-w-[120px]">
                              {log.entityId}
                            </span>
                          )}
                        </td>

                        {/* Actor */}
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800">
                            {log.userEmail || "System Automation"}
                          </div>
                          {log.details && typeof log.details === "object" && "role" in log.details && (
                            <span className="text-[10px] text-[#8F7216] font-bold uppercase tracking-wider">
                              {String(log.details.role)}
                            </span>
                          )}
                        </td>

                        {/* IP */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                            <Globe className="w-3 h-3 text-slate-400" />
                            <span>{log.ipAddress || "127.0.0.1"}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#000000] hover:text-white text-slate-700 font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <AdminPagination
              currentPage={page}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={(newPage) => {
                setPage(newPage);
                fetchLogs(newPage, pageSize);
              }}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
                fetchLogs(1, newSize);
              }}
              pageSizeOptions={[15, 25, 50, 100]}
              itemLabel="audit records"
            />
          </>
        )}
      </div>

      {/* Inspect Detail Drawer / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8 border border-slate-200 shadow-2xl relative animate-scale-up space-y-4 sm:space-y-6">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="border-b border-slate-100 pb-3 sm:pb-4">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FED501]">
                Audit Event Inspection
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#000000] mt-1">
                {selectedLog.action.replace(/_/g, " ")}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(selectedLog.createdAt).toLocaleString("en-NG")}</span>
              </div>
            </div>

            {/* Overview Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] sm:text-[11px] font-medium">Entity</span>
                <span className="font-bold text-slate-800">{selectedLog.entity}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] sm:text-[11px] font-medium">Actor / Email</span>
                <span className="font-bold text-slate-800">
                  {selectedLog.userEmail || "System Automation"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] sm:text-[11px] font-medium">Target ID</span>
                <span className="font-mono font-bold text-slate-800 truncate block">
                  {selectedLog.entityId || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] sm:text-[11px] font-medium">Client IP Address</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedLog.ipAddress || "127.0.0.1"}
                </span>
              </div>
            </div>

            {/* Event Payload JSON */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-[#FED501]" /> Event Payload Details
                </h4>
              </div>
              <div className="bg-[#000000] rounded-2xl p-3.5 sm:p-4 overflow-x-auto text-[10px] sm:text-[11px] font-mono text-emerald-400 border border-slate-800 shadow-inner max-h-60">
                <pre>{JSON.stringify(selectedLog.details || {}, null, 2)}</pre>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-3 sm:pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#000000] text-white text-xs font-bold hover:bg-[#262626] transition-colors cursor-pointer text-center"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
