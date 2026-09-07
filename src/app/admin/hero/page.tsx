"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import Link from "next/link";
import {
  Sliders,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  UploadCloud,
  X,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  List,
  AlertCircle,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Database,
  ArrowRight,
} from "lucide-react";
import { HeroSlide } from "@/types/hero";
import { toast } from "sonner";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import AnnouncementBarManager from "@/components/admin/AnnouncementBarManager";

interface HeroSlideFormData {
  id?: string;
  title: string;
  subtitle: string;
  badge: string;
  tag: string;
  price: string;
  link: string;
  image: string;
  isActive: boolean;
}

const defaultFormData: HeroSlideFormData = {
  title: "",
  subtitle: "",
  badge: "Imperial Collection",
  tag: "Master Handcrafted",
  price: "₦58,000",
  link: "/products",
  image: "/images/hero/fila_alaari_crimson_gold_gobi.png",
  isActive: true,
};

const suggestedLinks = [
  { label: "All Products", url: "/products" },
  { label: "Collections Showcase", url: "/#collections" },
  { label: "Alaari Crimson Fila", url: "/products/alaari-crimson-metallic-gold-pinstripe-fila" },
  { label: "Emerald Silver Gobi", url: "/products/emerald-silver-handwoven-gobi-fila" },
  { label: "Royal Maroon Velvet", url: "/products/royal-maroon-embroidered-velvet-fila" },
  { label: "Sovereign Sányán Silk", url: "/products/sovereign-multi-stripe-sanyan-gobi-fila" },
];

