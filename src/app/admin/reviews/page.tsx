"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import {
  Search,
  Star,
  CheckCircle2,
  Trash2,
  ExternalLink,
  RefreshCw,
  Filter,
  Download,
  ShieldCheck,
  Eye,
  X,
  CheckSquare,
  Square,
  ThumbsUp,
  Calendar,
  Sparkles,
  MessageSquareQuote,
  TrendingUp,
  Award,
  AlertCircle,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AdminReviewItem, AdminReviewsResult } from "@/server/services/review.service";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [stats, setStats] = useState<AdminReviewsResult["stats"]>({
    totalReviews: 0,
    averageRating: 5.0,
    verifiedCount: 0,
    fiveStarCount: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "rating_desc" | "rating_asc" | "helpful">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Unique Products for dropdown filter
  const [productsList, setProductsList] = useState<{ id: string; name: string }[]>([]);

  // Selection & Moderation Modals State
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
  const [reviewToDetail, setReviewToDetail] = useState<AdminReviewItem | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<AdminReviewItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);

  // Add Review Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    productId: "",
    name: "",
    email: "",
    rating: 5,
    title: "",
    comment: "",
    isVerifiedBuyer: true,
  });
  const [isAddingReview, setIsAddingReview] = useState(false);

  // Load reviews from API
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (selectedRating) params.set("rating", selectedRating.toString());
      if (isVerifiedOnly) params.set("verified", "true");
      if (selectedProductId) params.set("productId", selectedProductId);
      if (sortBy) params.set("sortBy", sortBy);
      params.set("page", currentPage.toString());
      params.set("limit", pageSize.toString());

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const data: AdminReviewsResult = await res.json();

      if (res.ok) {
        setReviews(data.reviews || []);
        setTotalCount(data.pagination?.total || 0);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        toast.error("Failed to load reviews.");
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
      toast.error("Network error while loading reviews.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedRating, isVerifiedOnly, selectedProductId, sortBy, currentPage, pageSize]);

  // Initial load and product list fetch
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Fetch catalog products once for product filter dropdown and review creation
  const loadCatalogProducts = useCallback(async () => {
    try {
      let list: { id: string; name: string }[] = [];
      const res = await fetch("/api/admin/products?limit=100");
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];
        list = items.map((p: any) => ({ id: p.id, name: p.name }));
      }

      // Fallback to public products endpoint if admin response is empty
      if (list.length === 0) {
        const pubRes = await fetch("/api/products");
        if (pubRes.ok) {
          const pubData = await pubRes.json();
          const items = Array.isArray(pubData)
            ? pubData
            : Array.isArray(pubData?.products)
            ? pubData.products
            : [];
          list = items.map((p: any) => ({ id: p.id, name: p.name }));
        }
      }

      if (list.length > 0) {
        setProductsList(list);
        setAddForm((prev) => ({
          ...prev,
          productId: prev.productId || list[0].id,
        }));
      }
    } catch (err) {
      console.error("Failed to load catalog products for reviews:", err);
    }
  }, []);

  useEffect(() => {
    loadCatalogProducts();
  }, [loadCatalogProducts]);

  // Multi-select handlers
  const handleSelectAll = () => {
    if (selectedReviewIds.length === reviews.length) {
      setSelectedReviewIds([]);
    } else {
      setSelectedReviewIds(reviews.map((r) => r.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedReviewIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Delete single review
  const handleConfirmDeleteSingle = async () => {
    if (!reviewToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/reviews/${reviewToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Review deleted successfully.");
        setReviews((prev) => prev.filter((r) => r.id !== reviewToDelete.id));
        setReviewToDelete(null);
        if (reviewToDetail?.id === reviewToDelete.id) {
          setReviewToDetail(null);
        }
        fetchReviews();
      } else {
        toast.error(data.message || "Failed to delete review.");
      }
    } catch {
      toast.error("Error deleting review.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Batch delete reviews
  const handleConfirmBatchDelete = async () => {
    if (selectedReviewIds.length === 0) return;
    setIsBatchDeleting(true);

    try {
      const res = await fetch("/api/admin/reviews/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewIds: selectedReviewIds }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`Successfully removed ${data.deletedCount || selectedReviewIds.length} reviews.`);
        setSelectedReviewIds([]);
        setShowBatchDeleteDialog(false);
        fetchReviews();
      } else {
        toast.error(data.message || "Batch deletion failed.");
      }
    } catch {
      toast.error("Error processing batch deletion.");
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // Manual Add Review submit handler
  const handleAddReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.productId || !addForm.name.trim() || !addForm.comment.trim()) {
      toast.error("Please fill in all required review fields (product, reviewer name, comment).");
      return;
    }

    setIsAddingReview(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Review published successfully!");
        setShowAddModal(false);
        setAddForm({
          productId: productsList[0]?.id || "",
          name: "",
          email: "",
          rating: 5,
          title: "",
          comment: "",
          isVerifiedBuyer: true,
        });
        fetchReviews();
      } else {
        toast.error(data.message || "Failed to publish review.");
      }
    } catch {
      toast.error("Network error while creating review.");
    } finally {
      setIsAddingReview(false);
    }
  };

  // Export CSV of currently filtered reviews
  const handleExportCSV = () => {
    if (reviews.length === 0) {
      toast.info("No reviews available to export.");
      return;
    }

    const headers = [
      "Review ID",
      "Product Name",
      "Product Slug",
      "Reviewer Name",
      "Reviewer Email",
      "Rating",
      "Title",
      "Comment",
      "Verified Buyer",
      "Helpful Votes",
      "Date",
    ];

    const rows = reviews.map((r) => [
      `"${r.id}"`,
      `"${(r.product.name || "").replace(/"/g, '""')}"`,
      `"${r.product.slug}"`,
      `"${(r.name || "").replace(/"/g, '""')}"`,
      `"${r.email || ""}"`,
      r.rating,
      `"${(r.title || "").replace(/"/g, '""')}"`,
      `"${(r.comment || "").replace(/"/g, '""')}"`,
      r.isVerifiedBuyer ? "YES" : "NO",
      r.helpfulCount || 0,
      `"${r.date || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `filayoruba-reviews-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Reviews export downloaded.");
  };

  const verifiedPercentage =
    stats.totalReviews > 0 ? Math.round((stats.verifiedCount / stats.totalReviews) * 100) : 100;
  const fiveStarPercentage =
    stats.totalReviews > 0 ? Math.round((stats.fiveStarCount / stats.totalReviews) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumbs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 lg:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#FED501] mb-1">
            <MessageSquareQuote className="w-4 h-4" />
            <span>Storefront Moderation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#000000] tracking-tight">
            Customer Reviews & Ratings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage verified patron reviews, moderate feedback, and inspect cap rating distributions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (productsList.length === 0) {
                loadCatalogProducts();
              } else if (!addForm.productId) {
                setAddForm((prev) => ({ ...prev, productId: productsList[0].id }));
              }
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#FED501]" />
            <span>Add Review</span>
          </button>

          <button
            type="button"
            onClick={fetchReviews}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh reviews"
            aria-label="Refresh reviews"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-slate-900" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Reviews */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Reviews
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-[#000000]">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#000000]">
            {stats.totalReviews.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across active catalog
          </span>
        </div>

        {/* Card 2: Store Average Rating */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Average Rating
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#000000]">
              {stats.averageRating.toFixed(1)}
            </p>
            <div className="flex items-center text-[#FED501] text-xs">
              {"★".repeat(Math.round(stats.averageRating))}
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Storewide customer satisfaction
          </span>
        </div>

        {/* Card 3: Verified Deliveries */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Delivered Patrons
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#000000]">
            {stats.verifiedCount.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            {verifiedPercentage}% verified delivered
          </span>
        </div>

        {/* Card 4: 5-Star Share */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              5-Star Excellence
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#000000]">
            {fiveStarPercentage}%
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {stats.fiveStarCount} perfect reviews
          </span>
        </div>
      </div>

      {/* 3. Rating Distribution Visualizer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FED501]" />
            Star Rating Distribution
          </h2>
          <span className="text-xs text-slate-400">Click a bar to filter</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = stats.distribution[star] || 0;
            const pct = stats.percentages[star] || 0;
            const isSelected = selectedRating === star;

            return (
              <button
                key={star}
                type="button"
                onClick={() => {
                  setSelectedRating(isSelected ? undefined : star);
                  setCurrentPage(1);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200/70 text-slate-900"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1 font-bold">
                    <span>{star}</span>
                    <Star className={`w-3.5 h-3.5 fill-[#FED501] text-[#FED501]`} />
                  </div>
                  <span className={`font-mono text-[11px] ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200/70 overflow-hidden">
                  <div
                    className="h-full bg-[#FED501] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Search, Filters & Bulk Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search reviewer, email, cap, comment..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#000000] placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Product Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedProductId || ""}
              onChange={(e) => {
                setSelectedProductId(e.target.value || undefined);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#000000] cursor-pointer"
            >
              <option value="">
                {productsList.length > 0
                  ? `All Catalog Products (${productsList.length})`
                  : "All Catalog Products"}
              </option>
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedRating || ""}
              onChange={(e) => {
                setSelectedRating(e.target.value ? parseInt(e.target.value, 10) : undefined);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#000000] cursor-pointer"
            >
              <option value="">All Star Scores</option>
              <option value="5">5 Stars Only</option>
              <option value="4">4 Stars Only</option>
              <option value="3">3 Stars Only</option>
              <option value="2">2 Stars Only</option>
              <option value="1">1 Star Only</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="lg:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#000000] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating_desc">Highest Rating</option>
              <option value="rating_asc">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>

        {/* Filter Pills & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsVerifiedOnly(!isVerifiedOnly);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isVerifiedOnly
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Delivered Buyers Only</span>
            </button>

            {(search || selectedRating || selectedProductId || isVerifiedOnly || sortBy !== "newest") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedRating(undefined);
                  setSelectedProductId(undefined);
                  setIsVerifiedOnly(false);
                  setSortBy("newest");
                  setCurrentPage(1);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Batch Selection Action Bar */}
          {selectedReviewIds.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs">
              <span className="font-semibold">{selectedReviewIds.length} selected</span>
              <button
                type="button"
                onClick={() => setShowBatchDeleteDialog(true)}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Selected</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Reviews Table / Card View */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-slate-800 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Retrieving customer reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <MessageSquareQuote className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Reviews Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || selectedRating || selectedProductId || isVerifiedOnly
                ? "No reviews match your current filters. Try resetting your search or criteria."
                : "No customer reviews have been submitted yet. Click 'Add Review' to manually add a review, or wait for delivered patrons."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label="Select all reviews"
                    >
                      {selectedReviewIds.length === reviews.length && reviews.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-slate-900" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-3 min-w-[180px]">Reviewer</th>
                  <th className="py-3.5 px-3 min-w-[180px]">Product</th>
                  <th className="py-3.5 px-3 min-w-[120px]">Rating</th>
                  <th className="py-3.5 px-3 min-w-[280px]">Review Comment</th>
                  <th className="py-3.5 px-3 min-w-[100px]">Date</th>
                  <th className="py-3.5 pr-4 pl-2 text-right min-w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {reviews.map((review) => {
                  const isSelected = selectedReviewIds.includes(review.id);

                  return (
                    <tr
                      key={review.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-amber-50/30" : ""
                      }`}
                    >
                      {/* Select Checkbox */}
                      <td className="py-3.5 pl-4 pr-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(review.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                          aria-label={`Select review by ${review.name}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-slate-900" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Reviewer Details */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#000000] text-[#FED501] font-bold flex items-center justify-center text-xs shrink-0">
                            {review.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">
                              {review.name}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {review.email || "Guest"}
                            </span>
                            {review.isVerifiedBuyer && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5">
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Delivered Buyer
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Product Preview */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                            <ImageWithFallback
                              src={review.product.images?.[0]}
                              alt={review.product.name}
                              fill
                              className="object-cover"
                              fallbackTitle={review.product.name}
                              fallbackVariant="sm"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/products/${review.product.slug}`}
                              target="_blank"
                              className="font-bold text-slate-900 hover:underline truncate block"
                            >
                              {review.product.name}
                            </Link>
                            <span className="text-[11px] text-slate-500 font-mono">
                              ₦{review.product.price.toLocaleString("en-NG")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rating Score */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <div className="flex items-center text-[#FED501]">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < review.rating ? "fill-[#FED501]" : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-bold text-slate-800 ml-1">
                            {review.rating}.0
                          </span>
                        </div>
                      </td>

                      {/* Review Title & Comment */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5 max-w-sm">
                          {review.title && (
                            <div className="font-bold text-slate-900 line-clamp-1">
                              {review.title}
                            </div>
                          )}
                          <p className="text-slate-600 line-clamp-2 leading-relaxed text-[11px]">
                            {review.comment}
                          </p>
                          {review.helpfulCount ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                              <ThumbsUp className="w-2.5 h-2.5 text-slate-500" />
                              {review.helpfulCount} helpful
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {review.date ||
                          (review.createdAt ? review.createdAt.split("T")[0] : "-")}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-4 pl-2 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setReviewToDetail(review)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View review details"
                            aria-label="View review details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setReviewToDelete(review)}
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete review"
                            aria-label="Delete review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalCount > pageSize && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <AdminPagination
              currentPage={currentPage}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              itemLabel="reviews"
            />
          </div>
        )}
      </div>

      {/* 6. Add Manual Review Modal (Admin) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#000000] text-[#FED501]">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#000000]">
                    Add Customer Review
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Publish verified feedback from VIP orders, WhatsApp, or showroom buyers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddReviewSubmit} className="space-y-4 text-xs">
              {/* Product Select */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Product / Cap <span className="text-red-500">*</span>
                </label>
                <select
                  value={addForm.productId}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, productId: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#000000] cursor-pointer"
                >
                  <option value="" disabled>
                    {productsList.length === 0 ? "Loading catalog caps..." : "Select a cap from catalog..."}
                  </option>
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {productsList.length === 0 && (
                  <button
                    type="button"
                    onClick={loadCatalogProducts}
                    className="text-[11px] text-amber-700 font-semibold underline mt-1 cursor-pointer block"
                  >
                    Click to refresh catalog caps list
                  </button>
                )}
              </div>

              {/* Reviewer Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Patron / Reviewer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Chief Adeleke O."
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#000000]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Patron Email <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="patron@example.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#000000]"
                  />
                </div>
              </div>

              {/* Star Rating Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Rating Score: <strong className="text-[#000000]">{addForm.rating} Stars</strong>
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setAddForm((prev) => ({ ...prev, rating: star }))}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= addForm.rating
                            ? "fill-[#FED501] text-[#FED501]"
                            : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Review Headline / Title <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={addForm.title}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Masterpiece craft, perfectly holds fold"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#000000]"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Review Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={addForm.comment}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, comment: e.target.value }))}
                  placeholder="Write the customer's feedback on fabric, weave, fitting, and presentation..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#000000] leading-relaxed"
                />
              </div>

              {/* Verified Buyer Checkbox */}
              <div className="flex items-center gap-2 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                <input
                  id="mark-verified"
                  type="checkbox"
                  checked={addForm.isVerifiedBuyer}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, isVerifiedBuyer: e.target.checked }))}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="mark-verified" className="text-xs font-semibold text-emerald-900 cursor-pointer">
                  Mark with &quot;Verified Delivered Buyer&quot; badge
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isAddingReview}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingReview}
                  className="px-5 py-2 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isAddingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Review Details Modal */}
      {reviewToDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-100 text-[#000000]">
                  <MessageSquareQuote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#000000]">
                    Review Details
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {reviewToDetail.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewToDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reviewer Profile */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#000000] text-[#FED501] font-bold flex items-center justify-center text-sm">
                  {reviewToDetail.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-xs">
                    {reviewToDetail.name}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {reviewToDetail.email || "No email on record"}
                  </span>
                </div>
              </div>
              {reviewToDetail.isVerifiedBuyer && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Delivered Buyer
                </span>
              )}
            </div>

            {/* Product Card */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0">
                  <ImageWithFallback
                    src={reviewToDetail.product.images?.[0]}
                    alt={reviewToDetail.product.name}
                    fill
                    className="object-cover"
                    fallbackTitle={reviewToDetail.product.name}
                    fallbackVariant="sm"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {reviewToDetail.product.name}
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    ₦{reviewToDetail.product.price.toLocaleString("en-NG")}
                  </span>
                </div>
              </div>
              <Link
                href={`/products/${reviewToDetail.product.slug}`}
                target="_blank"
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Store</span>
              </Link>
            </div>

            {/* Rating & Comment Body */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[#FED501]">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < reviewToDetail.rating ? "fill-[#FED501]" : "text-slate-200"
                      }`}
                    />
                  ))}
                  <span className="font-bold text-slate-900 text-xs ml-1.5">
                    {reviewToDetail.rating}.0 / 5.0
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {reviewToDetail.date || (reviewToDetail.createdAt?.split("T")[0] ?? "")}
                </span>
              </div>

              {reviewToDetail.title && (
                <h4 className="text-sm font-bold text-slate-900 pt-1">
                  {reviewToDetail.title}
                </h4>
              )}

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                {reviewToDetail.comment}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const toDelete = reviewToDetail;
                  setReviewToDetail(null);
                  setReviewToDelete(toDelete);
                }}
                className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Review</span>
              </button>

              <button
                type="button"
                onClick={() => setReviewToDetail(null)}
                className="px-4 py-2 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Single Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleConfirmDeleteSingle}
        title="Delete Customer Review"
        description={`Are you sure you want to permanently delete this ${reviewToDelete?.rating}-star review by "${reviewToDelete?.name}"? The average rating for "${reviewToDelete?.product.name}" will be automatically recalculated.`}
        confirmLabel="Delete Review"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* 9. Batch Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showBatchDeleteDialog}
        onClose={() => setShowBatchDeleteDialog(false)}
        onConfirm={handleConfirmBatchDelete}
        title="Delete Selected Reviews"
        description={`Are you sure you want to permanently delete ${selectedReviewIds.length} customer reviews? Average ratings for all affected products will be recalculated automatically.`}
        confirmLabel={`Delete ${selectedReviewIds.length} Reviews`}
        variant="danger"
        isLoading={isBatchDeleting}
        itemCount={selectedReviewIds.length}
      />
    </div>
  );
}
