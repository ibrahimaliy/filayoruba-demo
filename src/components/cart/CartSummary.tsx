"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Sparkles, AlertCircle } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import ShareCartButton from "@/components/share/ShareCartButton";

export default function CartSummary() {
  const items = useCartStore((state) => state.items);
  const selectedTotalPrice = useCartStore((state) => state.selectedTotalPrice);
  const selectedTotalItems = useCartStore((state) => state.selectedTotalItems);
  const selectAll = useCartStore((state) => state.selectAll);

  const subtotal = selectedTotalPrice();
  const selectedCount = selectedTotalItems();

  return (
    <div className="bg-white border border-[#E8E1D5] rounded-3xl p-6 sm:p-7 shadow-sm sticky top-24 space-y-6">
      <h2 className="text-lg font-bold font-serif text-[#000000] flex items-center justify-between">
        <span>Order Summary</span>
        <Sparkles className="w-4 h-4 text-[#FED501]" />
      </h2>

      {/* Free Shipping Alert Meter */}
      <div className="bg-[#000000]/5 border border-[#000000]/10 rounded-2xl p-3 text-xs flex items-center gap-2.5 text-[#000000]">
        <Truck className="w-4 h-4 text-[#FED501] shrink-0" />
        <div>
          <span className="font-bold block">Express Nationwide Dispatch</span>
          <span className="text-[11px] text-slate-500">Delivered within 1–3 business days</span>
        </div>
      </div>

      <div className="space-y-3 text-xs text-slate-600">
        <div className="flex justify-between">
          <span>
            Selected Items ({selectedCount} {selectedCount === 1 ? "piece" : "pieces"})
          </span>
          <span className="font-bold text-[#000000] text-sm">
            ₦{subtotal.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Ceremonial Packaging</span>
          <span className="text-emerald-700 font-semibold">Complimentary</span>
        </div>

        <div className="flex justify-between text-slate-500">
          <span>Delivery Fee</span>
          <span>Calculated at checkout</span>
        </div>
      </div>

      {/* Total Row */}
      <div className="border-t border-slate-100 pt-4 flex justify-between items-baseline">
        <span className="text-sm font-bold text-[#000000]">Subtotal</span>
        <span className="text-xl font-extrabold text-[#000000] tracking-tight">
          ₦{subtotal.toLocaleString()}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        {selectedCount > 0 ? (
          <Link
            href="/checkout"
            className="w-full py-4 rounded-2xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-black/15 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>
              Proceed to Checkout ({selectedCount} {selectedCount === 1 ? "item" : "items"})
            </span>
            <ArrowRight className="w-4 h-4 text-[#FED501]" />
          </Link>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              disabled
              className="w-full py-4 rounded-2xl bg-slate-200 text-slate-400 text-xs sm:text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Select items to proceed</span>
            </button>
            <button
              type="button"
              onClick={() => selectAll(true)}
              className="text-xs text-center text-[#000000] hover:underline font-bold w-full transition-colors cursor-pointer"
            >
              Select all {items.length} {items.length === 1 ? "item" : "items"} in bag
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <Link
            href="/products"
            className="py-3 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center text-center"
          >
            Continue Browsing
          </Link>

          {items.length > 0 && (
            <ShareCartButton variant="outline" buttonText="Share Bag" />
          )}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="pt-2 flex items-center justify-center gap-2 text-[10px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Paystack 256-bit Encrypted Checkout</span>
      </div>
    </div>
  );
}
