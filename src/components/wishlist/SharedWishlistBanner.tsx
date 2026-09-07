"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Sparkles, Heart, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useWishlistStore } from "@/store/wishlist-store";
import { useProducts } from "@/hooks/use-products";

export default function SharedWishlistBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [saved, setSaved] = useState(false);

  const productIds = useWishlistStore((state) => state.productIds);
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const { data: products, isLoading } = useProducts();

  const itemsParam = searchParams.get("items");

  const sharedIds = useMemo(() => {
    if (!itemsParam) return [];
    return itemsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }, [itemsParam]);

  // Unsaved IDs from the shared list
  const unsavedIds = useMemo(() => {
    return sharedIds.filter((id) => !productIds.includes(id));
  }, [sharedIds, productIds]);

  if (dismissed || sharedIds.length === 0) return null;

  const matchedProducts = (products ?? []).filter((p) => sharedIds.includes(p.id));

  const handleSaveAll = () => {
    if (isLoading || sharedIds.length === 0) return;

    let addedCount = 0;
    sharedIds.forEach((id) => {
      if (!productIds.includes(id)) {
        addToWishlist(id);
        addedCount++;
      }
    });

    setSaved(true);
    toast.success("Wishlist updated!", {
      description: `Saved ${addedCount} new handcrafted ${addedCount === 1 ? "piece" : "pieces"} to your wishlist.`,
    });

    router.replace(pathname);
  };

  const handleDismiss = () => {
    setDismissed(true);
    router.replace(pathname);
  };

  return (
    <div className="rounded-3xl border border-[#FED501]/50 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-white p-5 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#FED501] text-black flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm sm:text-base text-[#000000]">
              Shared Wishlist Received
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Someone curated and shared {sharedIds.length}{" "}
              {sharedIds.length === 1 ? "handcrafted cap" : "handcrafted caps"}{" "}
              with you.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          aria-label="Dismiss shared wishlist"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Product preview pills */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FED501]" />
          <span>Verifying artisan collection...</span>
        </div>
      ) : (
        matchedProducts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {matchedProducts.map((product) => (
              <span
                key={product.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs"
              >
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{product.name}</span>
                <span className="text-[10px] text-slate-400">₦{product.price.toLocaleString()}</span>
              </span>
            ))}
          </div>
        )
      )}

      {/* Actions */}
      <div className="flex items-center gap-2.5 pt-1">
        {unsavedIds.length > 0 && !saved ? (
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60"
          >
            <Heart className="w-3.5 h-3.5 fill-[#FED501] text-[#FED501]" />
            <span>Save All to My Wishlist ({unsavedIds.length})</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>All items saved to your wishlist</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
