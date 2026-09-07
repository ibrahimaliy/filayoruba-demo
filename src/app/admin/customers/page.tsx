"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  Sparkles,
  Crown,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  Download,
  Copy,
  Check,
  Ruler,
  TrendingUp,
  Award,
  Users,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  MessageCircle,
  Clock,
  ChevronDown,
  ArrowUpDown,
  FileText,
  Save,
  Trash2,
  Share2,
} from "lucide-react";
import { CustomerDirectoryEntry, CustomerBookMetrics, PatronTier } from "@/server/services/customer.service";
import AdminPagination from "@/components/admin/AdminPagination";
import { toast } from "sonner";

const tierConfig: Record<
  PatronTier,
  {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    icon: typeof Crown;
    label: string;
    description: string;
  }
> = {
  "VIP Royal": {
    bg: "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent",
    text: "text-amber-900",
    border: "border-amber-300",
    badgeBg: "bg-amber-100 text-amber-900 border-amber-300",
    icon: Crown,
    label: "VIP Royal",
    description: "₦150,000+ Lifetime Spend",
  },
  "High Value": {
    bg: "bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent",
    text: "text-purple-900",
    border: "border-purple-200",
    badgeBg: "bg-purple-100 text-purple-900 border-purple-200",
    icon: Award,
    label: "High Value",
    description: "₦75,000 – ₦149,999 Spend",
  },
  "Returning Patron": {
    bg: "bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent",
    text: "text-blue-900",
    border: "border-blue-200",
    badgeBg: "bg-blue-100 text-blue-900 border-blue-200",
    icon: TrendingUp,
    label: "Returning",
    description: "2+ Completed Orders",
  },
  "New Patron": {
    bg: "bg-gradient-to-br from-slate-500/5 to-transparent",
    text: "text-slate-700",
    border: "border-slate-200",
    badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Users,
    label: "New Patron",
    description: "First-time buyer",
  },
};

