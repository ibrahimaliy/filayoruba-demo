"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export interface ImageFallbackCardProps {
  /** Optional title for accessibility or backward compatibility */
  title?: string;
  /** Preserved for backward compatibility */
  subtitle?: string;
  /** Preserved for backward compatibility */
  badge?: string;
  /** Preserved for backward compatibility */
  icon?: LucideIcon;
  /** Variant sizing: 'sm' (cart/thumbnail), 'md' (product cards), 'lg'/'fill' (gallery/hero) */
  variant?: "sm" | "md" | "lg" | "fill";
  /** Optional class names to override/extend styling */
  className?: string;
  /** Preserved for backward compatibility */
  showIcon?: boolean;
}

const FALLBACK_LOGO_SRC = "/images/fallback%20logo/fallback%20logo.jpg";

export default function ImageFallbackCard({
  title,
  variant = "fill",
  className = "",
}: ImageFallbackCardProps) {
  // 1. Compact Thumbnail Variant (Cart items, small checkout list, order tracking previews)
  if (variant === "sm") {
    return (
      <div
        className={`relative w-full h-full min-h-[48px] flex flex-col items-center justify-center p-2 bg-gradient-to-br from-[#000000] via-[#050505] to-[#000000] border border-[#FED501]/15 rounded-xl overflow-hidden select-none ${className}`}
        aria-label={title || "Fìlà Yorùbá"}
      >
        {/* Ambient radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(254, 213, 1,0.12)_0%,transparent_75%)] pointer-events-none" />

        <div className="relative z-10 w-7 h-7 rounded-full overflow-hidden shadow-xs ring-1 ring-[#FED501]/30 isolate shrink-0">
          <img
            src={FALLBACK_LOGO_SRC}
            alt="Fìlà Yorùbá"
            className="w-full h-full object-cover rounded-full scale-[1.65]"
            loading="eager"
          />
        </div>
      </div>
    );
  }

  // 2. Medium Variant (Product Grid Cards, Collection Cards)
  if (variant === "md") {
    return (
      <div
        className={`relative w-full h-full min-h-[160px] flex flex-col items-center justify-center p-5 sm:p-6 bg-gradient-to-br from-[#000000] via-[#050505] to-[#000000] border border-[#FED501]/15 rounded-2xl overflow-hidden select-none group ${className}`}
        aria-label={title || "Fìlà Yorùbá"}
      >
        {/* Ambient Back Glows */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#FED501]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-[#FED501]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(254, 213, 1,0.12)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#FED501_0.75px,transparent_0.75px)] [background-size:18px_18px] opacity-[0.06] pointer-events-none" />

        {/* Circular Logo 50% rounded */}
        <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shadow-lg shadow-black/50 ring-2 ring-[#FED501]/30 group-hover:scale-105 group-hover:ring-[#FED501]/60 transition-all duration-300 isolate shrink-0">
          <img
            src={FALLBACK_LOGO_SRC}
            alt="Fìlà Yorùbá"
            className="w-full h-full object-cover rounded-full scale-[1.65]"
            loading="eager"
          />
        </div>
      </div>
    );
  }

  // 3. Large & Fill Variant (Hero, Guides Stage, Product Detail, Editorial Gallery)
  return (
    <div
      className={`relative w-full h-full min-h-[220px] flex flex-col items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-[#000000] via-[#050505] to-[#000000] border border-[#FED501]/20 rounded-2xl sm:rounded-3xl overflow-hidden select-none group ${className}`}
      aria-label={title || "Fìlà Yorùbá"}
    >
      {/* Decorative Gold Ambient Glows */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#FED501]/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#FED501]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(254, 213, 1,0.14)_0%,rgba(254, 213, 1,0.02)_50%,transparent_75%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#FED501_0.75px,transparent_0.75px)] [background-size:22px_22px] opacity-[0.08] pointer-events-none" />

      {/* Circular Logo 50% rounded with subtle ambient glow */}
      <div className="relative z-10 group-hover:scale-105 transition-all duration-300">
        <div className="absolute -inset-3 rounded-full bg-[#FED501]/15 blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden shadow-2xl shadow-black/60 ring-2 sm:ring-4 ring-[#FED501]/35 group-hover:ring-[#FED501]/70 transition-all duration-300 isolate shrink-0">
          <img
            src={FALLBACK_LOGO_SRC}
            alt="Fìlà Yorùbá"
            className="w-full h-full object-cover rounded-full scale-[1.65]"
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
}
