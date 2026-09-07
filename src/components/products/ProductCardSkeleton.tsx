import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductCardSkeleton() {
  return (
    <div className="relative flex flex-col rounded-3xl border border-[#E8E1D5] bg-white overflow-hidden shadow-sm">
      {/* Visual Image Stage Placeholder */}
      <div className="relative aspect-[4/4.5] w-full overflow-hidden bg-slate-100 animate-shimmer">
        {/* Collection Badge Placeholder */}
        <div className="absolute left-3.5 top-3.5 z-10">
          <Skeleton className="h-6 w-20 rounded-full bg-white/80" />
        </div>

        {/* Wishlist Button Placeholder */}
        <div className="absolute right-3.5 top-3.5 z-10">
          <Skeleton className="h-8 w-8 rounded-full bg-white/80" />
        </div>
      </div>

      {/* Product Content Details Placeholder */}
      <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Rating Summary Placeholder */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-12 rounded-md" />
            <Skeleton className="h-3 w-8 rounded-md" />
          </div>

          {/* Product Title Placeholder */}
          <Skeleton className="h-5 w-4/5 rounded-md" />
          <Skeleton className="h-4 w-3/5 rounded-md" />
        </div>

        {/* Price & Action Row Placeholder */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-12 rounded-sm" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
