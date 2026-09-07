import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Admin Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="w-8 h-8 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-32 rounded-lg" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Analytics Chart Box Skeleton */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <Skeleton className="h-5 w-44 rounded" />
          <Skeleton className="h-8 w-32 rounded-xl" />
        </div>
        <div className="h-64 rounded-2xl bg-slate-50 flex items-center justify-center animate-shimmer" />
      </div>

      {/* Recent Activity / Table Skeleton */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3.5 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
