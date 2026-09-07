"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import Link from "next/link";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Star,
  X,
  ExternalLink,
  UploadCloud,
  Link2,
  RotateCcw,
  CheckSquare,
  Square,
  Package,
  Layers,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Product } from "@/types/product";
import { Collection } from "@/types/collection";
import ConfirmDialog, { ConfirmDialogVariant } from "@/components/admin/ConfirmDialog";
import AdminPagination from "@/components/admin/AdminPagination";
import { toast } from "sonner";

interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  collectionSlug: string;
  price: number;
  description: string;
  stock: number;
  featured: boolean;
  images: string[];
  sizes: string[];
  colors: string[];
}

const defaultFormData: ProductFormData = {
  name: "",
  slug: "",
  collectionSlug: "",
  price: 25000,
  description: "Authentic handcrafted Yoruba Fila cap tailored from premium woven threads.",
  stock: 10,
  featured: false,
  images: [],
  sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  colors: ["Navy Blue", "Gold", "Royal"],
};

export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState<"catalog" | "trash">("catalog");
  const [products, setProducts] = useState<Product[]>([]);
  const [trashedProducts, setTrashedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: ConfirmDialogVariant;
    isLoading?: boolean;
    itemCount?: number;
    highlightText?: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  });

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const json = await res.json();
        setProducts(json);
      } else {
        const err = await res.json().catch(() => ({}));
        const message = err.message || "Failed to load products from database.";
        setFetchError(message);
        toast.error("Database Connection Issue", {
          description: message,
        });
      }
    } catch (err) {
      console.error("Failed to load products:", err);
      const errMsg = "Could not reach database due to network issue.";
      setFetchError(errMsg);
      toast.error("Network Error", {
        description: errMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrash = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/products?status=trash");
      if (res.ok) {
        const json = await res.json();
        setTrashedProducts(json);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to load trashed products:", err);
      }
    } catch (err) {
      console.error("Failed to load trashed products:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const res = await fetch("/api/admin/collections");
      const data = await res.json();
      if (data.success && Array.isArray(data.collections)) {
        setAvailableCollections(data.collections);
        if (data.collections.length > 0) {
          setFormData((prev) => ({
            ...prev,
            collectionSlug: prev.collectionSlug && data.collections.some((c: Collection) => c.slug === prev.collectionSlug)
              ? prev.collectionSlug
              : data.collections[0].slug,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load collections:", err);
    }
  };

  const reloadData = () => {
    setSelectedIds([]);
    fetchCatalog();
    fetchTrash();
    fetchCollections();
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      ...defaultFormData,
      collectionSlug: availableCollections[0]?.slug || "",
    });
    setFormError(null);
    setShowUrlInput(false);
    setManualUrl("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    const matchedCol = availableCollections.find(
      (c) =>
        c.slug === p.collection?.slug ||
        c.name.toLowerCase() === p.collection?.name?.toLowerCase() ||
        c.id === (p as unknown as { collectionId?: string }).collectionId
    );
    setFormData({
      id: p.id,
      name: p.name,
      slug: p.slug,
      collectionSlug: matchedCol ? matchedCol.slug : (availableCollections[0]?.slug || ""),
      price: p.price,
      description: p.description,
      stock: p.stock,
      featured: p.featured,
      images: p.images || [],
      sizes: p.sizes,
      colors: p.colors,
    });
    setFormError(null);
    setShowUrlInput(false);
    setManualUrl("");
    setIsModalOpen(true);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const body = new FormData();
      body.append("folder", "products");
      Array.from(files).forEach((file) => {
        body.append("files", file);
      });

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...data.urls],
        }));
        toast.success("Images Uploaded", {
          description: `${files.length} product image(s) uploaded successfully!`,
        });
      } else {
        const err = await res.json();
        toast.error("Upload Error", {
          description: err.message || "Failed to upload images.",
        });
      }
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error("Upload Error", {
        description: "An unexpected error occurred while uploading file.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, manualUrl.trim()],
    }));
    setManualUrl("");
    toast.success("Image URL Added", {
      description: "Remote image URL added to cap gallery.",
    });
  };

  const handleRemoveImage = async (indexToRemove: number) => {
    const imgUrl = formData.images[indexToRemove];

    // Purge from storage if local upload or Cloudinary
    if (imgUrl && (imgUrl.startsWith("/uploads/") || imgUrl.includes("cloudinary.com"))) {
      try {
        await fetch("/api/admin/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: imgUrl }),
        });
      } catch (storageErr) {
        console.warn("Product image storage deletion warning:", storageErr);
      }
    }

    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));

    toast.success("Image deleted", {
      description: "Photo removed from gallery.",
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.price) {
      setFormError("Product title and price are required to save.");
      toast.error("Missing Information", {
        description: "Please enter product name and price.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const isEdit = Boolean(formData.id);
      const url = isEdit
        ? `/api/admin/products/${formData.id}`
        : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...formData,
        images:
          formData.images.length > 0
            ? formData.images
            : [
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
              ],
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const savedProduct = data.product;
        const savedId = savedProduct?.id || formData.id;

        toast.success(
          isEdit ? "Fìlà Cap Updated Successfully" : "New Fìlà Cap Created & Published",
          {
            description: isEdit
              ? `"${formData.name}" (₦${Number(formData.price).toLocaleString("en-NG")}) details have been updated in the catalog.`
              : `"${formData.name}" (₦${Number(formData.price).toLocaleString("en-NG")}) added with ${formData.stock} units in stock.`,
            duration: 5000,
          }
        );

        setIsModalOpen(false);
        setFormError(null);
        setActiveTab("catalog");
        setCurrentPage(1);

        if (savedId) {
          setRecentlyUpdatedId(savedId);
          setTimeout(() => {
            setRecentlyUpdatedId((prev) => (prev === savedId ? null : prev));
          }, 7000);
        }

        reloadData();
      } else {
        const errorMsg = data.message || "Could not save product changes.";
        setFormError(errorMsg);
        toast.error("Failed to Save Product", {
          description: errorMsg,
        });
      }
    } catch (err) {
      console.error("Failed to save product:", err);
      const errorMsg = "An unexpected error occurred while saving product.";
      setFormError(errorMsg);
      toast.error("Save Error", {
        description: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Selection handlers
  const currentList = activeTab === "catalog" ? products : trashedProducts;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  // Single Action Confirmation Dialogs
  const promptMoveToTrash = (product: Product) => {
    setConfirmDialog({
      isOpen: true,
      title: "Move to Trash?",
      description: `"${product.name}" will be removed from the active storefront and moved to the Trash Bin. You can restore it anytime.`,
      confirmLabel: "Move to Trash",
      variant: "danger",
      highlightText: product.name,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/products/${product.id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            toast.success("Moved to Trash", {
              description: `"${product.name}" moved to Trash Bin.`,
            });
            reloadData();
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const promptRestore = (product: Product) => {
    setConfirmDialog({
      isOpen: true,
      title: "Restore Cap to Catalog?",
      description: `"${product.name}" will be restored and will become visible on the public store again.`,
      confirmLabel: "Restore Product",
      variant: "info",
      highlightText: product.name,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/products/${product.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "restore" }),
          });
          if (res.ok) {
            toast.success("Product Restored", {
              description: `"${product.name}" restored to active catalog!`,
            });
            reloadData();
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const promptPermanentDelete = (product: Product) => {
    setConfirmDialog({
      isOpen: true,
      title: "Permanently Delete Cap?",
      description: `Are you sure you want to permanently destroy "${product.name}"? This action CANNOT be undone.`,
      confirmLabel: "Permanently Delete",
      variant: "danger",
      highlightText: "Irreversible Action",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/products/${product.id}?hard=true`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Product Deleted", {
              description: `"${product.name}" permanently wiped from database.`,
            });
            reloadData();
          } else {
            toast.error("Delete Failed", {
              description: data.message || "Failed to wipe product.",
            });
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Bulk Action Confirmation Dialogs
  const promptBulkTrash = () => {
    setConfirmDialog({
      isOpen: true,
      title: `Move ${selectedIds.length} Caps to Trash?`,
      description: "Selected products will be removed from the active store and held in the Trash Bin.",
      confirmLabel: "Move Selected to Trash",
      variant: "danger",
      itemCount: selectedIds.length,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/products/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "trash", ids: selectedIds }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Bulk Trash Complete", {
              description: data.message || `${selectedIds.length} products moved to Trash.`,
            });
            reloadData();
          } else {
            toast.error("Bulk Action Failed", {
              description: data.message || "Failed to move products to trash.",
            });
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const promptBulkRestore = () => {
    setConfirmDialog({
      isOpen: true,
      title: `Restore ${selectedIds.length} Caps?`,
      description: "Selected products will be restored back to the active catalog and store.",
      confirmLabel: "Restore Selected",
      variant: "info",
      itemCount: selectedIds.length,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/products/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "restore", ids: selectedIds }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Bulk Restore Complete", {
              description: data.message || `${selectedIds.length} products restored.`,
            });
            reloadData();
          } else {
            toast.error("Bulk Restore Failed", {
              description: data.message || "Failed to restore products.",
            });
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const promptBulkPermanentDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: `Permanently Delete ${selectedIds.length} Caps?`,
      description: "These caps will be wiped from the database. This action CANNOT be reversed.",
      confirmLabel: "Wipe Permanently",
      variant: "danger",
      itemCount: selectedIds.length,
      highlightText: "Permanent Data Loss",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/products/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete", ids: selectedIds }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Bulk Wipe Complete", {
              description: data.message || `${selectedIds.length} products permanently deleted.`,
            });
            reloadData();
          } else {
            toast.error("Bulk Delete Failed", {
              description: data.message || "Failed to permanently delete products.",
            });
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const promptEmptyTrash = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Empty Entire Trash Bin?",
      description: `All ${trashedProducts.length} items in the trash will be permanently wiped from the database.`,
      confirmLabel: "Empty Trash",
      variant: "danger",
      itemCount: trashedProducts.length,
      highlightText: "Permanent Wipe",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/products/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "empty-trash" }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Trash Emptied", {
              description: data.message || "All items in trash permanently deleted.",
            });
            reloadData();
          } else {
            toast.error("Empty Trash Failed", {
              description: data.message || "Failed to empty trash.",
            });
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleBulkFeatured = async (featured: boolean) => {
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "featured", ids: selectedIds, featured }),
      });
      if (res.ok) {
        toast.success("Featured Status Updated", {
          description: `Showcase status updated for ${selectedIds.length} products.`,
        });
        reloadData();
      }
    } catch {
      toast.error("Update Error", {
        description: "Failed to update featured status.",
      });
    }
  };

  const filteredProducts = useMemo(() => {
    return currentList.filter((p) => {
      const matchesCollection =
        selectedCollection === "all" ||
        p.collection.slug === selectedCollection;

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.collection.name.toLowerCase().includes(q);

      return matchesCollection && matchesSearch;
    });
  }, [currentList, selectedCollection, search]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedCollection, search]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const formatNaira = (amount: number) => {
    return `₦${(amount || 0).toLocaleString("en-NG")}`;
  };

  const isAllSelected =
    filteredProducts.length > 0 && selectedIds.length === filteredProducts.length;

  return (
    <div className="space-y-8 animate-fade-in relative pb-16">
      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        itemCount={confirmDialog.itemCount}
        highlightText={confirmDialog.highlightText}
      />      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#000000]">
            Product Catalog & Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage handcrafted Fila caps, photo uploads, bulk updates, and trash restoration.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={reloadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden xs:inline">Refresh</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#000000] text-white hover:bg-[#262626] text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FED501]" />
            <span>Add New Cap</span>
          </button>
        </div>
      </div>

      {/* Database Connection Alert */}
      {fetchError && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-semibold">Database Connection Issue</p>
              <p className="text-xs text-amber-700">{fetchError} Deleted items and fallback dummy data are prevented from loading.</p>
            </div>
          </div>
          <button
            onClick={reloadData}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold self-start sm:self-auto transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Tabs & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setActiveTab("catalog");
              setSelectedIds([]);
            }}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "catalog"
                ? "bg-[#000000] text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Package className="w-4 h-4" />
            Active Catalog ({products.length})
          </button>

          <button
            onClick={() => {
              setActiveTab("trash");
              setSelectedIds([]);
            }}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "trash"
                ? "bg-red-600 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-red-50 hover:text-red-600"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Trash Bin ({trashedProducts.length})
          </button>
        </div>

        {/* Search and Collection Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search title, slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-white px-3 sm:px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs hover:border-[#FED501]/60 focus-within:border-[#FED501] focus-within:ring-2 focus-within:ring-[#FED501]/20 transition-all">
            <Layers className="w-3.5 h-3.5 text-[#FED501] shrink-0" />
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#000000] focus:outline-none cursor-pointer pr-6 w-full sm:w-auto"
            >
              <option value="all">All Collections ({availableCollections.length})</option>
              {availableCollections.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {activeTab === "trash" && trashedProducts.length > 0 && (
            <button
              onClick={promptEmptyTrash}
              className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Empty Trash
            </button>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-40 bg-[#000000] text-white p-3.5 sm:px-6 sm:py-3.5 rounded-2xl shadow-2xl border border-[#FED501] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 animate-fade-down">
          <div className="flex items-center gap-3">
            <span className="bg-[#FED501] text-[#000000] font-black text-xs px-2.5 py-1 rounded-lg">
              {selectedIds.length} Selected
            </span>
            <span className="text-xs text-slate-300">
              Bulk actions:
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === "catalog" ? (
              <>
                <button
                  onClick={() => handleBulkFeatured(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" /> Feature
                </button>
                <button
                  onClick={() => handleBulkFeatured(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                >
                  Unfeature
                </button>
                <button
                  onClick={promptBulkTrash}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Move to Trash
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={promptBulkRestore}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restore Selected
                </button>
                <button
                  onClick={promptBulkPermanentDelete}
                  className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Forever
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Products Table vs Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-slate-300" />
            Loading items...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center">
            <h3 className="text-base font-bold text-slate-700">
              {activeTab === "catalog" ? "No active products found" : "Trash Bin is empty"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === "catalog"
                ? "Add a new Fila cap or restore from trash."
                : "Deleted caps will appear here for safe restoration."}
            </p>
          </div>
        ) : (
          <>
            {/* 1. MOBILE CARD LIST (< md screens) */}
            <div className="divide-y divide-slate-100 md:hidden">
              {/* Select All Row on Mobile */}
              <div className="p-3 bg-slate-50/90 flex items-center justify-between border-b border-slate-100 text-xs">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#000000]" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Select All ({filteredProducts.length})</span>
                </button>
                <span className="text-[11px] text-slate-400 font-medium">
                  {selectedIds.length} chosen
                </span>
              </div>

              {paginatedProducts.map((product) => {
                const isSelected = selectedIds.includes(product.id);
                const isLow = product.stock > 0 && product.stock <= 5;
                const isOut = product.stock === 0;

                return (
                  <div
                    key={product.id}
                    className={`p-3.5 space-y-2.5 transition-colors ${
                      isSelected ? "bg-blue-50/40" : "hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleSelect(product.id)}
                        className="p-1 -ml-1 text-slate-400 hover:text-slate-700 cursor-pointer mt-1"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#000000]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      {/* Image Thumbnail */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                        <ImageWithFallback
                          src={product.images?.[0]}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                          fallbackTitle={product.name}
                          fallbackVariant="sm"
                        />
                      </div>

                      {/* Title, slug, collection & featured badge */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-slate-900 text-xs truncate">
                            {product.name}
                          </h4>
                          {product.featured && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold flex items-center gap-0.5 shrink-0">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Star
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          /{product.slug}
                        </div>

                        <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600 text-[10px]">
                          {product.collection.name}
                        </span>
                      </div>
                    </div>

                    {/* Price & Stock Strip */}
                    <div className="flex items-center justify-between text-xs bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Price</span>
                        <span className="font-extrabold text-[#000000] text-xs sm:text-sm">
                          {formatNaira(product.price)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Stock</span>
                        {activeTab === "catalog" ? (
                          isOut ? (
                            <span className="text-red-700 font-bold text-[11px]">Sold Out (0)</span>
                          ) : isLow ? (
                            <span className="text-amber-700 font-bold text-[11px] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600 inline" /> {product.stock} left
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold text-[11px]">{product.stock} units</span>
                          )
                        ) : (
                          <span className="text-red-600 font-bold text-[11px]">In Trash</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="pt-1 flex items-center justify-end gap-1.5">
                      {activeTab === "catalog" ? (
                        <>
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#FED501] hover:text-[#000000] text-slate-600 transition-colors"
                            title="Preview on Live Store"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#000000] hover:text-white text-slate-700 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => promptMoveToTrash(product)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
                            title="Move to Trash"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => promptRestore(product)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                          </button>
                          <button
                            onClick={() => promptPermanentDelete(product)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
                            title="Permanently Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. DESKTOP TABLE VIEW (>= md screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-4 px-4 w-10">
                      <button
                        onClick={handleSelectAll}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {isAllSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#000000]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-4">Cap Design</th>
                    <th className="py-4 px-6">Collection</th>
                    <th className="py-4 px-6">Price</th>
                    <th className="py-4 px-6">
                      {activeTab === "catalog" ? "Stock Level" : "Status"}
                    </th>
                    <th className="py-4 px-6">Badges</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedProducts.map((product) => {
                    const isSelected = selectedIds.includes(product.id);
                    const isRecentlySaved = recentlyUpdatedId === product.id;
                    const isLow = product.stock > 0 && product.stock <= 5;
                    const isOut = product.stock === 0;

                    return (
                      <tr
                        key={product.id}
                        className={`transition-all duration-500 ${
                          isRecentlySaved
                            ? "bg-amber-50/80 ring-2 ring-[#FED501] ring-inset"
                            : isSelected
                            ? "bg-blue-50/40"
                            : "hover:bg-slate-50/60"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleSelect(product.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#000000]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Product Preview */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3.5">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-200 shadow-xs">
                              <ImageWithFallback
                                src={product.images?.[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                                fallbackTitle={product.name}
                                fallbackVariant="sm"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-800 text-sm line-clamp-1">
                                  {product.name}
                                </span>
                                {isRecentlySaved && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FED501] text-[#000000] text-[9px] font-extrabold uppercase tracking-wider animate-pulse shadow-xs">
                                    <Sparkles className="w-2.5 h-2.5" /> Just Saved
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                /{product.slug}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Collection */}
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 font-semibold text-slate-700 text-[11px]">
                            {product.collection.name}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-[#000000] text-sm">
                            {formatNaira(product.price)}
                          </div>
                        </td>

                        {/* Stock Health */}
                        <td className="py-4 px-6">
                          {activeTab === "catalog" ? (
                            <div className="flex items-center gap-2">
                              {isOut ? (
                                <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold">
                                  0 units (Sold Out)
                                </span>
                              ) : isLow ? (
                                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  {product.stock} left (Low Stock)
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                                  {product.stock} in stock
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-bold text-[11px] border border-red-200">
                              In Trash
                            </span>
                          )}
                        </td>

                        {/* Badges */}
                        <td className="py-4 px-6">
                          {product.featured ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold flex items-center gap-1 w-max">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Featured
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Standard</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {activeTab === "catalog" ? (
                              <>
                                <Link
                                  href={`/products/${product.slug}`}
                                  target="_blank"
                                  className="p-2 rounded-lg bg-slate-100 hover:bg-[#FED501] hover:text-[#000000] text-slate-600 transition-colors"
                                  title="Preview on Live Store"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => handleOpenEdit(product)}
                                  className="p-2 rounded-lg bg-slate-100 hover:bg-[#000000] hover:text-white text-slate-600 transition-colors cursor-pointer"
                                  title="Edit Cap Details"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => promptMoveToTrash(product)}
                                  className="p-2 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
                                  title="Move to Trash"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => promptRestore(product)}
                                  className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 transition-colors flex items-center gap-1 font-bold cursor-pointer"
                                  title="Restore Product"
                                >
                                  <RotateCcw className="w-4 h-4" /> Restore
                                </button>
                                <button
                                  onClick={() => promptPermanentDelete(product)}
                                  className="p-2 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
                                  title="Permanently Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
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
              totalItems={filteredProducts.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="products"
            />
          </>
        )}
      </div>

      {/* 3. PRODUCT CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8 border border-slate-200 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 pb-4 mb-5 sm:mb-6 pr-8">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FED501]">
                {formData.id ? "Catalog Item Management" : "New Heritage Cap"}
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#000000] mt-0.5">
                {formData.id ? "Edit Fìlà Specification" : "Craft New Cap Entry"}
              </h2>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 sm:space-y-5 text-xs">
              {/* Form Validation / Server Error Banner */}
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs animate-in fade-in-50 duration-200">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="font-semibold">{formError}</div>
                </div>
              )}

              {/* Product Photos Upload Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">
                    Cap Photos (High-Res)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[10px] text-[#FED501] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Link2 className="w-3 h-3" />
                    <span>{showUrlInput ? "Hide URL Input" : "Paste Image URL"}</span>
                  </button>
                </div>

                {/* Dropzone / Upload button */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group ${
                    isUploading
                      ? "border-[#FED501] bg-[#FED501]/5"
                      : "border-slate-200 hover:border-[#000000] bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                  <div className="p-3 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform text-[#000000]">
                    {isUploading ? (
                      <RefreshCw className="w-5 sm:w-6 h-5 sm:h-6 animate-spin text-[#FED501]" />
                    ) : (
                      <UploadCloud className="w-5 sm:w-6 h-5 sm:h-6" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 text-xs">
                      {isUploading
                        ? "Uploading image files..."
                        : "Click to upload product photos"}
                    </span>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                      PNG, JPG, WEBP or AVIF (Up to 10MB each)
                    </p>
                  </div>
                </div>

                {/* Fallback URL input */}
                {showUrlInput && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#000000]"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualUrl}
                      className="px-3.5 sm:px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-xs cursor-pointer"
                    >
                      Add URL
                    </button>
                  </div>
                )}

                {/* Uploaded Photos Thumbnails Preview */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-3">
                    {formData.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 bg-slate-100 shadow-sm"
                      >
                        <ImageWithFallback
                          src={img}
                          alt={`Product preview ${idx + 1}`}
                          fill
                          className="object-cover"
                          fallbackTitle={`Preview ${idx + 1}`}
                          fallbackVariant="sm"
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-[#000000]/90 text-white text-[9px] font-bold">
                            Primary
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white transition-all shadow-md cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Cap Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Indigo Aso-Oke Fila"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "");
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: prev.id ? prev.slug : autoSlug,
                    }));
                  }}
                  className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#000000] text-xs font-semibold"
                />
              </div>

              {/* Grid: Slug & Collection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#000000]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700">
                      Collection Heritage *
                    </label>
                    <Link
                      href="/admin/collections"
                      target="_blank"
                      className="text-[10px] text-[#FED501] hover:underline font-bold"
                    >
                      + Collections
                    </Link>
                  </div>
                  <select
                    value={formData.collectionSlug}
                    onChange={(e) =>
                      setFormData({ ...formData, collectionSlug: e.target.value })
                    }
                    className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-[#FED501]/60 focus:outline-none focus:ring-2 focus:ring-[#FED501]/20 focus:border-[#FED501] font-semibold text-slate-800 transition-all cursor-pointer text-xs"
                  >
                    {availableCollections.length === 0 ? (
                      <option value="">No collections created yet</option>
                    ) : (
                      <>
                        {!availableCollections.some((c) => c.slug === formData.collectionSlug) && (
                          <option value="" disabled>
                            -- Select a Collection --
                          </option>
                        )}
                        {availableCollections.map((c) => (
                          <option key={c.id} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Grid: Price & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Price (NGN ₦) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="500"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: Number(e.target.value) })
                    }
                    className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-[#000000] text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Inventory Stock Units
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-[#000000] focus-within:border-transparent">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          stock: Math.max(0, prev.stock - 1),
                        }))
                      }
                      disabled={formData.stock <= 0}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-30 transition-colors flex items-center justify-center cursor-pointer"
                      title="Decrease stock"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stock: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-full text-center py-2.5 bg-white font-bold text-slate-900 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          stock: prev.stock + 1,
                        }))
                      }
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors flex items-center justify-center cursor-pointer"
                      title="Increase stock"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Artisan Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#000000] text-xs leading-relaxed"
                />
              </div>

              {/* Sizes Available */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Supported Fìlà Yorùbá Sizes
                </label>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {[
                    { code: "XS", label: "XS (22.0″)" },
                    { code: "S", label: "S (22.5″)" },
                    { code: "M", label: "M (23.0″)" },
                    { code: "L", label: "L (23.5″)" },
                    { code: "XL", label: "XL (24.0″)" },
                    { code: "XXL", label: "XXL (24.5″)" },
                    { code: "XXXL", label: "3XL (25.0″)" },
                    { code: "F", label: "F (Flexible)" },
                  ].map((sizeItem) => {
                    const isChecked = formData.sizes.includes(sizeItem.code);
                    return (
                      <label
                        key={sizeItem.code}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                          isChecked
                            ? "bg-[#000000] text-white border-[#000000]"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                sizes: [...formData.sizes, sizeItem.code],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                sizes: formData.sizes.filter((s) => s !== sizeItem.code),
                              });
                            }
                          }}
                          className="sr-only"
                        />
                        {sizeItem.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Featured Switch */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-xs">Featured Showcase</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500">
                    Display this cap prominently on the homepage hero catalog.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData({ ...formData, featured: e.target.checked })
                  }
                  className="w-4 h-4 text-[#000000] rounded focus:ring-[#000000] cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#000000] text-white font-bold hover:bg-[#262626] shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FED501]" />
                      <span>{formData.id ? "Saving Fìlà Changes..." : "Publishing Fìlà Cap..."}</span>
                    </>
                  ) : (
                    <span>{formData.id ? "Update Fìlà Specification" : "Craft & Publish Cap"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
