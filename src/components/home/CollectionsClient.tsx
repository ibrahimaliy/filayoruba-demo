"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import {
  Crown,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  SlidersHorizontal,
  ShieldCheck,
  Layers,
  Compass,
  CheckCircle2,
} from "lucide-react";
import { Collection } from "@/types/collection";

interface CollectionItemProps {
  collection: Collection;
  index: number;
  productCount: number;
  image: string;
}

export default function CollectionsClient({
  collections,
  productCounts,
  fallbackImages,
}: {
  collections: Collection[];
  productCounts: Record<string, number>;
  fallbackImages: Record<string, string>;
}) {
  const [viewMode, setViewMode] = useState<"deck" | "grid">("deck");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -420 : 420;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const scrollToCollections = () => {
      if (typeof window !== "undefined" && window.location.hash === "#collections") {
        const el = document.getElementById("collections");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    };

    scrollToCollections();
    const timer = setTimeout(scrollToCollections, 200);

    window.addEventListener("hashchange", scrollToCollections);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", scrollToCollections);
    };
  }, []);

  return (
    <section id="collections" className="py-20 lg:py-28 bg-[#FAF9F6] relative overflow-hidden scroll-mt-24">
      {/* Ambient Background Watermark */}
      <div className="absolute inset-0 bg-[radial-gradient(#FED501_0.75px,transparent_0.75px)] [background-size:26px_26px] opacity-15 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        {/* Section Header with Dynamic Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 lg:mb-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#000000]/5 border border-[#000000]/10 text-xs font-bold uppercase tracking-widest text-[#FED501] mb-3">
              <Crown className="w-3.5 h-3.5 text-[#FED501]" />
              <span>Ancestral Yoruba Lineage</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#000000] tracking-tight leading-[1.15]">
              Yoruba Cap Collections
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Explore sovereign headwear families woven on ancestral Oyo & Iseyin narrow looms—designed to retain sculptural folds across generations.
            </p>
          </div>

          {/* Scalable Layout & Navigation Toolbar */}
          <div className="flex items-center gap-3 flex-wrap self-start lg:self-auto">
            {/* View Mode Toggle: Curated Deck vs Full Archive Matrix */}
            <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode("deck")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === "deck"
                    ? "bg-[#000000] text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Curated Carousel View"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Curated Deck</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#000000] text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Full Grid Matrix View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>All Archives ({collections.length})</span>
              </button>
            </div>

            {/* Carousel Nav Arrows (shown in deck view) */}
            {viewMode === "deck" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scroll("left")}
                  aria-label="Scroll collections left"
                  className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#000000] flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scroll("right")}
                  aria-label="Scroll collections right"
                  className="w-10 h-10 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-[#FED501]" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scalable Presentation: Deck View vs Grid Matrix View */}
        {viewMode === "deck" ? (
          /* Smooth Magnetic Deck Carousel (Accommodates 1 to 50+ collections) */
          <div
            ref={scrollRef}
            className="flex gap-6 sm:gap-7 overflow-x-auto pb-8 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pt-2"
          >
            {collections.map((col, index) => {
              const count = productCounts[col.slug] || col.productCount || 0;
              const img = col.image || fallbackImages[col.slug] || "";
              return (
                <div
                  key={col.id}
                  className="flex-shrink-0 w-72 sm:w-80 lg:w-[360px] snap-start"
                >
                  <CollectionCard
                    collection={col}
                    index={index}
                    productCount={count}
                    image={img}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          /* Responsive Multi-Column Matrix Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-2 animate-fade-in">
            {collections.map((col, index) => {
              const count = productCounts[col.slug] || col.productCount || 0;
              const img = col.image || fallbackImages[col.slug] || "";
              return (
                <CollectionCard
                  key={col.id}
                  collection={col}
                  index={index}
                  productCount={count}
                  image={img}
                />
              );
            })}
          </div>
        )}

        {/* Craftsmanship Guarantee & Heritage Strip */}
        <div className="mt-12 sm:mt-16 bg-white rounded-3xl border border-[#E8E1D5] p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="flex items-center gap-3.5 pt-4 sm:pt-0 sm:pr-4">
              <div className="w-11 h-11 rounded-2xl bg-[#000000]/5 text-[#000000] flex items-center justify-center shrink-0 border border-[#000000]/10">
                <Crown className="w-5 h-5 text-[#FED501]" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#000000]">
                  Narrow-Loom Weaves
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Woven on heritage strip-looms in Oyo & Iseyin.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-4 sm:pt-0 sm:px-4">
              <div className="w-11 h-11 rounded-2xl bg-[#000000]/5 text-[#000000] flex items-center justify-center shrink-0 border border-[#000000]/10">
                <ShieldCheck className="w-5 h-5 text-[#FED501]" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#000000]">
                  Pre-Formed Geometric Crease
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Structured to retain sovereign lines for years.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-4 sm:pt-0 sm:px-4">
              <div className="w-11 h-11 rounded-2xl bg-[#000000]/5 text-[#000000] flex items-center justify-center shrink-0 border border-[#000000]/10">
                <Layers className="w-5 h-5 text-[#FED501]" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#000000]">
                  Bespoke Crown Sizing
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exact circumference sizes from 54cm to 62cm.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-4 sm:pt-0 sm:pl-4">
              <div className="w-11 h-11 rounded-2xl bg-[#000000]/5 text-[#000000] flex items-center justify-center shrink-0 border border-[#000000]/10">
                <Compass className="w-5 h-5 text-[#FED501]" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#000000]">
                  Worldwide Express Delivery
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct artisan fulfillment to Nigeria, UK, US & worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CollectionCard({ collection, index, productCount, image }: CollectionItemProps) {
  const paddedIndex = String(index + 1).padStart(2, "0");
  const hasImage = Boolean(image && image.trim());

  return (
    <Link
      href={`/products?collection=${collection.slug}`}
      className="group relative flex flex-col justify-between aspect-[3/4.2] rounded-3xl overflow-hidden bg-[#000000] border border-[#E8E1D5] shadow-md hover:shadow-2xl hover:border-[#FED501] transition-all duration-500 p-6 sm:p-7 block"
    >
      {/* Background Image with Zoom & Uniform Gradient Fallback */}
      <ImageWithFallback
        src={image}
        alt={collection.name}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover object-center group-hover:scale-110 transition-transform duration-700 brightness-90 group-hover:brightness-95"
        fallbackTitle={collection.name}
        fallbackSubtitle="Master Archive"
        fallbackBadge="Yoruba Lineage"
        fallbackIcon={Layers}
        fallbackVariant="md"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/45 to-transparent opacity-85 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none" />

      {/* Top Floating Badges */}
      <div className="relative z-10 flex items-center justify-between pointer-events-none">
        <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-[#000000] shadow-xs">
          Archive &bull; {paddedIndex}
        </span>

        <span className="px-2.5 py-1 rounded-full bg-[#000000]/80 backdrop-blur-md text-[#FED501] text-[11px] font-bold border border-[#FED501]/30 shadow-xs">
          {productCount > 0 ? `${productCount} Mastercrafted Caps` : "Bespoke Family"}
        </span>
      </div>

      {/* Bottom Content */}
      <div className="relative z-10 space-y-2 pt-20">
        <span className="text-[10px] uppercase tracking-widest text-[#FED501] font-bold block">
          Artisan Yoruba Family
        </span>

        <h3 className="text-xl sm:text-2xl font-serif font-bold text-white group-hover:text-[#FED501] transition-colors leading-tight">
          {collection.name}
        </h3>

        <p className="text-xs text-white/80 line-clamp-2 leading-relaxed font-normal">
          {collection.description}
        </p>

        <div className="pt-2 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 group-hover:bg-[#FED501] group-hover:text-[#000000] text-white text-xs font-bold transition-all duration-300 backdrop-blur-xs">
            <span>Explore Collection</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>

          <span className="text-[11px] font-mono text-white/60">
            Fìlà Yorùbá Lineage
          </span>
        </div>
      </div>
    </Link>
  );
}
