import type { Metadata } from "next";
import Link from "next/link";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import {
  Sparkles,
  Award,
  ShieldCheck,
  Crown,
  Compass,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Our Heritage & Yoruba Cap Artistry",
  description:
    "Discover the ancestral artistry behind Fìlà Yorùbá. Master narrow-loom weavers, vintage Aṣọ Òkè (Sányán, Aláàárì, Ẹtù), and headwear crafted for thoroughbred gentlemen.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      {/* 1. Hero Editorial Section */}
      <section className="bg-[#000000] text-white py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#FED501]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-[#FED501]">
            <Sparkles className="w-3.5 h-3.5" /> Fìlà Yorùbá &bull; Our Heritage Lineage
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif tracking-tight leading-tight">
            The Crown of the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-[#FED501]">
              Thoroughbred Gentleman
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-white/80 leading-relaxed">
            In Yorùbá worldview, a man is never fully crowned without his Fìlà. It is the definitive seal of stature, maturity, and cultural mastery.
          </p>
        </div>
      </section>

      {/* 2. The Three Ancestral Aṣọ Òkè Weaves */}
      <section className="py-20 lg:py-28 border-b border-[#E2D9CC] bg-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FED501]">
              Ancestral Textiles
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#000000]">
              The Holy Trinity of Yoruba Weaves
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Before modern industrialization, Yoruba royalty and nobility recognized three sacred handwoven textiles, each loomed with distinctive botanical dyes and raw silks.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Sányán */}
            <div className="bg-[#FAF9F6] border border-[#E8E1D5] rounded-3xl p-8 space-y-4 hover:border-[#FED501] transition-all shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-[#000000] text-[#FED501] flex items-center justify-center font-serif font-bold text-lg">
                S
              </div>
              <h3 className="text-xl font-serif font-bold text-[#000000]">
                Sányán (Raw Wild Silk)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Woven from the cocoons of the wild *Anaphe* moth. Pale khaki and earth-toned, Sányán is considered the sovereign king of Yoruba cloths, traditionally worn for coronations and milestone installations.
              </p>
            </div>

            {/* Aláàárì */}
            <div className="bg-[#FAF9F6] border border-[#E8E1D5] rounded-3xl p-8 space-y-4 hover:border-[#FED501] transition-all shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-[#000000] text-[#FED501] flex items-center justify-center font-serif font-bold text-lg">
                A
              </div>
              <h3 className="text-xl font-serif font-bold text-[#000000]">
                Aláàárì (Imperial Crimson)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hand-dyed in rich magenta and crimson tones. Originating from ancient camwood and imported silk fibers, Aláàárì exudes regal vitality, celebration, and triumph.
              </p>
            </div>

            {/* Ẹtù */}
            <div className="bg-[#FAF9F6] border border-[#E8E1D5] rounded-3xl p-8 space-y-4 hover:border-[#FED501] transition-all shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-[#000000] text-[#FED501] flex items-center justify-center font-serif font-bold text-lg">
                Ẹ
              </div>
              <h3 className="text-xl font-serif font-bold text-[#000000]">
                Ẹtù (Deep Indigo Weave)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Deep, dark indigo speckled with white cross-threads resembling the plumage of the guinea fowl (*Ẹtù*). Reserved for high dignitaries, council elders, and ceremonial banquets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Archival Craftsmanship Grid */}
      <section className="py-20 lg:py-28 bg-[#FAF9F6]">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FED501]">
              Master Guild of Oyo
            </span>

            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#000000] leading-tight">
              Preserving the Heritage of Yoruba Master Tailors
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed">
              Every Fìlà Yorùbá cap is individually cut, structured, and shaped by veteran artisans whose families have practiced the craft for generations across Oyo, Iseyin, Ibadan, and Ijebu.
            </p>

            <p className="text-sm text-slate-600 leading-relaxed">
              We reinforce each piece with a breathable, structured foundation that ensures the cap retains its sculpted geometric fold—whether worn in the youth *Ọ̀tún* tilt, elder *Òsì* fold, or upright ceremonial *Abetíajá*.
            </p>

            <div className="pt-2 flex items-center gap-6 text-xs text-[#000000] font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#FED501]" /> 100% Narrow Loom
              </span>
              <span className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-[#FED501]" /> Bespoke Precision Fit
              </span>
            </div>
          </div>

          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900 border border-[#E8E1D5] shadow-xl">
            <ImageWithFallback
              src="/images/story/fila_alaari_crimson_gold_gobi.png"
              alt="Artisan Yoruba Fila Craftsmanship"
              fill
              className="object-cover object-center"
              fallbackTitle="Artisan Yoruba Fìlà Craftsmanship"
              fallbackSubtitle="Master Oyo Weave • Oyo State, Nigeria"
              fallbackBadge="Ancestral Weave"
              fallbackVariant="lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/70 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-6 right-6 text-white flex items-center justify-between pointer-events-none">
              <span className="text-xs font-bold uppercase tracking-widest text-[#FED501]">
                Master Oyo Weave
              </span>
              <span className="text-xs text-white/80">Oyo State, Nigeria</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA Banner */}
      <section className="py-20 bg-white border-t border-[#E2D9CC] text-center">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-[#000000] text-[#FED501] flex items-center justify-center mx-auto shadow-md">
            <Award className="w-6 h-6" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#000000]">
            Wear Your Crown with Pride
          </h2>

          <p className="text-sm text-slate-600 leading-relaxed">
            Explore our curated catalog of authentic Yoruba caps crafted with ancestral precision and cultural mastery.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/products"
              className="px-8 py-3.5 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <span>Explore All Filas</span>
              <ArrowRight className="w-4 h-4 text-[#FED501]" />
            </Link>

            <Link
              href="/#collections"
              className="px-8 py-3.5 rounded-xl border border-slate-300 hover:border-[#000000] bg-white text-[#000000] text-xs font-bold transition-all flex items-center gap-2"
            >
              <span>View Collections</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
