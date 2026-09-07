"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Sparkles, ShoppingBag, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart-store";
import { useProducts } from "@/hooks/use-products";
import { formatSizeLabel } from "@/lib/sizing";

interface SharedItemPayload {
  id: string;
  size: string;
  q?: number;
}

export default function SharedCartBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [imported, setImported] = useState(false);

  const addToCart = useCartStore((state) => state.addToCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const { data: products, isLoading } = useProducts();

  const shareParam = searchParams.get("share");

  const sharedItems: SharedItemPayload[] = useMemo(() => {
    if (!shareParam) return [];
    try {
      let jsonStr = "";
      try {
        jsonStr = decodeURIComponent(window.atob(shareParam));
      } catch {
        try {
          jsonStr = window.atob(shareParam);
        } catch {
          jsonStr = decodeURIComponent(shareParam);
        }
      }
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item) => typeof item === "object" && item !== null && Boolean(item.id)
        );
      }
      return [];
    } catch {
      return [];
    }
  }, [shareParam]);

  if (dismissed || sharedItems.length === 0) return null;

  const matchedItems = (products ?? [])
    .map((product) => {
      const item = sharedItems.find((s) => s.id === product.id);
      if (!item) return null;
      return { item, product };
    })
    .filter((entry): entry is { item: SharedItemPayload; product: NonNullable<typeof entry>["product"] } =>
      Boolean(entry)
    );

  const handleImportAll = () => {
    if (isLoading) return;

    if (matchedItems.length === 0) {
      toast.error("Could not locate items from this shared bag in our catalog.");
      return;
    }

    let addedCount = 0;
    matchedItems.forEach(({ product, item }) => {
      const size = item.size || product.sizes?.[0] || "M";
      addToCart(product, size);
      const qty = Number(item.q) || 1;
      if (qty > 1) {
        updateQuantity(product.id, size, qty);
      }
      addedCount += qty;
    });

    setImported(true);
    toast.success("Shared bag loaded!", {
      description: `Added ${addedCount} handcrafted ${addedCount === 1 ? "piece" : "pieces"} to your shopping bag.`,
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
              Shared Shopping Bag Received
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Someone curated and shared {sharedItems.length}{" "}
              {sharedItems.length === 1 ? "handcrafted piece" : "handcrafted pieces"}{" "}
              with you.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          aria-label="Dismiss shared bag"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Item preview chips */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FED501]" />
          <span>Verifying artisan collection...</span>
        </div>
      ) : (
        matchedItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {matchedItems.map(({ product, item }) => (
              <span
                key={`${product.id}-${item.size}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs"
              >
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{product.name}</span>
                {item.size && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-600">
                    {formatSizeLabel(item.size)}
                  </span>
                )}
                {(item.q ?? 1) > 1 && (
                  <span className="text-[10px] text-slate-500 font-bold">×{item.q}</span>
                )}
              </span>
            ))}
          </div>
        )
      )}

      {/* Action Row */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleImportAll}
          disabled={imported || isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60"
        >
          {imported ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#FED501]" />
              <span>Added to Bag</span>
            </>
          ) : isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FED501]" />
              <span>Loading Pieces...</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5 text-[#FED501]" />
              <span>Add All to My Bag</span>
            </>
          )}
        </button>

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
