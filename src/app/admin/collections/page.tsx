"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import Link from "next/link";
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  UploadCloud,
  X,
  Package,
  CheckCircle2,
  RefreshCw,
  FolderPlus,
  AlertCircle,
  LayoutGrid,
  List,
} from "lucide-react";
import { Collection } from "@/types/collection";
import { toast } from "sonner";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { generateSlug } from "@/lib/slugify";

interface CollectionFormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  image: string;
}

const defaultFormData: CollectionFormData = {
  name: "",
  slug: "",
  description: "",
  image: "",
};

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<CollectionFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Image State
  const [deleteImageTarget, setDeleteImageTarget] = useState<{
    imageUrl: string;
    collectionId?: string;
    collectionName?: string;
  } | null>(null);
  const [deletingImage, setDeletingImage] = useState(false);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Collections
  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/collections");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && Array.isArray(data.collections)) {
        setCollections(data.collections);
      } else {
        toast.error("Could not load collections", {
          description: data.message || "Database connection issue. Please retry.",
        });
      }
    } catch (err) {
      console.error("Collections fetch error:", err);
      toast.error("Network Error", {
        description: "Failed to connect to database. Please check your network.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  // Filtered Collections
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [collections, search]);

  // Total products in all collections
  const totalAttachedProducts = useMemo(() => {
    return collections.reduce((acc, c) => acc + (c.productCount || 0), 0);
  }, [collections]);

  // Open Create
  const handleOpenCreate = () => {
    setFormData(defaultFormData);
    setFormError(null);
    setModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (col: Collection) => {
    setFormData({
      id: col.id,
      name: col.name,
      slug: col.slug,
      description: col.description || "",
      image: col.image || "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Collection title is required.");
      toast.error("Validation Error", {
        description: "Collection name is required.",
      });
      return;
    }

    setSaving(true);
    try {
      const isEdit = Boolean(formData.id);
      const url = isEdit
        ? `/api/admin/collections/${formData.id}`
        : "/api/admin/collections";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const savedCol = data.collection;
        const savedId = savedCol?.id || formData.id;

        toast.success(
          isEdit ? "Collection Updated Successfully" : "New Collection Created & Published",
          {
            description: isEdit
              ? `"${formData.name}" collection details and story have been updated.`
              : `"${formData.name}" added to storefront collection families.`,
            duration: 5000,
          }
        );
        setModalOpen(false);
        setFormError(null);

        if (savedId) {
          setRecentlyUpdatedId(savedId);
          setTimeout(() => {
            setRecentlyUpdatedId((prev) => (prev === savedId ? null : prev));
          }, 7000);
        }

        fetchCollections();
      } else {
        const errorMsg = data.message || "Failed to save collection.";
        setFormError(errorMsg);
        toast.error("Save Failed", {
          description: errorMsg,
        });
      }
    } catch (err) {
      console.error(err);
      const errorMsg = "An unexpected error occurred while saving collection.";
      setFormError(errorMsg);
      toast.error("Save Error", {
        description: errorMsg,
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/collections/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Collection Deleted", {
          description: `Collection "${deleteTarget.name}" was successfully removed.`,
        });
        setDeleteTarget(null);
        fetchCollections();
      } else {
        toast.error("Delete Failed", {
          description: data.message || "Failed to delete collection.",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Delete Error", {
        description: "An error occurred while deleting collection.",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("folder", "collections");

    setUploadingImage(true);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormData((prev) => ({ ...prev, image: data.url }));
        toast.success("Cover Image Uploaded", {
          description: "Collection cover banner updated successfully.",
        });
      } else {
        toast.error("Upload Error", {
          description: data.message || "Failed to upload image.",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload Failed", {
        description: "An error occurred while uploading cover image.",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Trigger Image Deletion Confirmation
  const promptDeleteImage = () => {
    if (!formData.image || !formData.image.trim()) return;
    setDeleteImageTarget({
      imageUrl: formData.image.trim(),
      collectionId: formData.id,
      collectionName: formData.name,
    });
  };

  // Confirm and Execute Image Deletion
  const confirmDeleteImage = async () => {
    if (!deleteImageTarget) return;
    const { imageUrl, collectionId, collectionName } = deleteImageTarget;
    setDeletingImage(true);

    try {
      // 1. Purge from storage if stored in /uploads/ or Cloudinary
      if (imageUrl.startsWith("/uploads/") || imageUrl.includes("cloudinary.com")) {
        try {
          await fetch("/api/admin/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: imageUrl }),
          });
        } catch (storageErr) {
          console.warn("Storage deletion warning:", storageErr);
        }
      }

      // 2. If editing an existing collection in DB, immediately persist image removal
      if (collectionId) {
        const res = await fetch(`/api/admin/collections/${collectionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: "" }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          // Instantly sync local collections list
          setCollections((prev) =>
            prev.map((c) => (c.id === collectionId ? { ...c, image: undefined } : c))
          );
        }
      }

      // 3. Clear from current form and reset file input
      setFormData((prev) => ({ ...prev, image: "" }));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success("Cover Photo Deleted", {
        description: collectionId
          ? `Cover banner removed from "${collectionName || "collection"}" and storage cleaned.`
          : "Cover photo removed from collection form.",
      });

      setDeleteImageTarget(null);
    } catch (err) {
      console.error("Delete image error:", err);
      toast.error("Delete Failed", {
        description: "An error occurred while deleting the cover photo.",
      });
    } finally {
      setDeletingImage(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header with Title & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#000000]">
              Collections Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FED501]/10 text-[#000000] text-[10px] font-bold border border-[#FED501]/30">
              Storefront
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Create, categorize, and organize your master Yoruba headwear collections across the storefront.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchCollections}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs cursor-pointer"
            title="Refresh Collections"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all shadow-md shadow-[#000000]/10 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FED501]" />
            <span>Create New Collection</span>
          </button>
        </div>
      </div>

      {/* 2. Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#000000]/5 text-[#000000] flex items-center justify-center font-bold shrink-0">
            <Layers className="w-5 sm:w-6 h-5 sm:h-6 text-[#FED501]" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Collections
            </span>
            <span className="text-xl sm:text-2xl font-bold font-serif text-[#000000]">
              {collections.length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <Package className="w-5 sm:w-6 h-5 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Attached Catalog Caps
            </span>
            <span className="text-xl sm:text-2xl font-bold font-serif text-[#000000]">
              {totalAttachedProducts}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 sm:w-6 h-5 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Storefront Sync
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-700 block mt-0.5">
              Live Everywhere &bull; Synced
            </span>
          </div>
        </div>
      </div>

      {/* 3. Controls & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search collections by name, slug or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#000000] placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-[#000000] shadow-xs"
                  : "text-slate-500 hover:text-[#000000]"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-[#000000] shadow-xs"
                  : "text-slate-500 hover:text-[#000000]"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Collection Content */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#000000] animate-spin mx-auto opacity-50" />
          <p className="text-xs text-slate-500 font-medium">Loading collections...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 sm:p-16 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#000000]/5 text-[#000000] flex items-center justify-center mx-auto">
            <FolderPlus className="w-6 h-6 text-[#FED501]" />
          </div>
          <div>
            <h3 className="text-base font-bold font-serif text-[#000000]">
              No collections found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {search
                ? `No results matching "${search}"`
                : "Get started by creating your first Yoruba cap collection."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl bg-[#000000] text-white text-xs font-bold hover:bg-[#1A1A1A] transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FED501]" />
            <span>Add Collection</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((col) => {
            const isRecentlySaved = recentlyUpdatedId === col.id;
            return (
              <div
                key={col.id}
                className={`bg-white border rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-500 flex flex-col justify-between group ${
                  isRecentlySaved
                    ? "border-[#FED501] ring-2 ring-[#FED501] bg-amber-50/20 shadow-md"
                    : "border-slate-200/80 hover:border-[#FED501]/50"
                }`}
              >
                {/* Cover Image Stage */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                  <ImageWithFallback
                    src={col.image}
                    alt={col.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    fallbackTitle={col.name}
                    fallbackSubtitle="Master Archive"
                    fallbackBadge="Collection"
                    fallbackIcon={Layers}
                    fallbackVariant="md"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Slug Badge */}
                  <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-mono font-bold text-[#000000] shadow-xs">
                      /{col.slug}
                    </span>
                    {isRecentlySaved && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FED501] text-[#000000] text-[9px] font-extrabold uppercase tracking-wider animate-pulse shadow-xs flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Just Saved
                      </span>
                    )}
                  </div>

                  {/* Product Count Pill */}
                  <div className="absolute bottom-3.5 left-3.5 z-10">
                    <span className="px-2.5 py-1 rounded-full bg-[#000000]/90 backdrop-blur-md text-[10px] font-bold text-white shadow-xs flex items-center gap-1">
                      <Package className="w-3 h-3 text-[#FED501]" />
                      {col.productCount || 0} {(col.productCount || 0) === 1 ? "Cap" : "Caps"} Attached
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-[#000000] group-hover:text-[#FED501] transition-colors">
                      {col.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {col.description || "No description provided for this collection."}
                    </p>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/products?collection=${col.slug}`}
                      target="_blank"
                      className="text-[11px] font-bold text-slate-500 hover:text-[#000000] flex items-center gap-1 transition-colors"
                    >
                      <span>Storefront</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(col)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-[#000000] hover:text-white text-slate-700 transition-colors cursor-pointer"
                        title="Edit Collection"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(col)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
                        title="Delete Collection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Collection</th>
                  <th className="py-4 px-6">Slug</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6 text-center">Products</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((col) => {
                  const isRecentlySaved = recentlyUpdatedId === col.id;
                  return (
                    <tr
                      key={col.id}
                      className={`transition-all duration-500 ${
                        isRecentlySaved
                          ? "bg-amber-50/80 ring-2 ring-[#FED501] ring-inset"
                          : "hover:bg-slate-50/60"
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 shadow-xs">
                            <ImageWithFallback
                              src={col.image}
                              alt={col.name}
                              fill
                              className="object-cover"
                              fallbackTitle={col.name}
                              fallbackIcon={Layers}
                              fallbackVariant="sm"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-serif font-bold text-sm text-[#000000] block">
                                {col.name}
                              </span>
                              {isRecentlySaved && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FED501] text-[#000000] text-[9px] font-extrabold uppercase tracking-wider animate-pulse shadow-xs">
                                  <Sparkles className="w-2.5 h-2.5" /> Just Saved
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-mono text-[11px] text-slate-600">
                        /{col.slug}
                      </td>

                      <td className="py-4 px-6 text-slate-500 max-w-xs truncate">
                        {col.description || "—"}
                      </td>

                    <td className="py-4 px-6 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 font-bold text-[#000000] text-[11px]">
                        {col.productCount || 0}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/products?collection=${col.slug}`}
                          target="_blank"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-[#FED501] hover:text-[#000000] text-slate-600 transition-colors"
                          title="Preview on Store"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(col)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-[#000000] hover:text-white text-slate-600 transition-colors cursor-pointer"
                          title="Edit Collection"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(col)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
                          title="Delete Collection"
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
        </div>
      )}

      {/* 5. CREATE & EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8 border border-slate-200 shadow-2xl relative animate-scale-up space-y-5 sm:space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#000000]/5 flex items-center justify-center text-[#000000] shrink-0">
                  <Layers className="w-5 h-5 text-[#FED501]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-serif font-bold text-[#000000]">
                    {formData.id ? "Edit Yoruba Collection" : "Create New Yoruba Collection"}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Defines a distinct cap family displayed on the storefront
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Form Validation / Server Error Banner */}
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs animate-in fade-in-50 duration-200">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="font-semibold">{formError}</div>
                </div>
              )}

              {/* Collection Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Collection Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Imperial Alaari & Gold"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = generateSlug(name);
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: autoSlug,
                    }));
                  }}
                  className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#000000] font-semibold"
                />
              </div>

              {/* URL Slug (Auto-generated with live route preview) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span>URL Route Slug *</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      Auto
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        slug: generateSlug(prev.name),
                      }))
                    }
                    className="text-[10px] text-[#FED501] hover:underline font-bold cursor-pointer"
                    title="Regenerate slug from current collection title"
                  >
                    ↺ Sync from Name
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px] select-none">
                    slug:
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="imperial-alaari-gold"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        slug: generateSlug(e.target.value),
                      }))
                    }
                    className="w-full pl-16 pr-4 py-2.5 rounded-xl border border-slate-200 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#000000] text-[#000000] font-semibold"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1 truncate">
                  <span>Filtered storefront:</span>
                  <span className="text-slate-700 font-mono font-medium truncate">
                    /products?collection={formData.slug || "your-slug"}
                  </span>
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Heritage Story & Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the weaving heritage, fabric origin, and celebratory context..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#000000] leading-relaxed"
                />
              </div>

              {/* Cover Image Upload / URL with Delete Feature */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="block font-bold text-slate-700 text-xs">
                  Cover Showcase Photo <span className="text-slate-400 font-normal">(Optional)</span>
                </label>

                <div className="flex items-center gap-3">
                  {/* Thumbnail Preview */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 group">
                    {formData.image && formData.image.trim() ? (
                      <>
                        <ImageWithFallback
                          src={formData.image}
                          alt="Cover Preview"
                          fill
                          className="object-cover"
                          fallbackTitle={formData.name || "Preview"}
                          fallbackVariant="sm"
                        />
                        <button
                          type="button"
                          onClick={promptDeleteImage}
                          disabled={deletingImage}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                          title="Delete image"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <UploadCloud className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Actions & URL Input */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{uploadingImage ? "Uploading..." : formData.image ? "Change Photo" : "Upload Photo"}</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                      {formData.image && (
                        <button
                          type="button"
                          onClick={promptDeleteImage}
                          disabled={deletingImage}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Or enter image URL (/images/... or https://...)"
                      value={formData.image}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, image: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-[#000000]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white font-bold transition-all shadow-md shadow-[#000000]/10 cursor-pointer disabled:opacity-50 text-center flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FED501]" />
                      <span>{formData.id ? "Saving Changes..." : "Publishing Collection..."}</span>
                    </>
                  ) : (
                    <span>{formData.id ? "Update Collection Family" : "Create & Publish Collection"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete Collection "${deleteTarget?.name}"?`}
        description="Are you sure you want to delete this collection? Products attached to this collection will remain safe in your inventory, but will be unassigned."
        confirmLabel="Delete Collection"
        isLoading={deleting}
        variant="danger"
        onConfirm={confirmDelete}
      />

      {/* 7. DELETE IMAGE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteImageTarget)}
        onClose={() => setDeleteImageTarget(null)}
        title={
          deleteImageTarget?.collectionId
            ? `Delete Cover Photo for "${deleteImageTarget.collectionName || "Collection"}"?`
            : "Delete Uploaded Cover Photo?"
        }
        description={
          deleteImageTarget?.collectionId
            ? "This will remove the showcase cover banner from this collection and purge the uploaded file from storage. The collection itself and all attached products will remain safe."
            : "Are you sure you want to delete this uploaded cover photo? The file will be permanently removed from storage."
        }
        confirmLabel="Delete Cover Photo"
        isLoading={deletingImage}
        variant="danger"
        highlightText={deleteImageTarget?.collectionName || "Cover Photo"}
        onConfirm={confirmDeleteImage}
      />
    </div>
  );
}

