import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Truck } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-16 lg:py-24 bg-white border-t border-[#E4E4E7]">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="rounded-[36px] overflow-hidden bg-gradient-to-br from-[#000000] via-[#171717] to-[#262626] text-white p-8 sm:p-14 lg:p-20 text-center relative shadow-2xl shadow-black/20">
          {/* Background Ambient Aura */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#FED501]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#FED501]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-[#FED501]">
              <Sparkles className="w-3.5 h-3.5" /> Handcrafted For Thoroughbred Gentlemen
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif tracking-tight leading-tight">
              Crown Your Attire With Sovereign Yoruba Elegance
            </h2>

            <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-lg mx-auto">
              Choose from our master-woven Gòbì, Abetíajá, and Sányán collections, delivered directly to your doorstep in signature luxury presentation.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/products"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FED501] hover:bg-[#EAB308] text-[#000000] text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-[#FED501]/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Shop All Filas</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-white/70">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#FED501]" /> Nationwide 24-48h Delivery
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Genuine Ancestral Aṣọ Òkè
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
