"use client";

import Link from "next/link";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCartStore } from "@/store/cart-store";
import { useCartDrawerStore } from "@/store/cart-drawer-store";
import { formatSizeLabel } from "@/lib/sizing";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Check,
} from "lucide-react";
import ShareProductButton from "@/components/share/ShareProductButton";
import ShareCartButton from "@/components/share/ShareCartButton";

export default function CartDrawer() {
  const items = useCartStore((state) => state.items);
  const selectedTotalPrice = useCartStore((state) => state.selectedTotalPrice);
  const toggleItemSelection = useCartStore((state) => state.toggleItemSelection);
  const selectAll = useCartStore((state) => state.selectAll);
  const isAllSelected = useCartStore((state) => state.isAllSelected);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const isOpen = useCartDrawerStore((state) => state.isOpen);
  const close = useCartDrawerStore((state) => state.close);

  const subtotal = selectedTotalPrice();
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const selectedItems = items.filter((item) => item.selected !== false);
  const selectedItemsCount = selectedItems.reduce((acc, item) => acc + item.quantity, 0);
  const allSelected = isAllSelected();

  return (
    <Sheet open={isOpen} onOpenChange={close}>
      <SheetContent className="w-full sm:max-w-md bg-[#FAF9F6] p-0 flex flex-col h-full border-l border-[#E4E4E7] z-50">
        {/* Header */}
        <SheetHeader className="p-4 sm:p-6 border-b border-[#E4E4E7] bg-white pr-12">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base sm:text-lg font-bold font-serif text-[#000000] flex items-center gap-2">
              <ShoppingBag className="w-4 sm:w-5 h-4 sm:h-5 text-[#FED501]" />
              <span>Your Shopping Bag</span>
              <span className="text-xs font-sans font-bold px-2 py-0.5 rounded-full bg-[#000000]/10 text-[#000000]">
                {totalItemsCount}
              </span>
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Free Shipping Alert Meter */}
        <div className="bg-[#000000] text-white px-4 sm:px-6 py-2 sm:py-2.5 text-[11px] sm:text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-white/90">
            <Truck className="w-3.5 h-3.5 text-[#FED501]" /> Express Nationwide Dispatch
          </span>
          <span className="text-[#FED501] font-bold">1–3 Days</span>
        </div>

        {/* Select All & Share Bar */}
        {items.length > 0 && (
          <div className="bg-white/95 backdrop-blur-xs px-4 sm:px-6 py-2.5 border-b border-slate-200/80 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => selectAll(e.target.checked)}
                className="w-4 h-4 rounded-md accent-[#000000] cursor-pointer"
              />
              <span className="font-bold text-[#000000] group-hover:underline">
                Select All ({items.length})
              </span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                {selectedItemsCount} of {totalItemsCount} selected
              </span>
              <ShareCartButton variant="minimal" buttonText="Share Bag" />
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3 sm:space-y-4">
          {items.length === 0 ? (
            <div className="py-16 sm:py-20 text-center space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-sm">
                <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 text-[#FED501]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#000000]">Your bag is empty</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Explore our handcrafted Yoruba Aso-Oke collections to find your perfect fit.
                </p>
              </div>
              <Link
                href="/products"
                onClick={close}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#000000] text-white text-xs font-bold hover:bg-[#1A1A1A] transition-colors"
              >
                <span>Browse Filas</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FED501]" />
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const image = item.product.images?.[0] || "/placeholder.png";
              const isSelected = item.selected !== false;
              return (
                <div
                  key={`${item.product.id}-${item.selectedSize}`}
                  className={cn(
                    "border rounded-2xl p-3 sm:p-4 shadow-xs flex gap-3 sm:gap-3.5 items-center transition-all",
                    isSelected
                      ? "bg-white border-slate-200/90"
                      : "bg-slate-50/70 border-dashed border-slate-300 opacity-60"
                  )}
                >
                  {/* Selection Checkbox */}
                  <label
                    className="flex items-center cursor-pointer select-none p-1 -m-1"
                    title={isSelected ? "Exclude from checkout" : "Include in checkout"}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItemSelection(item.product.id, item.selectedSize)}
                      className="w-4 h-4 rounded-md accent-[#000000] cursor-pointer"
                    />
                  </label>

                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-100">
                    <ImageWithFallback
                      src={image}
                      alt={item.product.name}
                      fill
                      sizes="80px"
                      className="object-cover object-center"
                      fallbackTitle={item.product.name}
                      fallbackVariant="sm"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-[#000000] truncate">
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-0.5 shrink-0 -mr-1">
                        <ShareProductButton
                          product={item.product}
                          selectedSize={item.selectedSize}
                          variant="drawer-row"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(item.product.id, item.selectedSize)
                          }
                          aria-label={`Remove ${item.product.name} from cart`}
                          className="text-slate-400 hover:text-red-600 p-1.5 transition-colors cursor-pointer rounded-lg hover:bg-slate-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-[#000000]/5 font-bold text-[#000000]">
                        Size: {formatSizeLabel(item.selectedSize)}
                      </span>
                      {!isSelected && (
                        <span className="text-[10px] text-slate-500 italic">
                          Saved for later
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-extrabold text-[#000000]">
                        ₦{(item.product.price * item.quantity).toLocaleString()}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.selectedSize,
                              item.quantity - 1
                            )
                          }
                          aria-label="Decrease quantity"
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded-l-lg transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-[#000000]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.selectedSize,
                              item.quantity + 1
                            )
                          }
                          aria-label="Increase quantity"
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded-r-lg transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Checkout Summary */}
        {items.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-[#E4E4E7] bg-white space-y-3 sm:space-y-4">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>
                  Subtotal ({selectedItemsCount} {selectedItemsCount === 1 ? "item" : "items"})
                </span>
                <span className="font-extrabold text-[#000000] text-sm">
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Packaging & Craft Box</span>
                <span className="text-emerald-700 font-semibold">Complimentary</span>
              </div>
            </div>

            <div className="space-y-2 pt-1 sm:pt-2">
              {selectedItemsCount > 0 ? (
                <Link
                  href="/checkout"
                  onClick={close}
                  className="w-full py-3 sm:py-3.5 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all shadow-md shadow-black/10 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] min-h-[44px]"
                >
                  <span>
                    Express Checkout ({selectedItemsCount} {selectedItemsCount === 1 ? "item" : "items"})
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#FED501]" />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-3 sm:py-3.5 rounded-xl bg-slate-200 text-slate-400 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <span>Select at least 1 item to checkout</span>
                </button>
              )}

              <Link
                href="/cart"
                onClick={close}
                className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center text-center min-h-[40px]"
              >
                View Full Bag ({items.length})
              </Link>
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secured by Paystack &bull; 100% Authentic Guarantee</span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
