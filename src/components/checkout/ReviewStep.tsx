"use client";

import { useState, useEffect } from "react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";
import { shippingZones } from "@/data/shipping";
import { formatSizeLabel } from "@/lib/sizing";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, ShieldCheck, Truck, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReviewStep() {
  const [isPatron, setIsPatron] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated) setIsPatron(true);
      })
      .catch(() => {});
  }, []);

  const allItems = useCartStore((state) => state.items);
  const items = allItems.filter((item) => item.selected !== false);
  const selectedTotalPrice = useCartStore((state) => state.selectedTotalPrice);
  const toggleItemSelection = useCartStore((state) => state.toggleItemSelection);
  const selectAll = useCartStore((state) => state.selectAll);
  const isAllSelected = useCartStore((state) => state.isAllSelected);
  const subtotal = selectedTotalPrice();

  const customerInfo = useCheckoutStore((state) => state.customerInfo);
  const shippingAddress = useCheckoutStore((state) => state.shippingAddress);
  const shippingZoneId = useCheckoutStore((state) => state.shippingZoneId);
  const shippingCost = useCheckoutStore((state) => state.shippingCost);

  const previousStep = useCheckoutStore((state) => state.previousStep);
  const nextStep = useCheckoutStore((state) => state.nextStep);
  const setStep = useCheckoutStore((state) => state.setStep);

  const total = subtotal + shippingCost;
  const currentZone = shippingZones.find((z) => z.id === shippingZoneId);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="rounded-2xl sm:rounded-3xl border bg-white p-4 sm:p-8 shadow-sm space-y-6 sm:space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-[#000000] mb-2">
            Review Your Order
          </h2>
          <p className="text-sm text-muted-foreground">
            Please verify your customer details, shipping address, and selected items before proceeding to payment.
          </p>
        </div>

        {/* Express Review Notice for Authenticated Patrons */}
        {isPatron && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-950 text-xs shadow-2xs">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Express Review:</strong> Verified contact and delivery details from your account have been pre-filled. You can edit any details below or proceed directly to payment.
            </span>
          </div>
        )}

        {/* Customer & Shipping Summary Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Info Card */}
          <div className="rounded-2xl border bg-slate-50/70 p-5 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-semibold text-[#000000]">
                <User className="h-4 w-4" />
                <span>Contact Details</span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-medium text-[#000000] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="h-3 w-3" /> Edit
              </button>
            </div>
            <p className="text-sm font-medium text-slate-900">
              {customerInfo.firstName} {customerInfo.lastName}
            </p>
            <p className="text-sm text-slate-600 mt-1">{customerInfo.email}</p>
            <p className="text-sm text-slate-600">{customerInfo.phone}</p>
          </div>

          {/* Shipping Address Card */}
          <div className="rounded-2xl border bg-slate-50/70 p-5 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-semibold text-[#000000]">
                <Truck className="h-4 w-4" />
                <span>Shipping Address</span>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-medium text-[#000000] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="h-3 w-3" /> Edit
              </button>
            </div>
            <p className="text-sm font-medium text-slate-900">
              {shippingAddress.address}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              {shippingAddress.city}, {shippingAddress.state}
            </p>
            <p className="text-xs font-semibold text-[#000000] mt-2 inline-block bg-white px-2 py-1 rounded-md border">
              Zone: {currentZone?.name ?? "Standard"} (₦{shippingCost.toLocaleString()})
            </p>
          </div>
        </div>

        {/* Order Items Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg text-slate-900">
              Items to Purchase ({items.reduce((sum, item) => sum + item.quantity, 0)})
            </h3>
            {allItems.length > 1 && (
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#000000] select-none group">
                <input
                  type="checkbox"
                  checked={isAllSelected()}
                  onChange={(e) => selectAll(e.target.checked)}
                  className="w-3.5 h-3.5 rounded-sm accent-[#000000] cursor-pointer"
                />
                <span className="group-hover:underline">Select All</span>
              </label>
            )}
          </div>

          <div className="divide-y rounded-2xl border overflow-hidden">
            {allItems.map((item) => {
              const isSelected = item.selected !== false;
              return (
                <div
                  key={`${item.product.id}-${item.selectedSize}`}
                  className={cn(
                    "flex items-center gap-3 sm:gap-4 p-3 sm:p-4 transition-all",
                    isSelected ? "bg-white hover:bg-slate-50/50" : "bg-slate-50/70 opacity-60"
                  )}
                >
                  {/* Selection Checkbox */}
                  <label
                    className="p-1 -m-1 cursor-pointer shrink-0"
                    title={isSelected ? "Unselect item" : "Select item for payment"}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItemSelection(item.product.id, item.selectedSize)}
                      className="w-4 h-4 rounded-md accent-[#000000] cursor-pointer"
                    />
                  </label>

                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl overflow-hidden bg-slate-900 border">
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
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                      {item.product.name}
                    </h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-muted-foreground mt-1">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-800">
                        Size: {formatSizeLabel(item.selectedSize)}
                      </span>
                      <span>Qty: {item.quantity}</span>
                      {!isSelected && (
                        <span className="text-amber-700 font-medium italic">
                          Saved for later
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={cn("font-bold text-sm", isSelected ? "text-slate-900" : "text-slate-400 line-through")}>
                      ₦{(item.product.price * item.quantity).toLocaleString()}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-muted-foreground">
                        ₦{item.product.price.toLocaleString()} each
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cost Summary Breakdown */}
        <div className="rounded-2xl border bg-slate-50/50 p-6 space-y-3">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span className="font-medium text-slate-900">₦{subtotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-sm text-slate-600">
            <span>Shipping Cost ({currentZone?.name ?? "Regional"})</span>
            <span className="font-medium text-slate-900">
              {items.length === 0 ? "₦0" : `₦${shippingCost.toLocaleString()}`}
            </span>
          </div>

          <div className="border-t pt-3 flex justify-between items-baseline">
            <div>
              <span className="text-base font-bold text-slate-900">Total Amount Due</span>
              <p className="text-xs text-muted-foreground">Includes all local taxes and delivery</p>
            </div>
            <span className="text-2xl font-bold text-[#000000]">
              ₦{(subtotal + (items.length > 0 ? shippingCost : 0)).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Guaranteed authentic Yoruba craftsmanship • Secure encrypted payment</span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={previousStep}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shipping
          </Button>

          <Button
            type="button"
            size="lg"
            onClick={nextStep}
            disabled={items.length === 0}
            className="w-full sm:w-auto bg-[#000000] hover:bg-[#1A1A1A] px-8 cursor-pointer disabled:opacity-50"
          >
            {items.length > 0 ? "Proceed to Payment" : "Select items to proceed"}
          </Button>
        </div>
      </div>
    </div>
  );
}
