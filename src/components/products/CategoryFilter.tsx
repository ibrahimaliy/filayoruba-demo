"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useProductFilterStore } from "@/store/product-filter-store";
import { useCollections } from "@/hooks/use-collections";
import { Layers } from "lucide-react";

export default function CategoryFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: collections, isLoading } = useCollections();
  const collection = useProductFilterStore((state) => state.collection);
  const setCollection = useProductFilterStore((state) => state.setCollection);

  // Sync state with URL parameter if present
  useEffect(() => {
    const urlCollection = searchParams.get("collection");
    if (urlCollection !== null && urlCollection !== collection) {
      setCollection(urlCollection);
    }
  }, [searchParams, collection, setCollection]);

  const handleSelect = (slug: string) => {
    const nextSlug = collection.toLowerCase() === slug.toLowerCase() ? "" : slug;
    setCollection(nextSlug);

    const params = new URLSearchParams(searchParams.toString());
    if (nextSlug) {
      params.set("collection", nextSlug);
    } else {
      params.delete("collection");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1 hidden sm:flex">
        <Layers className="w-3.5 h-3.5" /> Filter:
      </span>

      {/* All Caps Pill */}
      <button
        type="button"
        onClick={() => handleSelect("")}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
          !collection
            ? "bg-[#000000] text-white shadow-sm ring-2 ring-black/10"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        All Caps
      </button>

      {/* Dynamic Master Collections */}
      {isLoading && !collections ? (
        <>
          <div className="h-8 w-24 bg-slate-200/70 rounded-xl animate-pulse shrink-0" />
          <div className="h-8 w-28 bg-slate-200/70 rounded-xl animate-pulse shrink-0" />
          <div className="h-8 w-20 bg-slate-200/70 rounded-xl animate-pulse shrink-0" />
        </>
      ) : (
        collections?.map((item) => {
          const isSelected =
            collection.toLowerCase() === item.slug.toLowerCase() ||
            collection.toLowerCase() === item.name.toLowerCase();
          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => handleSelect(item.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? "bg-[#000000] text-white shadow-sm ring-2 ring-black/10"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>{item.name}</span>
            </button>
          );
        })
      )}
    </div>
  );
}
