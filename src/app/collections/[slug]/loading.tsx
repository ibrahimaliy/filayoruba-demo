import ProductCardSkeleton from "@/components/products/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChevronRight, Sparkles } from "lucide-react";

export default function CollectionDetailLoading() {
  return (
    <main className="container mx-auto px-4 sm:px-6 py-10 lg:py-16 max-w-7xl">
      {/* Breadcrumb Bar Skeleton */}
      <div className="flex items-center gap-2 mb-8">
        <Skeleton className="h-3.5 w-12 rounded" />
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <Skeleton className="h-3.5 w-16 rounded" />
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <Skeleton className="h-3.5 w-28 rounded" />
      </div>

      {/* Editorial Collection Hero Banner Skeleton */}
      <div className="bg-white border border-[#E8E1D5] rounded-3xl p-8 sm:p-12 mb-12 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#FED501]">
          <Sparkles className="w-3.5 h-3.5" /> Master Collection
        </div>
        <Skeleton className="h-10 sm:h-12 w-1/2 rounded-xl" />
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <div className="pt-2">
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
      </div>

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