export default function AdminCustomerBookPage() {
  const [customers, setCustomers] = useState<CustomerDirectoryEntry[]>([]);
  const [metrics, setMetrics] = useState<CustomerBookMetrics>({
    totalCustomers: 0,
    vipCount: 0,
    totalRevenue: 0,
    averageLtv: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"spend" | "orders" | "recent" | "name">("spend");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDirectoryEntry | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<"overview" | "orders" | "addresses" | "notes">("overview");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customerNotes, setCustomerNotes] = useState<Record<string, string>>({});
  const [currentNoteInput, setCurrentNoteInput] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        setMetrics(data.metrics || { totalCustomers: 0, vipCount: 0, totalRevenue: 0, averageLtv: 0 });
      }
    } catch (err) {
      console.error("Failed to load customer directory:", err);
      toast.error("Customer Sync Failed", {
        description: "Error loading customer book.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // Load local patron notes
    try {
      const savedNotes = localStorage.getItem("filayoruba_patron_notes") || localStorage.getItem("tradedge_patron_notes");
      if (savedNotes) {
        setCustomerNotes(JSON.parse(savedNotes));
      }
    } catch { }
  }, []);

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success("Copied to Clipboard", {
      description: `${label} copied successfully.`,
    });
  };

  const formatNaira = (amount: number) => {
    return `₦${(amount || 0).toLocaleString("en-NG")}`;
  };

  // Save notes for a specific customer
  const handleSaveNote = (customerId: string) => {
    const updated = { ...customerNotes, [customerId]: currentNoteInput };
    setCustomerNotes(updated);
    try {
      localStorage.setItem("filayoruba_patron_notes", JSON.stringify(updated));
    } catch { }
    toast.success("Note Saved", {
      description: "Private patron note saved successfully.",
    });
  };

  // Batch Select Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCustomers.map((c) => c.id || c.email));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const copySelectedEmails = () => {
    const emails = customers
      .filter((c) => selectedIds.includes(c.id || c.email))
      .map((c) => c.email)
      .filter(Boolean)
      .join(", ");

    if (!emails) {
      toast.info("No Emails Selected", {
        description: "Select one or more patrons to copy emails.",
      });
      return;
    }

    navigator.clipboard.writeText(emails);
    toast.success("Emails Copied", {
      description: `Copied ${selectedIds.length} patron email(s) for mailing list!`,
    });
  };

  const exportCSV = (subset?: CustomerDirectoryEntry[]) => {
    const dataToExport = subset || customers;
    if (dataToExport.length === 0) {
      toast.info("Export Info", {
        description: "No customer records to export.",
      });
      return;
    }

    const headers = [
      "Full Name",
      "Email",
      "Phone",
      "Tier",
      "Total Orders",
      "Total Spent (NGN)",
      "Average Order Value (NGN)",
      "Preferred Sizes",
      "First Order Date",
      "Last Order Date",
      "Primary City",
      "Primary State",
      "Notes",
    ];

    const rows = dataToExport.map((c) => {
      const primaryAddr = c.addresses[0];
      const note = customerNotes[c.id || c.email] || "";
      return [
        `"${c.fullName.replace(/"/g, '""')}"`,
        `"${c.email}"`,
        `"${c.phone}"`,
        `"${c.tier}"`,
        c.totalOrders,
        c.totalSpent,
        c.averageOrderValue,
        `"${c.preferredSizes.join(", ")}"`,
        `"${c.firstOrderDate ? new Date(c.firstOrderDate).toLocaleDateString("en-NG") : ""}"`,
        `"${c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("en-NG") : ""}"`,
        `"${primaryAddr?.city || ""}"`,
        `"${primaryAddr?.state || ""}"`,
        `"${note.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Fila_Yoruba_Customer_Book_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Export Complete", {
      description: `Exported ${dataToExport.length} patron records to CSV.`,
    });
  };

  // Open inspection drawer
  const openCustomerDossier = (customer: CustomerDirectoryEntry) => {
    setSelectedCustomer(customer);
    setActiveDrawerTab("overview");
    setCurrentNoteInput(customerNotes[customer.id || customer.email] || "");
  };

  // Filter and Sort Customers
  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    // 1. Tier Filter
    if (tierFilter !== "all") {
      list = list.filter((c) => c.tier.toLowerCase() === tierFilter.toLowerCase());
    }

    // 2. Search Query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((c) => {
        const nameMatch = c.fullName.toLowerCase().includes(q);
        const emailMatch = c.email.toLowerCase().includes(q);
        const phoneMatch = c.phone.toLowerCase().includes(q);
        const addressMatch = c.addresses.some(
          (a) =>
            a.address.toLowerCase().includes(q) ||
            a.city.toLowerCase().includes(q) ||
            a.state.toLowerCase().includes(q)
        );
        const orderMatch = c.orders.some((o) => o.orderNumber.toLowerCase().includes(q));

        return nameMatch || emailMatch || phoneMatch || addressMatch || orderMatch;
      });
    }

    // 3. Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "spend") {
        comparison = b.totalSpent - a.totalSpent || b.totalOrders - a.totalOrders;
      } else if (sortBy === "orders") {
        comparison = b.totalOrders - a.totalOrders || b.totalSpent - a.totalSpent;
      } else if (sortBy === "recent") {
        const dateA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
        const dateB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
        comparison = dateB - dateA;
      } else if (sortBy === "name") {
        comparison = a.fullName.localeCompare(b.fullName);
      }

      return sortOrder === "asc" ? -comparison : comparison;
    });

    return list;
  }, [customers, tierFilter, search, sortBy, sortOrder]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [tierFilter, search, sortBy, sortOrder, viewMode]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  const tierCounts = useMemo(() => {
    return {
      all: customers.length,
      vip: customers.filter((c) => c.tier === "VIP Royal").length,
      high: customers.filter((c) => c.tier === "High Value").length,
      returning: customers.filter((c) => c.tier === "Returning Patron").length,
      new: customers.filter((c) => c.tier === "New Patron").length,
    };
  }, [customers]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in relative pb-20">
      {/* Header & Quick Action Suite */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#FED501] mb-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Patron Relationship Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#000000] tracking-tight">
            Customer Book & Patron Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete CRM repository containing verified patron contact profiles, bespoke cap sizing archives, LTV metrics, and order histories.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-auto flex-wrap">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === "table"
                  ? "bg-white text-[#000000] shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
                }`}
              title="Table View"
            >
              <List size={14} />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === "grid"
                  ? "bg-white text-[#000000] shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
                }`}
              title="Dossier Grid View"
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Dossier</span>
            </button>
          </div>

          <button
            onClick={() => exportCSV()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold shadow-md shadow-[#000000]/10 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#FED501] ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Book</span>
          </button>
        </div>
      </div>

      {/* 4 Luxury Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Patrons */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Patrons</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#000000] tracking-tight">
            {metrics.totalCustomers}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Verified Customer Profiles</span>
            <span className="text-emerald-600 font-bold">100% Synced</span>
          </div>
        </div>

        {/* VIP Royal Patrons */}
        <div className="bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-5 rounded-2xl border border-amber-200 shadow-sm space-y-2 relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">VIP Royal Patrons</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-xs">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 tracking-tight">
            {metrics.vipCount}
          </div>
          <div className="text-[11px] text-amber-800/80 flex items-center justify-between">
            <span>High-Value Patrons (₦75k+)</span>
            <span className="font-bold">
              {metrics.totalCustomers > 0
                ? `${Math.round((metrics.vipCount / metrics.totalCustomers) * 100)}% of base`
                : "0%"}
            </span>
          </div>
        </div>

        {/* Total Lifetime Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Customer Lifetime Value</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
            {formatNaira(metrics.totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Cumulative Fìlà Revenue</span>
            <span className="text-emerald-600 font-bold">₦ Gross</span>
          </div>
        </div>

        {/* Average LTV */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Average Patron Value</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#000000] tracking-tight">
            {formatNaira(metrics.averageLtv)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Avg Revenue / Customer</span>
            <span className="text-purple-600 font-bold">LTV Bench</span>
          </div>
        </div>
      </div>

      {/* Interactive Segment Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setTierFilter("all")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${tierFilter === "all"
              ? "bg-[#000000] text-white border-[#000000] shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
        >
          <span>All Patrons</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${tierFilter === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
            {tierCounts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTierFilter("vip royal")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${tierFilter === "vip royal"
              ? "bg-amber-600 text-white border-amber-600 shadow-sm"
              : "bg-white text-amber-800 border-amber-200 hover:bg-amber-50/50"
            }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          <span>VIP Royal</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${tierFilter === "vip royal" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>
            {tierCounts.vip}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTierFilter("high value")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${tierFilter === "high value"
              ? "bg-purple-700 text-white border-purple-700 shadow-sm"
              : "bg-white text-purple-800 border-purple-200 hover:bg-purple-50/50"
            }`}
        >
          <Award className="w-3.5 h-3.5 text-purple-500" />
          <span>High Value</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${tierFilter === "high value" ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800"}`}>
            {tierCounts.high}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTierFilter("returning patron")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${tierFilter === "returning patron"
              ? "bg-blue-700 text-white border-blue-700 shadow-sm"
              : "bg-white text-blue-800 border-blue-200 hover:bg-blue-50/50"
            }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
          <span>Returning</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${tierFilter === "returning patron" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"}`}>
            {tierCounts.returning}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTierFilter("new patron")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${tierFilter === "new patron"
              ? "bg-slate-800 text-white border-slate-800 shadow-sm"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
        >
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>New Patrons</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${tierFilter === "new patron" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>
            {tierCounts.new}
          </span>
        </button>
      </div>

      {/* Search & Sort Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5 flex-1">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search patron name, email, phone number, city, or order FY-..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
            {/* Sort Field */}
            <div className="flex items-center gap-1.5 bg-white px-3 sm:px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs hover:border-[#FED501]/60 focus-within:border-[#FED501] focus-within:ring-2 focus-within:ring-[#FED501]/20 transition-all">
              <span className="text-[11px] font-bold text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "spend" | "orders" | "recent" | "name")}
                className="bg-transparent text-xs font-bold text-[#000000] focus:outline-none cursor-pointer pr-6"
              >
                <option value="spend">Highest Spend (LTV)</option>
                <option value="orders">Total Orders</option>
                <option value="recent">Recently Active</option>
                <option value="name">Patron Name (A–Z)</option>
              </select>

              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                className="p-1 text-slate-400 hover:text-[#FED501] cursor-pointer transition-colors"
                title={sortOrder === "desc" ? "Descending" : "Ascending"}
              >
                <ArrowUpDown size={13} className={sortOrder === "asc" ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(tierFilter !== "all" || search) && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs">
            <span className="text-slate-400">
              Showing <strong>{filteredCustomers.length}</strong> of {customers.length} patrons
            </span>

            {tierFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#000000] text-white text-[11px] font-semibold">
                <span>Tier: {tierFilter.toUpperCase()}</span>
                <button type="button" onClick={() => setTierFilter("all")} className="hover:text-[#FED501] ml-1 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}

            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[11px] font-semibold">
                <span>Search: &ldquo;{search}&rdquo;</span>
                <button type="button" onClick={() => setSearch("")} className="hover:text-red-600 ml-1 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                setTierFilter("all");
                setSearch("");
              }}
              className="text-[11px] font-bold text-[#FED501] hover:underline cursor-pointer ml-auto"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Floating Multi-Select Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-30 bg-[#000000] text-white p-3 sm:px-5 sm:py-3 rounded-2xl shadow-2xl border border-[#FED501] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 animate-fade-down">
          <div className="flex items-center gap-2.5">
            <span className="bg-[#FED501] text-[#000000] font-black text-xs px-2.5 py-1 rounded-lg">
              {selectedIds.length} Selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-white/70 hover:text-white underline cursor-pointer"
            >
              Clear Selection
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={copySelectedEmails}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors cursor-pointer"
            >
              <Copy size={13} className="text-[#FED501]" />
              <span>Copy Emails</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const subset = customers.filter((c) => selectedIds.includes(c.id || c.email));
                exportCSV(subset);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FED501] text-[#000000] hover:bg-[#EAB308] text-xs font-black transition-colors cursor-pointer shadow-sm"
            >
              <Download size={13} />
              <span>Export</span>
            </button>
          </div>
        </div>
      )}

      {/* View Mode: 1. TABLE VIEW */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-slate-300" />
              Compiling customer book directory...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-20 text-center">
              <BookUserIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-700">No patron records found</h3>
              <p className="text-xs text-slate-400 mt-1">
                {search || tierFilter !== "all"
                  ? "Try adjusting your search query or tier filters."
                  : "Customer records will automatically populate as orders are loomed and placed."}
              </p>
            </div>
          ) : (
            <>
              {/* 1. MOBILE CARD LIST (< md screens) */}
              <div className="divide-y divide-slate-100 md:hidden">
                {/* Select All on Mobile */}
                <div className="p-3 bg-slate-50/90 flex items-center justify-between border-b border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer"
                  >
                    {selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0 ? (
                      <CheckSquare size={16} className="text-[#000000]" />
                    ) : (
                      <Square size={16} className="text-slate-400" />
                    )}
                    <span>Select All ({filteredCustomers.length})</span>
                  </button>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {selectedIds.length} chosen
                  </span>
                </div>

                {paginatedCustomers.map((customer) => {
                  const tier = tierConfig[customer.tier] || tierConfig["New Patron"];
                  const isSelected = selectedIds.includes(customer.id || customer.email);
                  const note = customerNotes[customer.id || customer.email];

                  return (
                    <div
                      key={customer.id || customer.email}
                      className={`p-3.5 space-y-2.5 transition-colors ${isSelected ? "bg-amber-50/30" : "hover:bg-slate-50/60"
                        }`}
                      onClick={() => openCustomerDossier(customer)}
                    >
                      {/* Top row: Checkbox, Avatar, Name, Tier Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectOne(customer.id || customer.email);
                            }}
                            className="p-1 -ml-1 text-slate-400 hover:text-[#000000] cursor-pointer mt-0.5"
                          >
                            {isSelected ? (
                              <CheckSquare size={16} className="text-[#000000]" />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>

                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#000000] to-[#16365C] text-white flex items-center justify-center font-serif font-bold text-sm shadow-sm shrink-0">
                            {customer.firstName[0]}
                            {customer.lastName[0]}
                          </div>

                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{customer.fullName}</span>
                              {note && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Has artisan notes" />
                              )}
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold border mt-0.5 ${tier.badgeBg}`}
                            >
                              <Crown className="w-2.5 h-2.5" />
                              <span>{customer.tier}</span>
                            </span>
                          </div>
                        </div>

                        {/* Inspect Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCustomerDossier(customer);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#000000] hover:bg-[#1A1A1A] text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-[#FED501]" />
                          <span>Dossier</span>
                        </button>
                      </div>

                      {/* Contact row */}
                      <div className="text-xs text-slate-600 flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <a
                          href={`mailto:${customer.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="truncate max-w-[170px] flex items-center gap-1 hover:text-[#000000]"
                        >
                          <Mail size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </a>

                        {customer.phone && customer.phone !== "—" && (
                          <a
                            href={`tel:${customer.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-[#000000] flex items-center gap-1 shrink-0"
                          >
                            <Phone size={12} className="text-slate-400 shrink-0" />
                            <span>{customer.phone}</span>
                          </a>
                        )}
                      </div>

                      {/* Metric Strip */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Lifetime Spend</span>
                          <span className="font-extrabold text-[#000000] text-xs">
                            {formatNaira(customer.totalSpent)}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Orders</span>
                          <span className="font-bold text-slate-800 text-xs">
                            {customer.totalOrders}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Top Size</span>
                          <span className="font-bold text-slate-800 text-xs truncate block">
                            {customer.preferredSizes[0] ? `${customer.preferredSizes[0]}″` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. DESKTOP MULTI-COLUMN TABLE (>= md screens) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-4 px-4 w-10 text-center">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Select All"
                        >
                          {selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0 ? (
                            <CheckSquare size={16} className="text-[#000000]" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </th>
                      <th className="py-4 px-4">Patron Dossier</th>
                      <th className="py-4 px-4">Contact & Delivery Hub</th>
                      <th className="py-4 px-4">Bespoke Size Profile</th>
                      <th className="py-4 px-4 text-center">Orders</th>
                      <th className="py-4 px-4">Lifetime Spend (LTV)</th>
                      <th className="py-4 px-4">Last Activity</th>
                      <th className="py-4 px-4 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedCustomers.map((customer) => {
                      const tier = tierConfig[customer.tier] || tierConfig["New Patron"];
                      const primaryAddr = customer.addresses[0];
                      const isSelected = selectedIds.includes(customer.id || customer.email);
                      const note = customerNotes[customer.id || customer.email];

                      return (
                        <tr
                          key={customer.id || customer.email}
                          className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${isSelected ? "bg-amber-50/30" : ""
                            }`}
                          onClick={() => openCustomerDossier(customer)}
                        >
                          {/* Checkbox */}
                          <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => toggleSelectOne(customer.id || customer.email)}
                              className="text-slate-400 hover:text-[#000000] cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare size={16} className="text-[#000000]" />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </td>

                          {/* Patron Dossier */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#000000] to-[#16365C] text-white flex items-center justify-center font-serif font-bold text-sm shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                                {customer.firstName[0]}
                                {customer.lastName[0]}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-sm group-hover:text-[#FED501] transition-colors flex items-center gap-1.5 truncate">
                                  <span>{customer.fullName}</span>
                                  {note && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Has artisan notes" />
                                  )}
                                </div>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold border mt-0.5 ${tier.badgeBg}`}
                                >
                                  <Crown className="w-2.5 h-2.5" />
                                  <span>{customer.tier}</span>
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact & Delivery */}
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Mail size={12} className="text-slate-400 shrink-0" />
                                <span className="truncate max-w-[170px]">{customer.email}</span>
                              </div>
                              {customer.phone && customer.phone !== "—" && (
                                <div className="flex items-center gap-1.5 text-slate-600">
                                  <Phone size={12} className="text-slate-400 shrink-0" />
                                  <span>{customer.phone}</span>
                                </div>
                              )}
                              {primaryAddr && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                  <MapPin size={11} className="text-[#FED501] shrink-0" />
                                  <span className="truncate max-w-[180px]">
                                    {primaryAddr.city}, {primaryAddr.state}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Bespoke Size Profile */}
                          <td className="py-4 px-4">
                            {customer.preferredSizes.length > 0 ? (
                              <div className="flex items-center gap-1 flex-wrap">
                                {customer.preferredSizes.map((size, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border ${idx === 0
                                        ? "bg-[#000000] text-white border-[#000000]"
                                        : "bg-slate-100 text-slate-700 border-slate-200"
                                      }`}
                                  >
                                    {size}&quot;
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">No size logged</span>
                            )}
                          </td>

                          {/* Total Orders */}
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-[#000000] font-black text-xs">
                              {customer.totalOrders}
                            </span>
                          </td>

                          {/* Lifetime Spend */}
                          <td className="py-4 px-4">
                            <div className="font-extrabold text-[#000000] text-sm">
                              {formatNaira(customer.totalSpent)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Avg: {formatNaira(customer.averageOrderValue)}
                            </div>
                          </td>

                          {/* Last Active */}
                          <td className="py-4 px-4">
                            {customer.lastOrderDate ? (
                              <div className="text-slate-600 font-semibold whitespace-nowrap">
                                {new Date(customer.lastOrderDate).toLocaleDateString("en-NG", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>

                          {/* Quick Actions */}
                          <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {customer.phone && customer.phone !== "—" && (
                                <a
                                  href={`tel:${customer.phone}`}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#000000] hover:text-white text-slate-600 transition-colors"
                                  title={`Call ${customer.phone}`}
                                >
                                  <Phone size={13} />
                                </a>
                              )}
                              <a
                                href={`mailto:${customer.email}`}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#000000] hover:text-white text-slate-600 transition-colors"
                                title={`Email ${customer.email}`}
                              >
                                <Mail size={13} />
                              </a>
                              <button
                                type="button"
                                onClick={() => openCustomerDossier(customer)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all inline-flex items-center gap-1 shadow-sm cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#FED501]" />
                                <span>Inspect</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <AdminPagination
                currentPage={currentPage}
                totalItems={filteredCustomers.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="patrons"
              />
            </>
          )}
        </div>
      )}

      {/* View Mode: 2. DOSSIER GRID CARDS VIEW */}
      {viewMode === "grid" && (
        <div>
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-slate-300" />
              Loading customer dossier cards...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
              <BookUserIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-700">No patron records match criteria</h3>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedCustomers.map((customer) => {
                  const tier = tierConfig[customer.tier] || tierConfig["New Patron"];
                  const TierIcon = tier.icon;
                  const primaryAddr = customer.addresses[0];
                  const note = customerNotes[customer.id || customer.email];

                  return (
                    <div
                      key={customer.id || customer.email}
                      onClick={() => openCustomerDossier(customer)}
                      className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-[#FED501]/60 transition-all cursor-pointer space-y-4 relative ${tier.bg}`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#000000] to-[#16365C] text-white flex items-center justify-center font-serif font-bold text-base shadow-sm">
                            {customer.firstName[0]}
                            {customer.lastName[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                              <span>{customer.fullName}</span>
                              {note && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Has artisan notes" />
                              )}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1 ${tier.badgeBg}`}
                            >
                              <TierIcon className="w-3 h-3" />
                              <span>{customer.tier}</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-400 block">LTV Spend</span>
                          <span className="text-base font-extrabold text-[#000000] block">
                            {formatNaira(customer.totalSpent)}
                          </span>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{customer.email}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(customer.email, customer.email, "Email");
                            }}
                            className="text-slate-400 hover:text-[#000000]"
                            title="Copy Email"
                          >
                            {copiedKey === customer.email ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>

                        {customer.phone && customer.phone !== "—" && (
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{customer.phone}</span>
                            </span>
                            <a
                              href={`tel:${customer.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-400 hover:text-[#000000]"
                              title="Call Phone"
                            >
                              <Phone size={13} />
                            </a>
                          </div>
                        )}

                        {primaryAddr && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate pt-0.5 border-t border-slate-200/60">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{primaryAddr.city}, {primaryAddr.state}</span>
                          </div>
                        )}
                      </div>

                      {/* Sizing & Order Metrics Strip */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Cap Sizes</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            {customer.preferredSizes.length > 0 ? (
                              customer.preferredSizes.slice(0, 2).map((s, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-[#000000]">
                                  {s}&quot;
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">None logged</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Orders</span>
                          <span className="font-bold text-[#000000] text-xs">
                            {customer.totalOrders} {customer.totalOrders === 1 ? "order" : "orders"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls for Grid View */}
              <AdminPagination
                currentPage={currentPage}
                totalItems={filteredCustomers.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="patrons"
                className="mt-6 rounded-2xl border border-slate-200"
              />
            </>
          )}
        </div>
      )}

      {/* LUXURY SLIDE-OVER PATRON DOSSIER (DRAWER) */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-full sm:max-w-xl md:max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slide-left overflow-hidden">
            {/* Slide-over Header */}
            <div className="p-4 sm:p-6 pb-0 sm:pb-0 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200 relative shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                title="Close dossier"
              >
                <X size={18} />
              </button>

              <div className="flex items-start gap-3 sm:gap-4 pr-8 sm:pr-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#000000] to-[#16365C] text-white flex items-center justify-center font-serif font-bold text-xl sm:text-2xl shadow-md shrink-0">
                  {selectedCustomer.firstName[0]}
                  {selectedCustomer.lastName[0]}
                </div>

                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-2xl font-serif font-bold text-[#000000] truncate">
                      {selectedCustomer.fullName}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border ${tierConfig[selectedCustomer.tier]?.badgeBg
                        }`}
                    >
                      <Crown className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                      <span>{selectedCustomer.tier}</span>
                    </span>
                  </div>

                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Patron Since:{" "}
                    <strong>
                      {new Date(selectedCustomer.firstOrderDate || Date.now()).toLocaleDateString("en-NG", {
                        month: "long",
                        year: "numeric",
                      })}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Drawer Navigation Tabs - Horizontal Scroll on Mobile */}
              <div className="flex items-center gap-1 sm:gap-2 mt-4 sm:mt-6 border-b border-slate-200/80 overflow-x-auto scrollbar-none -mb-px">
                <button
                  type="button"
                  onClick={() => setActiveDrawerTab("overview")}
                  className={`pb-3 px-2.5 sm:px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${activeDrawerTab === "overview"
                      ? "border-[#000000] text-[#000000]"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                >
                  <Users size={14} />
                  <span>Overview & Metrics</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDrawerTab("orders")}
                  className={`pb-3 px-2.5 sm:px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${activeDrawerTab === "orders"
                      ? "border-[#000000] text-[#000000]"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                >
                  <ShoppingBag size={14} />
                  <span>Order Timeline ({selectedCustomer.orders.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDrawerTab("addresses")}
                  className={`pb-3 px-2.5 sm:px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${activeDrawerTab === "addresses"
                      ? "border-[#000000] text-[#000000]"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                >
                  <MapPin size={14} />
                  <span>Address Book ({selectedCustomer.addresses.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDrawerTab("notes")}
                  className={`pb-3 px-2.5 sm:px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${activeDrawerTab === "notes"
                      ? "border-[#000000] text-[#000000]"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                >
                  <FileText size={14} />
                  <span>Artisan Notes</span>
                  {customerNotes[selectedCustomer.id || selectedCustomer.email] && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Slide-over Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* TAB 1: OVERVIEW */}
              {activeDrawerTab === "overview" && (
                <div className="space-y-6 animate-fade-in">
                  {/* Contact Action Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Address</span>
                        <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">
                          {selectedCustomer.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedCustomer.email, "drawer-email", "Email")}
                          className="p-1.5 text-slate-400 hover:text-[#000000] rounded"
                          title="Copy Email"
                        >
                          {copiedKey === "drawer-email" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                        <a
                          href={`mailto:${selectedCustomer.email}`}
                          className="p-1.5 text-[#000000] hover:text-[#FED501] rounded"
                          title="Send Email"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone Number</span>
                        <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">
                          {selectedCustomer.phone}
                        </span>
                      </div>
                      {selectedCustomer.phone && selectedCustomer.phone !== "—" && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedCustomer.phone, "drawer-phone", "Phone")}
                            className="p-1.5 text-slate-400 hover:text-[#000000] rounded"
                            title="Copy Phone"
                          >
                            {copiedKey === "drawer-phone" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                          <a
                            href={`tel:${selectedCustomer.phone}`}
                            className="p-1.5 text-[#000000] hover:text-[#FED501] rounded"
                            title="Call Phone"
                          >
                            <Phone size={14} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4 KPI Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Spent</span>
                      <span className="text-base sm:text-lg font-extrabold text-[#000000] block mt-0.5">
                        {formatNaira(selectedCustomer.totalSpent)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Orders</span>
                      <span className="text-base sm:text-lg font-extrabold text-[#000000] block mt-0.5">
                        {selectedCustomer.totalOrders}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Order</span>
                      <span className="text-base sm:text-lg font-extrabold text-[#000000] block mt-0.5">
                        {formatNaira(selectedCustomer.averageOrderValue)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Primary Size</span>
                      <span className="text-base sm:text-lg font-extrabold text-[#000000] block mt-0.5 truncate">
                        {selectedCustomer.preferredSizes[0] ? `${selectedCustomer.preferredSizes[0]}″` : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Sizing Breakdown Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Ruler className="w-4 h-4 text-[#FED501]" />
                        <span>Bespoke Fìlà Sizing History</span>
                      </h4>
                      <span className="text-[11px] text-slate-500">Yoruba Crown Fit</span>
                    </div>

                    {selectedCustomer.preferredSizes.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedCustomer.preferredSizes.map((size, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#000000] shadow-2xs flex items-center gap-1.5"
                          >
                            <span className="w-2 h-2 rounded-full bg-[#FED501]" />
                            <span>Size: {size}&quot;</span>
                            {idx === 0 && (
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold ml-1">
                                Most Frequent
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No head measurements logged yet.</p>
                    )}
                  </div>

                  {/* Primary Delivery Hub */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#FED501]" />
                      <span>Primary Delivery Destination</span>
                    </h4>

                    {selectedCustomer.addresses.length > 0 ? (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-0.5">
                        <p className="font-bold text-slate-800">{selectedCustomer.addresses[0].address}</p>
                        <p className="text-slate-500">
                          {selectedCustomer.addresses[0].city}, {selectedCustomer.addresses[0].state} &bull; {selectedCustomer.addresses[0].country}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No address on file.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: ORDER TIMELINE */}
              {activeDrawerTab === "orders" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Total Orders: <strong>{selectedCustomer.orders.length}</strong>
                    </span>
                    <Link
                      href={`/admin/orders?search=${encodeURIComponent(selectedCustomer.email)}`}
                      className="text-xs font-bold text-[#FED501] hover:underline flex items-center gap-1"
                    >
                      <span>Open in Order Pipeline</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>

                  {selectedCustomer.orders.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 italic bg-slate-50 rounded-2xl border border-slate-200">
                      No order records found for this patron.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCustomer.orders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 hover:border-slate-300 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-[#000000]">
                                {order.orderNumber}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                {order.status}
                              </span>
                            </div>
                            <span className="font-extrabold text-[#000000] text-sm">
                              {formatNaira(order.total)}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 font-medium">
                            {order.itemsSummary}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                            <span>
                              {new Date(order.createdAt).toLocaleDateString("en-NG", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>

                            <Link
                              href={`/admin/orders?search=${encodeURIComponent(order.orderNumber)}`}
                              className="font-bold text-[#000000] hover:text-[#FED501] hover:underline"
                            >
                              Fulfill Order →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ADDRESS BOOK */}
              {activeDrawerTab === "addresses" && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Recorded Shipping Destinations ({selectedCustomer.addresses.length})
                  </h4>

                  {selectedCustomer.addresses.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                      No shipping address recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedCustomer.addresses.map((addr, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              {idx === 0 ? "Primary Destination" : `Address #${idx + 1}`}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(
                                  `${addr.address}, ${addr.city}, ${addr.state}`,
                                  `addr-${idx}`,
                                  "Address"
                                )
                              }
                              className="text-xs text-slate-400 hover:text-[#000000] flex items-center gap-1"
                            >
                              {copiedKey === `addr-${idx}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              <span>Copy</span>
                            </button>
                          </div>

                          <p className="font-bold text-slate-800 text-xs">{addr.address}</p>
                          <p className="text-slate-500 text-xs">
                            {addr.city}, {addr.state} &bull; {addr.country}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ARTISAN NOTES */}
              {activeDrawerTab === "notes" && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Private Patron Notes
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Record bespoke artisan details, head structure preferences (e.g. left tilt, special occasion dates, preferred loom weavers).
                    </p>
                  </div>

                  <textarea
                    rows={6}
                    value={currentNoteInput}
                    onChange={(e) => setCurrentNoteInput(e.target.value)}
                    placeholder="e.g. Discerning patron. Prefers royal Gòbì folds with left tilt. Wedding scheduled for December 2026..."
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#FED501] focus:bg-white resize-none"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveNote(selectedCustomer.id || selectedCustomer.email)}
                      className="px-4 py-2.5 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Save size={14} className="text-[#FED501]" />
                      <span>Save Artisan Note</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookUserIcon(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <circle cx="12" cy="8" r="2" />
      <path d="M15 13a3 3 0 1 0-6 0" />
    </svg>
  );
}
