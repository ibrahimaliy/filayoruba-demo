"use client";

import { useState } from "react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { Sparkles } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const displayImages = images.length > 0 ? images : [""];
  const activeImage = displayImages[selectedIndex] || displayImages[0] || "";

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Stage */}
      <div className="relative aspect-[4/4.5] sm:aspect-square w-full overflow-hidden rounded-2xl bg-[#F8FAFC] border border-slate-200/80 shadow-sm group">
        <ImageWithFallback
          src={activeImage}
          alt={name}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          fallbackTitle={name}
          fallbackSubtitle="Authentic Handcrafted Fìlà"
          fallbackBadge="Master Weave"
          fallbackVariant="lg"
        />

        {/* Subtle Luxury Tag */}
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/60 text-[11px] font-semibold text-[#000000] shadow-sm">
            <Sparkles className="w-3 h-3 text-[#FED501]" /> Authentic Aso-Oke
          </span>
        </div>
      </div>

      {/* Thumbnails Row */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {displayImages.map((img, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={img + idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                aria-label={`View image ${idx + 1} of ${name}`}
                className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#FED501] shadow-md ring-2 ring-[#FED501]/30"
                    : "border-transparent opacity-70 hover:opacity-100 bg-slate-100"
                }`}
              >
                <ImageWithFallback
                  src={img}
                  alt={`${name} thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover object-center"
                  fallbackTitle={`${name} (${idx + 1})`}
                  fallbackVariant="sm"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
