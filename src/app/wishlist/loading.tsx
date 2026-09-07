import ProductCardSkeleton from "@/components/products/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { Heart } from "lucide-react";

export default function WishlistLoading() {
  return (
    <main className="container mx-auto px-4 sm:px-6 py-10 lg:py-16 max-w-7xl">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-6 mb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#FED501]">
            <Heart className="w-3.5 h-3.5 fill-[#FED501]" /> Saved Pieces
          </div>
          <Skeleton className="h-9 sm:h-10 w-48 rounded-xl" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-6 lg:gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
