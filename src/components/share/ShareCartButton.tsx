"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import ShareModal, { SharePreviewData } from "./ShareModal";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";

interface ShareCartButtonProps {
  variant?: "button" | "icon" | "outline" | "minimal";
  className?: string;
  buttonText?: string;
  size?: number;
}

export default function ShareCartButton({
  variant = "outline",
  className,
  buttonText = "Share Bag",
  size = 14,
}: ShareCartButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const items = useCartStore((state) => state.items);

  if (items.length === 0) return null;

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  // Generate payload for deep-linking
  const sharePayload = items.map((i) => ({
    id: i.product.id,
    size: i.selectedSize,
    q: i.quantity,
  }));

  let encodedPayload = "";
  try {
    const jsonStr = JSON.stringify(sharePayload);
    if (typeof window !== "undefined") {
      encodedPayload = encodeURIComponent(btoa(encodeURIComponent(jsonStr)));
    } else {
      encodedPayload = encodeURIComponent(Buffer.from(jsonStr).toString("base64"));
    }
  } catch {
    encodedPayload = encodeURIComponent(JSON.stringify(sharePayload));
  }

  const sharePath = `/cart?share=${encodedPayload}`;

  const firstItem = items[0];
  const otherCount = items.length - 1;
  const details =
    otherCount > 0
      ? `Includes ${firstItem.product.name} + ${otherCount} other ${otherCount === 1 ? "cap" : "caps"}`
      : `Includes ${firstItem.product.name}`;

  const preview: SharePreviewData = {
    name: `Curated Bag (${totalItemsCount} ${totalItemsCount === 1 ? "Piece" : "Pieces"})`,
    details,
    price: subtotal,
    image: firstItem?.product?.images?.[0] || "",
  };

  const shareText = `Explore my curated Yoruba Fila shopping bag on Fìlà Yorùbá (${totalItemsCount} ${totalItemsCount === 1 ? "piece" : "pieces"} — ₦${subtotal.toLocaleString()}):`;

  return (
    <>
      {variant === "icon" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Share entire shopping bag"
          title="Share shopping bag"
          className={cn(
            "p-2 rounded-xl text-slate-600 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center shrink-0 border border-slate-200",
            className
          )}
        >
          <Share2 size={size} className="text-[#FED501]" />
        </button>
      )}

      {variant === "minimal" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Share shopping bag"
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-black transition-colors cursor-pointer",
            className
          )}
        >
          <Share2 className="w-3.5 h-3.5 text-[#FED501]" />
          <span>{buttonText}</span>
        </button>
      )}

      {variant === "outline" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Share shopping bag"
          className={cn(
            "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-black/30 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 hover:text-black transition-all cursor-pointer shadow-2xs hover:scale-[1.01] active:scale-[0.99]",
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
          aria-label="Share shopping bag"
          className={cn(
            "w-full py-3.5 px-4 rounded-2xl border border-[#FED501]/40 hover:border-[#FED501] bg-amber-500/5 hover:bg-amber-500/10 text-slate-900 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs",
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
        title="Share Your Shopping Bag"
        subtitle={`${totalItemsCount} handcrafted ${totalItemsCount === 1 ? "piece" : "pieces"} • Total ₦${subtotal.toLocaleString()}`}
        shareUrl={sharePath}
        shareText={shareText}
        preview={preview}
      />
    </>
  );
}
