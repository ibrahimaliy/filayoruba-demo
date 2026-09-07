"use client";

import { useState, useRef } from "react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import Link from "next/link";
import {
  MapPin,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crown,
  Layers,
} from "lucide-react";
import { galleryImages, GalleryItem } from "@/data/gallery";

export default function Gallery() {
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);

  // Mobile Carousel State (Matches sample image)
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // Touch swiping refs
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const activeMobileItem = galleryImages[currentSlide];

  // Carousel navigation
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
  };

  // Swipe gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Lightbox Navigation (Next / Previous)
  const currentIndex = activeItem
    ? galleryImages.findIndex((item) => item.id === activeItem.id)
    : -1;

  const navigateLightbox = (direction: "prev" | "next") => {
    if (currentIndex === -1) return;
    if (direction === "prev") {
      const prevIdx = currentIndex > 0 ? currentIndex - 1 : galleryImages.length - 1;
      setActiveItem(galleryImages[prevIdx]);
    } else {
      const nextIdx = currentIndex < galleryImages.length - 1 ? currentIndex + 1 : 0;
      setActiveItem(galleryImages[nextIdx]);
    }
  };

  // Desktop 4-column groupings
  const col1Items = [galleryImages[0], galleryImages[1]];
  const col2Items = [galleryImages[2], galleryImages[3]];
  const featuredItem = galleryImages[4];
  const col4Items = [galleryImages[5], galleryImages[6]];

  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-[#050505] text-white relative overflow-hidden">
      {/* Subtle Background Luxury Watermark */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(#FED501_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(#FED501_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

      <div className="container mx-auto px-3 sm:px-6 max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 lg:mb-16">
          <span className="text-[11px] sm:text-sm font-bold uppercase tracking-[0.25em] text-[#FED501] block mb-2">
            MOMENTS THAT INSPIRE
          </span>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-normal text-white tracking-tight">
            Moments of <span className="text-[#FED501] font-semibold italic">Elegance</span>
          </h2>

          {/* Golden Diamond Divider */}
          <div className="flex items-center justify-center gap-3 my-3 sm:my-4">
            <div className="h-[1px] w-12 sm:w-16 bg-gradient-to-r from-transparent to-[#FED501]/80" />
            <div className="w-2.5 h-2.5 rotate-45 border border-[#FED501] bg-[#FED501]/20 flex items-center justify-center">
              <div className="w-1 h-1 bg-[#FED501]" />
            </div>
            <div className="h-[1px] w-12 sm:w-16 bg-gradient-to-l from-transparent to-[#FED501]/80" />
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light px-2">
            Real moments. Real people. Timeless tradition.
            <br className="hidden sm:inline" />
            {" "}Discover how Fìlà Yorùbá complements every legacy.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE / SMALL SCREENS: CAROUSEL CARD (Matching user sample image)        */}
        {/* ========================================================================= */}
        <div className="lg:hidden max-w-md mx-auto">
          <article className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300">
            {/* 1. Main Carousel Card (Replicates the sample image exact layout) */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => setActiveItem(activeMobileItem)}
              className="relative aspect-[4/5] w-full min-h-[440px] bg-[#000000] overflow-hidden select-none cursor-pointer group touch-pan-y"
            >
              {/* Active Image */}
              <ImageWithFallback
                key={activeMobileItem.id}
                src={activeMobileItem.src}
                alt={activeMobileItem.alt}
                fill
                priority
                sizes="(max-width: 640px) 100vw, 450px"
                className="object-cover object-center transition-all duration-500 animate-in fade-in zoom-in-95 duration-300"
                fallbackTitle={activeMobileItem.title}
                fallbackSubtitle={activeMobileItem.location}
                fallbackBadge="Editorial Archive"
                fallbackVariant="lg"
              />

              {/* Dark Gradient Overlay at Bottom for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90 pointer-events-none" />

              {/* Top Right Photo Index Badge & Lightbox Trigger */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white/90 border border-white/10 shadow-sm">
                  {currentSlide + 1}/{galleryImages.length}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveItem(activeMobileItem);
                  }}
                  aria-label="Expand image preview"
                  className="w-7 h-7 rounded-full bg-black/60 hover:bg-[#FED501] text-white hover:text-[#000000] backdrop-blur-md flex items-center justify-center transition-all border border-white/10 shadow-md cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Floating Circular Prev Navigation Button (Left Edge) */}
              {currentSlide > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevSlide();
                  }}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-900 shadow-xl flex items-center justify-center transition-transform active:scale-90 cursor-pointer backdrop-blur-sm"
                >
                  <ChevronLeft className="w-4 h-4 ml-[-1px]" />
                </button>
              )}

              {/* Floating Circular Next Navigation Button (Right Edge) - Exactly matching sample */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                aria-label="Next image"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-900 shadow-xl flex items-center justify-center transition-transform active:scale-90 cursor-pointer backdrop-blur-sm"
              >
                <ChevronRight className="w-4 h-4 mr-[-1px]" />
              </button>

              {/* BOTTOM TEXT OVERLAY MATCHING SAMPLE IMAGE WITH EMBLEM LINE */}
              <div className="absolute inset-x-4 bottom-5 z-10 flex flex-col items-center text-center pointer-events-none">
                {/* Horizontal divider with circular emblem (Matching sample screenshot) */}
                <div className="w-full flex items-center justify-center gap-2 mb-2 opacity-90">
                  <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent to-[#FED501]" />
                  <div className="w-3.5 h-3.5 rounded-full border border-[#FED501] flex items-center justify-center bg-[#050505]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FED501]" />
                  </div>
                  <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent to-[#FED501]" />
                </div>

                {/* Big Bold Headline (Sample: "12 IMAGES WITH DEEP MEANINGS") */}
                <h3 className="font-serif font-black uppercase tracking-tight text-2xl sm:text-3xl text-[#FAF9F6] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] leading-tight">
                  {activeMobileItem.title}
                </h3>

                {/* Sub-headline Category & Origin */}
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] font-semibold text-[#FED501] mt-1 drop-shadow">
                  {activeMobileItem.category} • {activeMobileItem.location}
                </p>
              </div>
            </div>

            {/* 2. Bottom Carousel Pagination Dots (Matching sample screenshot dots) */}
            <div className="flex items-center justify-center gap-1.5 py-3 bg-[#000000]">
              {galleryImages.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentSlide
                      ? "w-2.5 h-2.5 bg-[#FED501] ring-2 ring-[#FED501]/40 shadow-sm"
                      : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </article>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP / LARGE SCREENS: 4-COLUMN LUXURY EDITORIAL GRID (hidden on mobile)*/}
        {/* ========================================================================= */}
        <div className="hidden lg:grid grid-cols-4 gap-6 items-stretch">
          {/* Column 1 (2 Stacked Cards) */}
          <div className="flex flex-col gap-6">
            {col1Items.map((item) => (
              <GalleryCard key={item.id} item={item} onInspect={() => setActiveItem(item)} />
            ))}
          </div>

          {/* Column 2 (2 Stacked Cards) */}
          <div className="flex flex-col gap-6">
            {col2Items.map((item) => (
              <GalleryCard key={item.id} item={item} onInspect={() => setActiveItem(item)} />
            ))}
          </div>

          {/* Column 3 (Tall Featured Full-Height Card) */}
          {featuredItem && (
            <div className="h-full min-h-[500px]">
              <GalleryCard
                item={featuredItem}
                isFeatured
                onInspect={() => setActiveItem(featuredItem)}
              />
            </div>
          )}

          {/* Column 4 (2 Stacked Cards) */}
          <div className="flex flex-col gap-6">
            {col4Items.map((item) => (
              <GalleryCard key={item.id} item={item} onInspect={() => setActiveItem(item)} />
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LUXURY FULLSCREEN LIGHTBOX MODAL (Available on desktop & mobile zoom)     */}
      {/* ========================================================================= */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative bg-[#111111] border border-white/15 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col md:flex-row text-white">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              aria-label="Close preview"
              className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-[#FED501] text-white hover:text-[#000000] flex items-center justify-center transition-all hover:scale-110 cursor-pointer shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left/Top: High-Res Image with Next/Prev Controls */}
            <div className="relative md:w-1/2 aspect-square md:aspect-auto min-h-[260px] md:min-h-[480px] bg-[#000000]">
              <ImageWithFallback
                src={activeItem.src}
                alt={activeItem.alt}
                fill
                priority
                sizes="(min-width: 768px) 500px, 100vw"
                className="object-cover object-center"
                fallbackTitle={activeItem.title}
                fallbackSubtitle={activeItem.location}
                fallbackBadge="Heritage Editorial"
                fallbackVariant="lg"
              />

              {/* Prev / Next Floating Arrows */}
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox("prev");
                  }}
                  className="w-10 h-10 rounded-full bg-black/60 hover:bg-[#FED501] text-white hover:text-[#000000] backdrop-blur-md flex items-center justify-center transition-all pointer-events-auto cursor-pointer shadow-md hover:scale-110"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox("next");
                  }}
                  className="w-10 h-10 rounded-full bg-black/60 hover:bg-[#FED501] text-white hover:text-[#000000] backdrop-blur-md flex items-center justify-center transition-all pointer-events-auto cursor-pointer shadow-md hover:scale-110"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Location Tag on Image */}
              <div className="absolute bottom-4 left-4 z-10">
                <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-semibold text-white/90 flex items-center gap-1 border border-white/10">
                  <MapPin className="w-3 h-3 text-[#FED501]" />
                  <span>{activeItem.location}</span>
                </span>
              </div>
            </div>

            {/* Right/Bottom: Story, Occasion, Etiquette & Collection CTA */}
            <div className="p-6 sm:p-8 md:w-1/2 flex flex-col justify-between overflow-y-auto space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#FED501] flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" />
                    <span>{activeItem.occasion || "Bespoke Yoruba Crown"}</span>
                  </span>

                  <span className="text-xs font-semibold text-slate-400">
                    {activeItem.collectionName}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight">
                    {activeItem.title}
                  </h3>
                  {activeItem.description && (
                    <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                      {activeItem.description}
                    </p>
                  )}
                </div>

                {/* Cultural Etiquette Card */}
                {activeItem.etiquetteTip && (
                  <div className="bg-white/5 border border-[#FED501]/20 rounded-2xl p-4 space-y-1.5 text-xs">
                    <span className="font-bold text-[#FED501] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-[#FED501]" /> Wearing & Fold Etiquette
                    </span>
                    <p className="text-slate-200 leading-relaxed font-light">
                      {activeItem.etiquetteTip}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href={`/products?collection=${activeItem.collectionSlug}`}
                  onClick={() => setActiveItem(null)}
                  className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-[#FED501] hover:bg-white text-[#000000] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FED501]/20 text-center"
                >
                  <Layers className="w-3.5 h-3.5 text-[#000000]" />
                  <span>See Similar Collection</span>
                </Link>

                {activeItem.capLink && (
                  <Link
                    href={activeItem.capLink}
                    onClick={() => setActiveItem(null)}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl border border-white/20 hover:border-[#FED501] text-white text-xs font-bold transition-colors text-center"
                  >
                    View Cap
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function GalleryCard({
  item,
  isFeatured = false,
  onInspect,
}: {
  item: GalleryItem;
  isFeatured?: boolean;
  onInspect: () => void;
}) {
  return (
    <div
      onClick={onInspect}
      className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#000000] border border-white/10 hover:border-[#FED501]/60 shadow-md hover:shadow-2xl hover:shadow-[#FED501]/15 transition-all duration-500 cursor-pointer flex flex-col justify-end ${
        isFeatured
          ? "h-full min-h-[380px] sm:min-h-[440px] lg:min-h-full aspect-auto"
          : "aspect-[4/3.8] sm:aspect-[4/3.6] lg:aspect-[4/3.5] w-full"
      }`}
    >
      {/* Background Image with Zoom */}
      <ImageWithFallback
        src={item.src}
        alt={item.alt}
        fill
        sizes={isFeatured ? "(min-width: 1024px) 25vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
        className="object-cover object-center group-hover:scale-106 transition-transform duration-700 brightness-90 group-hover:brightness-95"
        fallbackTitle={item.title}
        fallbackSubtitle={item.location}
        fallbackBadge="Signature Archive"
        fallbackVariant="md"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

      {/* Top Right Zoom Icon on Hover */}
      <div className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-[#FED501] text-white hover:text-[#000000] backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110 shadow-md">
        <Maximize2 className="w-3.5 h-3.5" />
      </div>

      {/* Bottom Content Matching Mockup */}
      <div className="relative z-10 p-4 sm:p-5 text-white space-y-1">
        <h3 className="font-serif font-bold text-base sm:text-lg lg:text-xl text-white group-hover:text-[#FED501] transition-colors leading-tight">
          {item.title}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-white/80 font-light">
          <MapPin className="w-3 h-3 text-[#FED501] shrink-0" />
          <span>{item.location}</span>
        </div>
      </div>
    </div>
  );
}


