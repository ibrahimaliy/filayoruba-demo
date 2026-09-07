import { Skeleton } from "@/components/ui/Skeleton";
import { ChevronRight, Sparkles } from "lucide-react";

export default function ProductDetailLoading() {
  return (
    <main className="container mx-auto px-4 sm:px-6 py-10 lg:py-16 max-w-7xl">
      {/* Breadcrumb Bar Skeleton */}
      <div className="flex items-center gap-2 mb-8">
        <Skeleton className="h-3.5 w-12 rounded" />
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <Skeleton className="h-3.5 w-16 rounded" />
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <Skeleton className="h-3.5 w-32 rounded" />
      </div>

      {/* Main Product Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Left: Gallery Skeleton */}
        <div className="space-y-4">
          <div className="relative aspect-[4/4.5] w-full rounded-3xl overflow-hidden bg-slate-100 animate-shimmer" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-20 h-20 rounded-2xl shrink-0" />
            ))}
          </div>
        </div>

        {/* Right: Product Details Skeleton */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            <Skeleton className="h-10 sm:h-12 w-4/5 rounded-xl" />

            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>

          {/* Sizing Selector Skeleton */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
            <div className="flex flex-wrap gap-2.5">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-10 w-14 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Action Button Skeleton */}
          <div className="space-y-3 pt-2">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>

          {/* Trust Guarantees Box */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-3/4 rounded" />
          </div>
        </div>
      </div>
    </main>
  );
}
