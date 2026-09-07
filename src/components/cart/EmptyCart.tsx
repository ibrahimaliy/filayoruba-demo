import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function EmptyCart() {
  return (
    <div className="py-20 lg:py-28 text-center max-w-md mx-auto space-y-5">
      <div className="w-16 h-16 rounded-3xl bg-white border border-[#E8E1D5] text-[#FED501] flex items-center justify-center mx-auto shadow-sm">
        <ShoppingBag className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold font-serif text-[#000000] tracking-tight">
          Your Bag is Empty
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Explore our handcrafted Yoruba Fila caps woven with ancestral Aso-Oke, Sanyan silk, and ceremonial velvet.
        </p>
      </div>

      <div className="pt-3">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          <span>Explore All Filas</span>
          <ArrowRight className="w-4 h-4 text-[#FED501]" />
        </Link>
      </div>
    </div>
  );
}
