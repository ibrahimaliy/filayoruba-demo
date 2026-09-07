import ImageWithFallback from "@/components/ui/ImageWithFallback";
import Link from "next/link";
import { Sparkles, ArrowRight, Award, Compass } from "lucide-react";

export default function BrandStory() {
  return (
    <section className="py-20 lg:py-28 bg-white border-y border-[#E4E4E7] overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#FED501]">
              <Sparkles className="w-3.5 h-3.5" /> Ancestral Lineage &bull; Oyo, Iseyin & Ijebu
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#000000] tracking-tight leading-tight">
              Rooted in Ancient Yoruba Royalty. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#000000] to-[#FED501]">
                Tailored for Modern Kings.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              In Yoruba culture, the <em>Fìlà</em> is far more than an accessory—it is an indigenous crown of distinction, an emblem of honor (<em>Ọlá</em>), and the finishing stroke of a thoroughbred gentleman.
            </p>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Every piece in our catalog is hand-spun and loom-woven across the Yoruba heartland using centuries-old artisan traditions. From raw <strong>Sányán</strong> wild silk to shimmering metallic <strong>Aláàárì</strong> and plush celestial velvet, we preserve the architectural silhouettes of <strong>Gòbì</strong>, <strong>Abetíajá</strong>, and <strong>Fìlà Ìjẹ̀bú</strong> to hold their sculpted forms throughout grand celebrations.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/about"
                className="px-6 py-3.5 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all shadow-md shadow-black/10 flex items-center justify-center gap-2"
              >
                <span>Read Our Heritage Story</span>
                <ArrowRight className="w-4 h-4 text-[#FED501]" />
              </Link>

              <Link
                href="/size-guide"
                className="px-6 py-3.5 rounded-xl border border-slate-300 hover:border-[#000000] bg-white text-[#000000] text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4 text-[#FED501]" />
                <span>Head Sizing Guide</span>
              </Link>
            </div>
          </div>

          {/* Real Cap Imagery Collage */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              {/* Card 1: Handwoven Gobi */}
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-lg group">
                <ImageWithFallback
                  src="/images/story/fila_royal_indigo_wheat_gobi.png"
                  alt="Royal Indigo Gobi Fila"
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  fallbackTitle="Royal Indigo Gòbì Fìlà"
                  fallbackSubtitle="Ancestral Indigo Weave"
                  fallbackBadge="Oyo Narrow Loom"
                  fallbackVariant="md"
                />
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/60 text-[11px] font-bold text-[#000000] z-10 shadow-xs">
                  Ancestral Indigo Weave
                </div>
              </div>

              {/* Card 2: Embroidered Velvet */}
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-lg mt-8 group">
                <ImageWithFallback
                  src="/images/story/fila_royal_maroon_velvet_embroidered.png"
                  alt="Royal Maroon Velvet Fila"
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  fallbackTitle="Royal Maroon Velvet Fìlà"
                  fallbackSubtitle="Celestial Embroidered Velvet"
                  fallbackBadge="Ceremonial Velvet"
                  fallbackVariant="md"
                />
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/60 text-[11px] font-bold text-[#000000] z-10 shadow-xs">
                  Celestial Embroidered Velvet
                </div>
              </div>
            </div>

            {/* Heritage Badge */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#000000] text-white px-5 py-2.5 rounded-full border-2 border-[#FED501] shadow-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap">
              <Award className="w-4 h-4 text-[#FED501]" />
              <span>Master Yoruba Craftsmen Guild</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}