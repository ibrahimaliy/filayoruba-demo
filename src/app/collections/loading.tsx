import CollectionCardSkeleton from "@/components/collections/CollectionCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sparkles } from "lucide-react";

export default function CollectionsLoading() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header Skeleton */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#FED501]">
          <Sparkles className="w-3.5 h-3.5" /> Curated Masterpieces
        </div>
        <Skeleton className="h-10 sm:h-12 w-3/4 mx-auto rounded-xl" />
        <Skeleton className="h-4 w-5/6 mx-auto rounded-md" />
      </div>

      {/* Collections Grid Skeleton */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <CollectionCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
