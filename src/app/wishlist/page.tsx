"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { Heart, ArrowRight, Trash2, Sparkles, ChevronRight } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import ProductCardSkeleton from "@/components/products/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { useWishlistStore } from "@/store/wishlist-store";
import { useProducts } from "@/hooks/use-products";
import ShareWishlistButton from "@/components/share/ShareWishlistButton";
import SharedWishlistBanner from "@/components/wishlist/SharedWishlistBanner";

export default function WishlistPage() {
  const productIds = useWishlistStore((state) => state.productIds);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);

  const { data: products, isLoading, isError } = useProducts();

  // Prune any stale IDs that no longer exist in the active catalog (e.g. from database reseeds)
  useEffect(() => {
    if (products && products.length > 0 && productIds.length > 0) {
      const validIds = new Set(products.map((p) => p.id));
      const staleIds = productIds.filter((id) => !validIds.has(id));
      if (staleIds.length > 0) {
        staleIds.forEach((id) => removeFromWishlist(id));
      }
    }
  }, [products, productIds, removeFromWishlist]);

  const wishlistProducts = (products ?? []).filter((product) =>
    productIds.includes(product.id)
  );

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-10 lg:py-16 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-6 mb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#FED501]">
              <Heart className="w-3.5 h-3.5 fill-[#FED501]" /> Saved Pieces
            </div>
            <Skeleton className="h-9 sm:h-10 w-48 rounded-xl" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-6 lg:gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-24 text-center max-w-7xl">
        <p className="text-xs text-red-600 font-medium">We couldn&apos;t load your wishlist. Please refresh.</p>
      </main>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-20 lg:py-28 max-w-xl text-center space-y-6">
        <Suspense fallback={null}>
          <SharedWishlistBanner />
        </Suspense>

        <div className="w-16 h-16 rounded-3xl bg-white border border-[#E8E1D5] text-[#FED501] flex items-center justify-center mx-auto shadow-sm">
          <Heart size={32} className="fill-[#FED501]/20 text-[#FED501]" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#000000] tracking-tight">
          Your Wishlist Is Empty
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          Save your favorite handcrafted Yoruba Fila caps while browsing our collections and return to them anytime.
        </p>

        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <span>Explore All Filas</span>
            <ArrowRight className="w-4 h-4 text-[#FED501]" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 py-10 lg:py-16 max-w-7xl space-y-8">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-none"
      >
        <Link href="/" className="hover:text-[#000000] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <span className="font-semibold text-[#000000]">Wishlist</span>
      </nav>

      {/* Shared Wishlist Banner */}
      <Suspense fallback={null}>
        <SharedWishlistBanner />
      </Suspense>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E1D5] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#FED501] mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Curated Selection
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#000000] tracking-tight">
            My Saved Filas
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {wishlistProducts.length} {wishlistProducts.length === 1 ? "handcrafted cap" : "handcrafted caps"} saved
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ShareWishlistButton products={wishlistProducts} />
          <button
            type="button"
            onClick={clearWishlist}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Wishlist</span>
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
        {wishlistProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
