"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import EmptyCart from "@/components/cart/EmptyCart";
import ShareCartButton from "@/components/share/ShareCartButton";
import SharedCartBanner from "@/components/cart/SharedCartBanner";
import { useCartStore } from "@/store/cart-store";
import { useIsMounted } from "@/hooks/use-is-mounted";

export default function CartPage() {
  const mounted = useIsMounted();
  const items = useCartStore((state) => state.items);
  const selectAll = useCartStore((state) => state.selectAll);
  const isAllSelected = useCartStore((state) => state.isAllSelected);

  if (!mounted) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-20 max-w-6xl animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8">
          <div className="h-72 bg-slate-200 rounded-3xl" />
          <div className="h-72 bg-slate-200 rounded-3xl" />
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-12 lg:py-20 max-w-4xl space-y-6">
        <Suspense fallback={null}>
          <SharedCartBanner />
        </Suspense>
        <EmptyCart />
      </main>
    );
  }

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const selectedItems = items.filter((item) => item.selected !== false);
  const selectedItemsCount = selectedItems.reduce((acc, item) => acc + item.quantity, 0);
  const allSelected = isAllSelected();

  return (
    <main className="container mx-auto px-4 sm:px-6 py-10 lg:py-16 max-w-6xl space-y-8">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-none"
      >
        <Link href="/" className="hover:text-[#000000] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <span className="font-semibold text-[#000000]">Shopping Bag</span>
      </nav>

      {/* Shared Bag Banner (if visiting /cart?share=...) */}
      <Suspense fallback={null}>
        <SharedCartBanner />
      </Suspense>

      {/* Header with Share Button */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#FED501] mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Order Stage
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#000000] tracking-tight">
            Your Shopping Bag
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {selectedItemsCount} of {totalItemsCount} {totalItemsCount === 1 ? "piece" : "pieces"} selected for artisanal fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ShareCartButton variant="outline" buttonText="Share Bag" />
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] lg:grid-cols-[1.5fr_1fr] gap-6 md:gap-8 lg:gap-10 items-start">
        {/* Cart Items List */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E8E1D5] rounded-2xl px-5 py-3.5 shadow-xs flex items-center justify-between text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-[#000000] select-none group">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => selectAll(e.target.checked)}
                className="w-4 h-4 rounded-md accent-[#000000] cursor-pointer"
              />
              <span className="group-hover:underline">
                Select All ({items.length} {items.length === 1 ? "item" : "items"})
              </span>
            </label>
            <span className="text-slate-500 font-medium">
              {selectedItemsCount} of {totalItemsCount} pieces selected
            </span>
          </div>

          {items.map((item) => (
            <CartItem
              key={`${item.product.id}-${item.selectedSize}`}
              item={item}
            />
          ))}
        </div>

        {/* Sticky Summary Card */}
        <aside className="w-full">
          <CartSummary />
        </aside>
      </div>
    </main>
  );
}