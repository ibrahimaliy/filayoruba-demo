"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import ShareModal, { SharePreviewData } from "./ShareModal";
import { useWishlistStore } from "@/store/wishlist-store";
import { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface ShareWishlistButtonProps {
  products?: Product[];
  variant?: "outline" | "icon" | "button";
  className?: string;
  buttonText?: string;
  size?: number;
}

export default function ShareWishlistButton({
  products = [],
  variant = "outline",
  className,
  buttonText = "Share Wishlist",
  size = 15,
}: ShareWishlistButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const productIds = useWishlistStore((state) => state.productIds);

  if (productIds.length === 0) return null;

  const count = productIds.length;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const sharePath = `/wishlist?items=${encodeURIComponent(productIds.join(","))}`;
  const shareUrl = origin ? `${origin}${sharePath}` : sharePath;

  const firstProduct = products.find((p) => productIds.includes(p.id));
  const preview: SharePreviewData = {
    name: `Curated Wishlist (${count} ${count === 1 ? "Piece" : "Pieces"})`,
    details: firstProduct
      ? `Includes ${firstProduct.name}${count > 1 ? ` and ${count - 1} more` : ""}`
      : "Handcrafted Yoruba ceremonial caps",
    price: firstProduct?.price,
    image: firstProduct?.images?.[0] || "",
  };

  const shareText = `Explore my curated Yoruba Fila wishlist on Fìlà Yorùbá (${count} authentic handcrafted ${count === 1 ? "piece" : "pieces"}):`;

  return (
    <>
      {variant === "icon" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Share curated wishlist"
          title="Share wishlist"
          className={cn(
            "p-2 rounded-xl text-slate-500 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center",
            className
          )}
        >
          <Share2 size={size} />
        </button>
      )}

      {variant === "outline" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Share wishlist"
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-black transition-colors cursor-pointer shadow-2xs",
            className
          )}
        >
          <Share2 size={size} className="text-[#FED501]" />
          <span>{buttonText}</span>
        </button>
      )}

      {variant === "button" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Share wishlist"
          className={cn(
            "w-full py-3 rounded-xl border border-slate-200 hover:border-black/30 hover:bg-slate-50 text-[#000000] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs",
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
        title="Share Your Curated Wishlist"
        subtitle={`${count} handcrafted ${count === 1 ? "piece" : "pieces"} saved in your collection`}
        shareUrl={shareUrl}
        shareText={shareText}
        preview={preview}
      />
    </>
  );
}
