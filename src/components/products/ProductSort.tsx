"use client";

import { useProductFilterStore } from "@/store/product-filter-store";
import { ChevronDown } from "lucide-react";

export default function ProductSort() {
  const sort = useProductFilterStore((state) => state.sort);
  const setSort = useProductFilterStore((state) => state.setSort);

  return (
    <div className="relative group">
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="text-xs font-bold text-[#000000] bg-white border border-slate-200/90 hover:border-[#FED501]/80 rounded-xl px-3.5 py-2.5 pr-8 shadow-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FED501]/30 focus:border-[#FED501] cursor-pointer transition-all appearance-none"
      >
        <option value="featured">Featured First</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
        <option value="name">Alphabetical (A–Z)</option>
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FED501] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
    </div>
  );
}
