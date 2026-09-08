"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Ruler,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { HeroSlide } from "@/types/hero";
import { heroSlides as defaultHeroSlides } from "@/data/hero-slides";

interface HeroProps {
  slides?: HeroSlide[];
}

export default function Hero({ slides }: HeroProps) {
  const activeSlides = slides && slides.length > 0 ? slides : defaultHeroSlides;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  // Autoplay timer every 5 seconds (pauses on hover)
  useEffect(() => {
    if (isPaused || activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [nextSlide, isPaused, activeSlides.length]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF9F6] to-white border-b border-[#E4E4E7] pt-12 sm:pt-14 pb-16 lg:pt-16 lg:pb-24">
      {/* Subtle Background Radial Aura (Clean CSS radial gradient without GPU blur tile artifacts on iOS) */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[radial-gradient(circle,rgba(254,213,1,0.14)_0%,transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr] gap-8 md:gap-10 lg:gap-16 items-center">
          {/* Left Column: Editorial Headline & Copy */}
          <div className="space-y-6 animate-fade-up">
            <div className="relative z-10 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/5 border border-black/10 text-xs font-bold text-[#000000] shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#FED501] shrink-0" />
              <span>Fìlà Yorùbá &bull; Crafted For Thoroughbred Gentlemen</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif text-[#000000] tracking-tight leading-[1.1]">
              Regal Elegance. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#000000] via-[#1A1A1A] to-[#FED501] [-webkit-text-fill-color:transparent] [-webkit-box-decoration-break:clone]">
                Ancestral Craftsmanship.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              Authentic handcrafted Yoruba Fila caps loomed with ancestral reverence. Masterfully woven in vintage Sányán silk, Alaari crimson, royal Gòbì folds, and celestial embroidered velvet for weddings, coronations, and discerning gentlemen.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                href="/products"
                className="px-7 py-4 rounded-2xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs sm:text-sm font-bold transition-all shadow-xl shadow-black/15 flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Explore All Filas</span>
                <ArrowRight className="w-4 h-4 text-[#FED501]" />
              </Link>
            </div>

            {/* Trust Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FED501] shrink-0" />
                <div>
                  <span className="font-bold text-[#000000] block">100% Handwoven</span>
                  <span className="text-[10px] text-slate-500">Ancestral Aṣọ Òkè</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#000000] shrink-0" />
                <div>
                  <span className="font-bold text-[#000000] block">1–3 Days Dispatch</span>
                  <span className="text-[10px] text-slate-500">Nationwide Delivery</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-[#000000] block">Custom Sizing</span>
                  <span className="text-[10px] text-slate-500">22″ to 25″ (XS–3XL)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Animated Hero Image Stage */}
          <div
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Main Featured Cap Stage Frame */}
            <div className="relative aspect-[4/4.5] sm:aspect-square w-full rounded-3xl overflow-hidden bg-white border border-[#E8E1D5] shadow-2xl shadow-black/10 group">
              {/* Slides Render with Crossfade Transition */}
              {activeSlides.map((slide, idx) => {
                const isActive = idx === currentSlide;
                return (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                      isActive
                        ? "opacity-100 scale-100 z-10"
                        : "opacity-0 scale-95 pointer-events-none z-0"
                    }`}
                  >
                    <ImageWithFallback
                      src={slide.image}
                      alt={slide.title}
                      fill
                      priority={idx === 0}
                      sizes="(min-width: 1024px) 45vw, 100vw"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      fallbackTitle={slide.title}
                      fallbackSubtitle={slide.subtitle || "Authentic Yoruba Fìlà"}
                      fallbackBadge={slide.badge || "Signature Edition"}
                      fallbackVariant="lg"
                    />

                    {/* Gradient Scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/85 via-[#000000]/20 to-transparent" />

                    {/* Bottom Showcase Tag Info */}
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <div className="space-y-1 max-w-md">
                        <span className="inline-block text-[10px] uppercase tracking-widest text-[#FED501] font-bold bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full mb-1">
                          {slide.badge}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold font-serif leading-tight truncate">
                          {slide.title}
                        </h3>
                        {slide.subtitle && (
                          <span className="text-xs text-white/80 block truncate">
                            {slide.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Slider Manual Arrows */}
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous Slide"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-[#000000] backdrop-blur-md flex items-center justify-center shadow-lg transition-all hover:scale-110 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next Slide"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-[#000000] backdrop-blur-md flex items-center justify-center shadow-lg transition-all hover:scale-110 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Slide Progress Dots / Indicators */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md p-1.5 rounded-full">
                {activeSlides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentSlide
                        ? "w-6 bg-[#FED501]"
                        : "w-2 bg-white/50 hover:bg-white"
                    }`}
                  />
                ))}
              </div>

            </div>

            {/* Floating Review Badge */}
            <div className="absolute -top-4 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md border border-slate-200 p-3.5 rounded-2xl shadow-xl flex items-center gap-3 hidden sm:flex z-20 pointer-events-none">
              <div className="w-9 h-9 rounded-xl bg-[#000000] text-[#FED501] flex items-center justify-center font-bold font-serif text-sm shadow-sm">
                5★
              </div>
              <div>
                <div className="flex items-center gap-1 text-[#FED501]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3 h-3 fill-[#FED501]" />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-[#000000] block mt-0.5">
                  Master Artisan Quality
                </span>
                <span className="text-[9px] text-slate-400">Over 2,500+ caps crafted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
