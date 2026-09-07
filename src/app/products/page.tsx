import { Suspense } from "react";
import ProductGrid from "@/components/products/ProductGrid";
import ProductSearch from "@/components/products/ProductSearch";
import CategoryFilter from "@/components/products/CategoryFilter";
import ProductSort from "@/components/products/ProductSort";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Shop All Handcrafted Yoruba Filas | Fìlà Yorùbá",
  description:
    "Explore our complete catalog of 11 authentic Yoruba Fila caps, handwoven on traditional Oyo looms with Aso-Oke, Sanyan silk, and embroidered velvet.",
};

export default function ProductsPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 py-12 lg:py-16 max-w-7xl">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#FED501] mb-2">
          <Sparkles className="w-3.5 h-3.5" /> The Master Catalog
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif text-[#000000] tracking-tight">
          Shop All Handcrafted Filas
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          Authentic Yoruba caps woven from ancestral Aso-Oke, Sanyan raw silk, and ceremonial velvet for weddings, coronations, and dignitaries.
        </p>
      </div>

      {/* Top Filter & Search Bar */}
      <div className="bg-white border border-[#E8E1D5] rounded-3xl p-4 sm:p-5 shadow-sm mb-10 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="w-full md:max-w-xs">
            <ProductSearch />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap hidden sm:inline">
              Sort by:
            </span>
            <ProductSort />
          </div>
        </div>

        {/* Collection Filter Horizontal Pills */}
        <div className="pt-3 border-t border-slate-100">
          <Suspense
            fallback={
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <div className="h-8 w-20 bg-slate-200/70 rounded-xl animate-pulse shrink-0" />
                <div className="h-8 w-24 bg-slate-200/70 rounded-xl animate-pulse shrink-0" />
                <div className="h-8 w-28 bg-slate-200/70 rounded-xl animate-pulse shrink-0" />
              </div>
            }
          >
            <CategoryFilter />
          </Suspense>
        </div>
      </div>

      {/* Product Grid */}
      <ProductGrid />
    </main>
  );
}