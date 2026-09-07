import ProductCardSkeleton from "@/components/products/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sparkles } from "lucide-react";

export default function ProductsLoading() {
  return (
    <main className="container mx-auto px-4 sm:px-6 py-10 lg:py-16 max-w-7xl">
      {/* Editorial Header Skeleton */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#FED501]">
          <Sparkles className="w-3.5 h-3.5" /> Handcrafted Headwear
        </div>
        <Skeleton className="h-10 sm:h-12 w-3/4 mx-auto rounded-xl" />
        <Skeleton className="h-4 w-5/6 mx-auto rounded-md" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 mb-10 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <Skeleton className="h-11 w-full md:w-80 rounded-xl" />
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-6 lg:gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
