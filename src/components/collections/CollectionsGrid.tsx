"use client";

import Link from "next/link";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { useCollections } from "@/hooks/use-collections";
import { Collection } from "@/types/collection";
import { ArrowRight, Layers } from "lucide-react";

export default function CollectionsGrid({
  initialCollections = [],
}: {
  initialCollections?: Collection[];
}) {
  const { data, isLoading, isError } = useCollections();
  const collections = data ?? initialCollections;

  if (isLoading && (!collections || collections.length === 0)) {
    return (
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="rounded-3xl border border-slate-200 bg-white overflow-hidden p-4 space-y-4 animate-pulse"
          >
            <div className="aspect-[4/4.5] w-full rounded-2xl bg-slate-100" />
            <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
            <div className="h-3 w-full bg-slate-100 rounded-lg" />
            <div className="h-3 w-2/3 bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (isError && (!collections || collections.length === 0)) {
    return (
      <div className="bg-white border border-rose-200 rounded-3xl p-12 text-center space-y-3 max-w-md mx-auto">
        <p className="text-sm font-semibold text-rose-700">
          Unable to load collections at this moment.
        </p>
      </div>
    );
  }

  if (!collections || collections.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-4 max-w-md mx-auto shadow-xs">
        <Layers className="w-12 h-12 text-[#FED501] mx-auto opacity-80" />
        <h3 className="text-lg font-bold font-serif text-[#000000]">
          No Collections Found
        </h3>
        <p className="text-xs text-slate-500">
          Our master weavers are preparing upcoming seasonal collections.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {collections.map((collection) => (
        <Link
          key={collection.id}
          href={`/collections/${collection.slug}`}
          className="group relative flex flex-col rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          {/* Image Preview */}
          <div className="relative aspect-[4/4.5] w-full overflow-hidden bg-slate-900">
            <ImageWithFallback
              src={collection.image}
              alt={collection.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              fallbackTitle={collection.name}
              fallbackSubtitle="Master Archive"
              fallbackBadge="Signature Collection"
              fallbackIcon={Layers}
              fallbackVariant="md"
            />

            {/* Product Count Pill */}
            {collection.productCount !== undefined && (
              <span className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-[#000000] shadow-sm border border-slate-200/60">
                {collection.productCount} {collection.productCount === 1 ? "Cap" : "Caps"}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col flex-1 justify-between">
            <div>
              <h2 className="text-lg font-bold font-serif text-[#000000] group-hover:text-[#FED501] transition-colors">
                {collection.name}
              </h2>
              <p className="mt-2 text-xs text-slate-500 line-clamp-3 leading-relaxed">
                {collection.description}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-[#000000] group-hover:text-[#FED501] transition-colors flex items-center gap-1">
                Explore Collection <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