export default function AdminHeroPage() {
  const [activeTab, setActiveTab] = useState<"slides" | "announcement">("slides");
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Live Simulator State
  const [previewActiveSlide, setPreviewActiveSlide] = useState(0);
  const [simulatorPaused, setSimulatorPaused] = useState(false);
  const [showSimulator, setShowSimulator] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<HeroSlideFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<string | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<HeroSlide | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Fetch Slides
  const fetchSlides = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/hero-slides");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && Array.isArray(data.slides)) {
        setSlides(data.slides);
      } else {
        toast.error("Could not load hero slides", {
          description: data.message || "Database connection issue. Please retry.",
        });
      }
    } catch (err) {
      console.error("Hero slides fetch error:", err);
      toast.error("Network Error", {
        description: "Failed to connect to database. Please check your network.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  // Filtered Slides
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return slides;
    return slides.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.badge.toLowerCase().includes(q) ||
        (s.tag && s.tag.toLowerCase().includes(q))
    );
  }, [slides, search]);

  const activeSlides = useMemo(() => {
    return slides.filter((s) => s.isActive);
  }, [slides]);

  // Simulator Autoplay
  const nextSimulatorSlide = useCallback(() => {
    if (activeSlides.length === 0) return;
    setPreviewActiveSlide((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

  const prevSimulatorSlide = useCallback(() => {
    if (activeSlides.length === 0) return;
    setPreviewActiveSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  useEffect(() => {
    if (simulatorPaused || activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      nextSimulatorSlide();
    }, 4500);
    return () => clearInterval(timer);
  }, [simulatorPaused, activeSlides.length, nextSimulatorSlide]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData(defaultFormData);
    setFormError(null);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (slide: HeroSlide) => {
    setFormData({
      id: slide.id,
      title: slide.title,
      subtitle: slide.subtitle || "",
      badge: slide.badge,
      tag: slide.tag || "",
      price: slide.price || "",
      link: slide.link,
      image: slide.image,
      isActive: slide.isActive,
    });
    setFormError(null);
    setModalOpen(true);
  };

  // Toggle Active/Inactive
  const handleToggleActive = async (slide: HeroSlide) => {
    const updatedStatus = !slide.isActive;
    // Optimistic UI update
    setSlides((prev) =>
      prev.map((s) => (s.id === slide.id ? { ...s, isActive: updatedStatus } : s))
    );

    try {
      const res = await fetch(`/api/admin/hero-slides/${slide.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: updatedStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          updatedStatus ? `"${slide.title}" is now LIVE` : `"${slide.title}" is now HIDDEN`,
          {
            description: updatedStatus
              ? "Slide is now visible in the homepage hero carousel."
              : "Slide removed from public storefront rotation.",
          }
        );
      } else {
        // Revert on error
        setSlides((prev) =>
          prev.map((s) => (s.id === slide.id ? { ...s, isActive: !updatedStatus } : s))
        );
        toast.error("Failed to toggle slide status");
      }
    } catch (err) {
      console.error(err);
      setSlides((prev) =>
        prev.map((s) => (s.id === slide.id ? { ...s, isActive: !updatedStatus } : s))
      );
      toast.error("Error connecting to server");
    }
  };

  // Move Slide Up / Down
  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    // Update order numbers
    const updatedWithOrder = newSlides.map((s, idx) => ({ ...s, order: idx }));
    setSlides(updatedWithOrder);

    try {
      const orderedIds = updatedWithOrder.map((s) => s.id);
      const res = await fetch("/api/admin/hero-slides/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (res.ok) {
        toast.success("Carousel order updated", {
          description: `Slide moved ${direction}. Storefront updated instantly.`,
        });
      } else {
        toast.error("Failed to save reorder state");
        fetchSlides();
      }
    } catch (err) {
      console.error(err);
      toast.error("Reorder failed to sync");
      fetchSlides();
    }
  };

  // Handle Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError("Slide title is required.");
      return;
    }
    if (!formData.image.trim()) {
      setFormError("Banner image URL or upload is required.");
      return;
    }
    if (!formData.badge.trim()) {
      setFormError("Promo badge tag is required.");
      return;
    }
    if (!formData.link.trim()) {
      setFormError("Target destination link is required.");
      return;
    }

    setSaving(true);
    try {
      const isEdit = Boolean(formData.id);
      const url = isEdit
        ? `/api/admin/hero-slides/${formData.id}`
        : "/api/admin/hero-slides";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const savedSlide = data.slide;
        const savedId = savedSlide?.id || formData.id;

        toast.success(
          isEdit ? "Hero Slide Updated" : "New Hero Slide Published",
          {
            description: `"${formData.title}" is now synced with the homepage hero carousel.`,
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

        fetchSlides();
      } else {
        const errorMsg = data.message || "Failed to save hero slide.";
        setFormError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = "An unexpected error occurred while saving slide.";
      setFormError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/hero-slides/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Hero Slide Deleted", {
          description: `Slide "${deleteTarget.title}" was removed from the carousel.`,
        });
        setDeleteTarget(null);
        fetchSlides();
      } else {
        toast.error(data.message || "Failed to delete hero slide.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting slide.");
    } finally {
      setDeleting(false);
    }
  };

  // Seed Default Slides
  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/hero-slides/seed", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Default Hero Slides Loaded", {
          description: "Database refreshed with 4 canonical Yoruba Fila showcase slides.",
        });
        fetchSlides();
      } else {
        toast.error("Failed to seed slides");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading defaults");
    } finally {
      setSeeding(false);
    }
  };

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("folder", "hero");

    setUploadingImage(true);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormData((prev) => ({ ...prev, image: data.url }));
        toast.success("Banner Image Uploaded", {
          description: "Saved to /public/uploads/hero/ successfully.",
        });
      } else {
        toast.error(data.message || "Failed to upload banner image.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while uploading banner photo.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Image Delete Handler (with Storage Cleanup)
  const handleDeleteImage = async () => {
    if (!formData.image || !formData.image.trim()) return;
    const imgUrl = formData.image.trim();
    setIsDeletingImage(true);

    try {
      // Clean up from storage if local upload or Cloudinary
      if (imgUrl.startsWith("/uploads/") || imgUrl.includes("cloudinary.com")) {
        try {
          await fetch("/api/admin/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: imgUrl }),
          });
        } catch (storageErr) {
          console.warn("Storage deletion warning:", storageErr);
        }
      }

      // If editing an existing slide, clear in DB as well
      if (formData.id) {
        try {
          await fetch(`/api/admin/hero-slides/${formData.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: "" }),
          });
          setSlides((prev) =>
            prev.map((s) => (s.id === formData.id ? { ...s, image: "" } : s))
          );
        } catch (err) {
          console.warn("Database sync warning:", err);
        }
      }

      setFormData((prev) => ({ ...prev, image: "" }));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success("Image removed", {
        description: "Banner image removed from slide.",
      });
    } catch (err) {
      console.error("Failed to delete banner image:", err);
      toast.error("Failed to remove image");
    } finally {
      setIsDeletingImage(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header with Title & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#000000]">
              Hero & Banners Manager
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FED501]/10 text-[#000000] text-[10px] font-bold border border-[#FED501]/30">
              {activeTab === "slides" ? "Homepage Carousel" : "Top Marquee Ticker"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            {activeTab === "slides"
              ? "Upload showcase cap photography, tweak badges and pricing, and drag or reorder the rotating hero banner."
              : "Manage the continuous sliding announcement messages and scroll speed visible at the very top of the storefront."}
          </p>
        </div>

        {activeTab === "slides" && (
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={fetchSlides}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs cursor-pointer"
              title="Refresh Slides"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Reset/Seed Defaults"
            >
              <Database className="w-3.5 h-3.5 text-[#FED501]" />
              <span>{seeding ? "Loading..." : "Load Defaults"}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all shadow-md shadow-[#000000]/10 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#FED501]" />
              <span>Add New Hero Slide</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("slides")}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "slides"
              ? "border-[#000000] text-[#000000]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-4 h-4 text-[#FED501]" />
          <span>Hero Carousel Slides</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-mono">
            {slides.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("announcement")}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "announcement"
              ? "border-[#000000] text-[#000000]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#FED501]" />
          <span>Top Announcement Bar</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
            Live Marquee
          </span>
        </button>
      </div>

      {activeTab === "announcement" ? (
        <AnnouncementBarManager />
      ) : (
        <>

      {/* 2. Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#000000]/5 text-[#000000] flex items-center justify-center font-bold shrink-0">
            <Sliders className="w-5 sm:w-6 h-5 sm:h-6 text-[#FED501]" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Slides
            </span>
            <span className="text-xl sm:text-2xl font-bold font-serif text-[#000000]">
              {slides.length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <Eye className="w-5 sm:w-6 h-5 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active On Storefront
            </span>
            <span className="text-xl sm:text-2xl font-bold font-serif text-emerald-700">
              {activeSlides.length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
            <EyeOff className="w-5 sm:w-6 h-5 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Hidden / Drafts
            </span>
            <span className="text-xl sm:text-2xl font-bold font-serif text-slate-700">
              {slides.length - activeSlides.length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 sm:w-6 h-5 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Carousel Interval
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#000000] block mt-0.5">
              5s Autoplay (Pause on Hover)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Live Hero Carousel Simulator Widget */}
      {activeSlides.length > 0 && (
        <div className="bg-gradient-to-br from-[#000000] via-[#000000] to-[#1A1A1A] rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-[#FED501]/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FED501]/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#FED501]" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                  Live Carousel Simulator
                </h3>
                <p className="text-[11px] text-white/60">
                  Preview exactly how active slides transition and appear to visitors on the homepage
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSimulatorPaused(!simulatorPaused)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {simulatorPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Resume Autoplay</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pause</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowSimulator(!showSimulator)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {showSimulator ? "Collapse Preview" : "Expand Preview"}
              </button>
            </div>
          </div>

          {showSimulator && (
            <div className="mt-5 grid md:grid-cols-2 gap-6 items-center">
              {/* Simulator Left Copy */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-[#FED501]">
                  <Sparkles className="w-3 h-3" />
                  <span>Slide #{previewActiveSlide + 1} of {activeSlides.length} Active</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#FED501] block">
                    {activeSlides[previewActiveSlide]?.badge}
                  </span>
                  <h4 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight mt-1">
                    {activeSlides[previewActiveSlide]?.title}
                  </h4>
                  <p className="text-xs text-white/75 mt-2 leading-relaxed">
                    {activeSlides[previewActiveSlide]?.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  {activeSlides[previewActiveSlide]?.price && (
                    <span className="text-xl font-extrabold text-[#FED501]">
                      {activeSlides[previewActiveSlide]?.price}
                    </span>
                  )}
                  <Link
                    href={activeSlides[previewActiveSlide]?.link || "/products"}
                    target="_blank"
                    className="px-4 py-2 rounded-xl bg-[#FED501] text-[#000000] text-xs font-bold hover:bg-[#EAB308] transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Test CTA Link</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Simulator Right Image Stage */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/40 border border-white/20 shadow-2xl group">
                {activeSlides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${idx === previewActiveSlide
                      ? "opacity-100 scale-100 z-10"
                      : "opacity-0 scale-95 pointer-events-none z-0"
                      }`}
                  >
                    <ImageWithFallback
                      src={slide.image}
                      alt={slide.title}
                      fill
                      className="object-cover object-center"
                      fallbackTitle={slide.title}
                      fallbackSubtitle={slide.subtitle || slide.price || undefined}
                      fallbackBadge={slide.badge}
                      fallbackVariant="lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 text-white flex items-end justify-between">
                      <div className="max-w-[70%]">
                        <span className="text-[9px] uppercase tracking-widest text-[#FED501] font-bold bg-black/40 px-2 py-0.5 rounded-full">
                          {slide.badge}
                        </span>
                        <p className="text-sm font-bold truncate mt-1">{slide.title}</p>
                      </div>
                      {slide.price && (
                        <span className="text-sm font-extrabold text-[#FED501] shrink-0">
                          {slide.price}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Simulator Manual Controls */}
                <button
                  type="button"
                  onClick={prevSimulatorSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextSimulatorSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Simulator Dots */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/40 p-1 rounded-full">
                  {activeSlides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPreviewActiveSlide(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === previewActiveSlide ? "w-4 bg-[#FED501]" : "w-1.5 bg-white/50"
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Controls & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search slides by title, subtitle, badge or tag..."
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
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grid"
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
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "table"
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

      {/* 5. Main Hero Slide Content */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#000000] animate-spin mx-auto opacity-50" />
          <p className="text-xs text-slate-500 font-medium">Loading hero slides...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 sm:p-16 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#000000]/5 text-[#000000] flex items-center justify-center mx-auto">
            <Sliders className="w-6 h-6 text-[#FED501]" />
          </div>
          <div>
            <h3 className="text-base font-bold font-serif text-[#000000]">
              No hero slides found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {search
                ? `No slides matching "${search}"`
                : "Create your first homepage showcase banner or load default slides."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleSeedDefaults}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Load Defaults
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-5 py-2.5 rounded-xl bg-[#000000] text-white text-xs font-bold hover:bg-[#1A1A1A] transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#FED501]" />
              <span>Add Slide</span>
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((slide, index) => {
            const isRecentlySaved = recentlyUpdatedId === slide.id;
            return (
              <div
                key={slide.id}
                className={`bg-white border rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-500 flex flex-col justify-between group ${isRecentlySaved
                  ? "border-[#FED501] ring-2 ring-[#FED501] bg-amber-50/20 shadow-md"
                  : slide.isActive
                    ? "border-slate-200/80 hover:border-[#FED501]/50"
                    : "border-slate-200/60 opacity-75 bg-slate-50/40"
                  }`}
              >
                {/* Banner Image Stage */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                  <ImageWithFallback
                    src={slide.image}
                    alt={slide.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    fallbackTitle={slide.title}
                    fallbackSubtitle={slide.subtitle || slide.price || undefined}
                    fallbackBadge={slide.badge}
                    fallbackVariant="md"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Order & Status Badges */}
                  <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full bg-[#000000]/90 backdrop-blur-md text-[10px] font-bold text-white shadow-xs">
                      #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(slide)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1 ${slide.isActive
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-800"
                        }`}
                      title="Click to toggle visibility"
                    >
                      {slide.isActive ? (
                        <>
                          <Eye className="w-3 h-3" /> Live
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> Hidden
                        </>
                      )}
                    </button>
                    {isRecentlySaved && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FED501] text-[#000000] text-[9px] font-extrabold uppercase tracking-wider animate-pulse shadow-xs flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Just Saved
                      </span>
                    )}
                  </div>

                  {/* Promo Badge & Price */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 z-10 flex items-end justify-between text-white">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#FED501] bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs">
                      {slide.badge}
                    </span>
                    {slide.price && (
                      <span className="text-base font-extrabold text-[#FED501] drop-shadow-sm">
                        {slide.price}
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between space-y-3 sm:space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-[#000000] group-hover:text-[#FED501] transition-colors line-clamp-1">
                      {slide.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {slide.subtitle || "No subtitle provided"}
                    </p>
                    {slide.tag && (
                      <span className="inline-block text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-1">
                        {slide.tag}
                      </span>
                    )}
                  </div>

                  {/* Actions Footer with Reorder and Edit/Delete */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    {/* Move Up/Down Order Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, "up")}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, "down")}
                        disabled={index === filtered.length - 1}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={slide.link}
                        target="_blank"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-[#FED501] hover:text-[#000000] text-slate-700 transition-colors"
                        title="Test Destination Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(slide)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-[#000000] hover:text-white text-slate-700 transition-colors cursor-pointer"
                        title="Edit Slide"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(slide)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
                        title="Delete Slide"
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
                  <th className="py-4 px-6 text-center">Order</th>
                  <th className="py-4 px-6">Slide</th>
                  <th className="py-4 px-6">Badge & Tag</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Target Link</th>
                  <th className="py-4 px-6 text-center">Visibility</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((slide, index) => {
                  const isRecentlySaved = recentlyUpdatedId === slide.id;
                  return (
                    <tr
                      key={slide.id}
                      className={`transition-all duration-500 ${isRecentlySaved
                        ? "bg-amber-50/80 ring-2 ring-[#FED501] ring-inset"
                        : "hover:bg-slate-50/60"
                        }`}
                    >
                      {/* Order Controls */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(index, "up")}
                            disabled={index === 0}
                            className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-slate-700 font-mono w-5">
                            #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(index, "down")}
                            disabled={index === filtered.length - 1}
                            className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Slide Image + Title */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative w-14 h-10 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 shadow-xs">
                            <ImageWithFallback
                              src={slide.image}
                              alt={slide.title}
                              fill
                              className="object-cover"
                              fallbackTitle={slide.title}
                              fallbackVariant="sm"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-serif font-bold text-sm text-[#000000] block">
                                {slide.title}
                              </span>
                              {isRecentlySaved && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FED501] text-[#000000] text-[9px] font-extrabold uppercase tracking-wider animate-pulse shadow-xs">
                                  <Sparkles className="w-2.5 h-2.5" /> Just Saved
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 truncate block max-w-xs">
                              {slide.subtitle}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Badge & Tag */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-[#FED501]/15 text-[#000000] font-bold text-[10px]">
                            {slide.badge}
                          </span>
                          {slide.tag && (
                            <span className="block text-[10px] text-slate-400 truncate">
                              {slide.tag}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 font-bold text-[#000000]">
                        {slide.price || "—"}
                      </td>

                      {/* Link */}
                      <td className="py-4 px-6 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                        {slide.link}
                      </td>

                      {/* Visibility Toggle */}
                      <td className="py-4 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(slide)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-xs cursor-pointer transition-colors inline-flex items-center gap-1 ${slide.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                            }`}
                        >
                          {slide.isActive ? (
                            <>
                              <Eye className="w-3 h-3 text-emerald-600" /> Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-slate-400" /> Hidden
                            </>
                          )}
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={slide.link}
                            target="_blank"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-[#FED501] hover:text-[#000000] text-slate-600 transition-colors"
                            title="Preview Destination Link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(slide)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-[#000000] hover:text-white text-slate-600 transition-colors cursor-pointer"
                            title="Edit Slide"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(slide)}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
                            title="Delete Slide"
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

      {/* 6. CREATE & EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8 border border-slate-200 shadow-2xl relative animate-scale-up space-y-5 sm:space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#000000]/5 flex items-center justify-center text-[#000000] shrink-0">
                  <Sliders className="w-5 h-5 text-[#FED501]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-serif font-bold text-[#000000]">
                    {formData.id ? "Edit Hero Showcase Slide" : "Create New Hero Showcase Slide"}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Controls homepage carousel headline, background image, pricing, and button destination.
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

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Slide Headline Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alaari Crimson & Gold Fila"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#000000] font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Subtitle Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lustrous Metallic Aso-Oke with Gold Pinstripes"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, subtitle: e.target.value }))
                    }
                    className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#000000]"
                  />
                </div>
              </div>

              {/* Promo Badge, Tag & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Promo Badge *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Imperial Alaari"
                    value={formData.badge}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, badge: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#000000]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Heritage Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Master Oyo Weave"
                    value={formData.tag}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tag: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#000000]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Price Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₦58,000"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#000000] font-semibold text-[#000000]"
                  />
                </div>
              </div>

              {/* Destination Link with Suggestions */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  CTA Button Destination Link *
                </label>
                <input
                  type="text"
                  required
                  placeholder="/products/alaari-crimson-metallic-gold-pinstripe-fila"
                  value={formData.link}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, link: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#000000] text-[#000000] font-semibold"
                />

                {/* Quick Link Selector Pills */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-slate-400 font-semibold">Quick select:</span>
                  {suggestedLinks.map((item) => (
                    <button
                      key={item.url}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, link: item.url }))}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-[#000000] hover:text-white text-slate-600 text-[10px] transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner Image Upload / URL with Delete Feature */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="block font-bold text-slate-700 text-xs">
                  Banner Photo *
                </label>

                <div className="flex items-center gap-3">
                  {/* Thumbnail Preview */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 group">
                    {formData.image && formData.image.trim() ? (
                      <>
                        <ImageWithFallback
                          src={formData.image}
                          alt="Banner Preview"
                          fill
                          className="object-cover"
                          fallbackTitle={formData.title || "Preview"}
                          fallbackVariant="sm"
                        />
                        <button
                          type="button"
                          onClick={handleDeleteImage}
                          disabled={isDeletingImage}
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
                          onClick={handleDeleteImage}
                          disabled={isDeletingImage}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Or enter image URL (/images/hero/... or https://...)"
                      value={formData.image}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, image: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-[#000000]"
                    />
                  </div>
                </div>
              </div>

              {/* Visibility Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-[#000000] focus:ring-[#000000] accent-[#000000]"
                  />
                  <div>
                    <span className="font-bold text-slate-700 block">
                      Active on Homepage Carousel
                    </span>
                    <span className="text-[10px] text-slate-400">
                      When checked, this slide will rotate live on the storefront homepage
                    </span>
                  </div>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white font-bold transition-all shadow-md shadow-[#000000]/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#FED501]" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#FED501]" />
                      <span>{formData.id ? "Update Slide" : "Publish Slide"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}

      {/* 7. CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Hero Slide?"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This will permanently remove it from the homepage carousel rotation.`}
        confirmLabel={deleting ? "Deleting..." : "Yes, Delete Slide"}
        variant="danger"
        isLoading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

