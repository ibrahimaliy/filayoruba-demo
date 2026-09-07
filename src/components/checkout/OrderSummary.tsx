"use client";

import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";
import { shippingZones } from "@/data/shipping";
import { formatSizeLabel } from "@/lib/sizing";
import { ShoppingBag, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OrderSummary() {
  const items = useCartStore((state) => state.items);
  const selectedItems = items.filter((item) => item.selected !== false);
  const selectedTotalPrice = useCartStore((state) => state.selectedTotalPrice);
  const toggleItemSelection = useCartStore((state) => state.toggleItemSelection);
  const selectAll = useCartStore((state) => state.selectAll);
  const isAllSelected = useCartStore((state) => state.isAllSelected);

  const shippingCost = useCheckoutStore((state) => state.shippingCost);
  const shippingZoneId = useCheckoutStore((state) => state.shippingZoneId);
  const currentStep = useCheckoutStore((state) => state.currentStep);

  const subtotal = selectedTotalPrice();
  const selectedCount = selectedItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const total = subtotal + (selectedCount > 0 ? shippingCost : 0);
  const currentZone = shippingZones.find((z) => z.id === shippingZoneId);

  return (
    <div className="sticky top-24 rounded-3xl border bg-white p-6 shadow-sm h-fit space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-[#000000]" />
          <h2 className="text-xl font-bold text-[#000000]">
            Order Summary
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
            {selectedCount} of {totalItemsCount} {totalItemsCount === 1 ? "piece" : "pieces"}
          </span>
        </div>
      </div>

      {/* Select All Toggle Bar */}
      {items.length > 1 && (
        <div className="flex items-center justify-between pb-2 text-xs text-slate-600 border-b border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-[#000000] select-none group">
            <input
              type="checkbox"
              checked={isAllSelected()}
              onChange={(e) => selectAll(e.target.checked)}
              className="w-3.5 h-3.5 rounded-sm accent-[#000000] cursor-pointer"
            />
            <span className="group-hover:underline">Select All</span>
          </label>
          <span className="text-[11px] text-slate-500 font-medium">
            {selectedCount} selected for order
          </span>
        </div>
      )}

      {/* Cart Items List */}
      <div className="max-h-[320px] overflow-y-auto divide-y pr-1 space-y-1">
        {items.map((item) => {
          const isSelected = item.selected !== false;
          return (
            <div
              key={`${item.product.id}-${item.selectedSize}`}
              className={cn(
                "flex items-center gap-3 py-3 transition-opacity",
                isSelected ? "opacity-100" : "opacity-55"
              )}
            >
              {/* Checkbox */}
              <label
                className="p-1 -m-1 cursor-pointer shrink-0"
                title={isSelected ? "Unselect item" : "Select item"}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleItemSelection(item.product.id, item.selectedSize)}
                  className="w-4 h-4 rounded-md accent-[#000000] cursor-pointer"
                />
              </label>

              <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-slate-900 border">
                <ImageWithFallback
                  src={item.product.images?.[0]}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  fallbackTitle={item.product.name}
                  fallbackVariant="sm"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs text-slate-900 truncate">
                  {item.product.name}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Size: <span className="font-medium text-slate-700">{formatSizeLabel(item.selectedSize)}</span> • Qty: <span className="font-medium text-slate-700">{item.quantity}</span>
                </p>
                {!isSelected && (
                  <span className="text-[10px] text-amber-700 font-medium italic">
                    Saved for later
                  </span>
                )}
              </div>

              <div className="text-right">
                <p className={cn("text-xs font-bold", isSelected ? "text-slate-900" : "text-slate-400 line-through")}>
                  ₦{(item.product.price * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 0-Item Selection Alert */}
      {selectedCount === 0 && (
        <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-3 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Select at least 1 item to checkout.</span>
        </div>
      )}

      {/* Price Calculations */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-900">
            ₦{subtotal.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between text-sm text-slate-600">
          <span>Shipping</span>
          <span className="font-semibold text-slate-900">
            {selectedCount === 0 ? (
              "₦0"
            ) : shippingCost > 0 ? (
              `₦${shippingCost.toLocaleString()}${currentZone ? ` (${currentZone.name})` : ""}`
            ) : currentStep === 1 ? (
              <span className="text-xs font-normal text-muted-foreground">Calculated next step</span>
            ) : (
              "₦0"
            )}
          </span>
        </div>

        <div className="border-t pt-3 flex justify-between items-baseline font-bold text-lg text-slate-900">
          <span>Total</span>
          <span className="text-xl text-[#000000]">
            ₦{total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Reassurance Feature */}
      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-[#000000] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600">
          <p className="font-semibold text-slate-900">Authentic Yoruba Craft</p>
          <p className="mt-0.5">Hand-stitched premium fabric with guaranteed size fit.</p>
        </div>
      </div>
    </div>
  );
}
