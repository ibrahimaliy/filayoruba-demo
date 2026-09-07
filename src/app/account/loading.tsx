import { Skeleton } from "@/components/ui/Skeleton";

export default function AccountLoading() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner Skeleton */}
      <div className="bg-gradient-to-br from-[#000000] to-[#1F1F1F] rounded-3xl p-6 sm:p-8 text-white space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-2xl bg-white/10" variant="dark" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded-lg bg-white/10" variant="dark" />
            <Skeleton className="h-3.5 w-32 rounded-md bg-white/10" variant="dark" />
          </div>
        </div>
      </div>

      {/* 3 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="w-8 h-8 rounded-xl" />
            </div>
            <Skeleton className="h-7 w-28 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Orders List Skeleton */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-48 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
