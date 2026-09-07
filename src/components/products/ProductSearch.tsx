"use client";

import { Search, X } from "lucide-react";
import { useProductFilterStore } from "@/store/product-filter-store";

export default function ProductSearch() {
  const search = useProductFilterStore((state) => state.search);
  const setSearch = useProductFilterStore((state) => state.setSearch);

  return (
    <div className="relative w-full">
      <Search
        size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        type="text"
        placeholder="Search by color, weave, or style..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
      />
      {search && (
        <button
          type="button"
          onClick={() => setSearch("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}