import { Skeleton } from "@/components/ui/Skeleton";

export default function CollectionCardSkeleton() {
  return (
    <div className="relative flex flex-col rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
      {/* Image Stage Placeholder */}
      <div className="relative aspect-[4/4.5] w-full overflow-hidden bg-slate-100 animate-shimmer">
        <div className="absolute top-3.5 right-3.5 z-10">
          <Skeleton className="h-6 w-16 rounded-full bg-white/80" />
        </div>
      </div>

      {/* Info Placeholder */}
      <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
        <div className="space-y-2.5">
          <Skeleton className="h-6 w-3/4 rounded-lg" />
          <Skeleton className="h-3.5 w-full rounded-md" />
          <Skeleton className="h-3.5 w-4/5 rounded-md" />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}
