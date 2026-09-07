"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import ShareModal, { SharePreviewData } from "./ShareModal";
import { formatSizeLabel } from "@/lib/sizing";
import { cn } from "@/lib/utils";

export interface ShareProductData {
  id: string;
  name: string;
  slug?: string;
  price: number;
  images?: string[];
  collection?: {
    name: string;
  };
}

interface ShareProductButtonProps {
  product: ShareProductData;
  selectedSize?: string;
  variant?: "cart-row" | "drawer-row" | "icon" | "button" | "subtle";
  className?: string;
  buttonText?: string;
  size?: number;
}

export default function ShareProductButton({
  product,
  selectedSize,
  variant = "cart-row",
  className,
  buttonText = "Share",
  size = 14,
}: ShareProductButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  const productPath = `/products/${product.slug || product.id}`;
  const sizeLabel = selectedSize ? formatSizeLabel(selectedSize) : null;
  const sizeText = sizeLabel ? ` (Size: ${sizeLabel})` : "";
  const shareText = `Discover "${product.name}"${sizeText} on Fìlà Yorùbá — Handcrafted Yoruba Heritage & Ceremonial Luxury:`;

  const preview: SharePreviewData = {
    name: product.name,
    details: sizeLabel
      ? `Selected Size: ${sizeLabel}`
      : product.collection?.name || "Authentic Yoruba Ceremonial Fila",
    price: product.price,
    image: product.images?.[0] || "",
  };

  return (
    <>
      {variant === "cart-row" && (
        <button
          type="button"
          onClick={handleOpen}
          aria-label={`Share ${product.name}`}
          title="Share this piece"
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-black/30 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-black transition-all cursor-pointer shadow-2xs active:scale-95",
            className
          )}
        >
          <Share2 className="w-3.5 h-3.5 text-[#FED501] shrink-0" />
          <span>{buttonText}</span>
        </button>
      )}

      {variant === "drawer-row" && (
        <button
          type="button"
          onClick={handleOpen}
          aria-label={`Share ${product.name}`}
          title="Share this piece"
          className={cn(
            "p-1.5 text-slate-400 hover:text-black hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0",
            className
          )}
        >
          <Share2 className="w-3.5 h-3.5 text-[#FED501]" />
        </button>
      )}

      {variant === "icon" && (
        <button
          type="button"
          onClick={handleOpen}
          aria-label={`Share ${product.name}`}
          title={`Share ${product.name}`}
          className={cn(
            "rounded-full bg-white/90 backdrop-blur-xs p-2.5 text-[#000000] shadow-sm hover:scale-105 hover:text-[#FED501] hover:bg-black transition-all cursor-pointer border border-slate-200/60",
            className
          )}
        >
          <Share2 size={size} />
        </button>
      )}

      {variant === "subtle" && (
        <button
          type="button"
          onClick={handleOpen}
          aria-label={`Share ${product.name}`}
          title="Share this piece"
          className={cn(
            "p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center justify-center",
            className
          )}
        >
          <Share2 size={size} />
        </button>
      )}

      {variant === "button" && (
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            "inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 hover:text-black transition-all cursor-pointer shadow-2xs hover:scale-[1.01] active:scale-[0.99]",
            className
          )}
        >
          <Share2 size={size} className="text-[#FED501]" />
          <span>{buttonText}</span>
        </button>
      )}

      <ShareModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Share ${product.name}`}
        subtitle="Heritage Yoruba Ceremonial Fila Cap"
        shareUrl={productPath}
        shareText={shareText}
        preview={preview}
      />
    </>
  );
}
