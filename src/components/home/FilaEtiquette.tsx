"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, Compass, Crown, Shield, HeartHandshake, CheckCircle2 } from "lucide-react";
import ImageFallbackCard from "@/components/ui/ImageFallbackCard";

interface TiltRule {
  id: string;
  yorubaName: string;
  englishTitle: string;
  posture: string;
  meaning: string;
  culturalContext: string;
  recommendedStyle: string;
  icon: typeof Compass;
  image: string;
  badge: string;
}

const TILT_RULES: TiltRule[] = [
  {
    id: "right",
    yorubaName: "Ìtẹ̀sí Ọ̀tún",
    englishTitle: "Tilted to the Right",
    posture: "Folded or inclined toward the right ear",
    meaning: "Youth, Ambition & Single Gentlemen",
    culturalContext:
      "Traditionally worn by young men and bachelors. Tilting your Fìlà to the right signals vitality, forward-looking aspiration, and that you are eligible and unattached in society.",
    recommendedStyle: "Gòbì / Sénítọ̀",
    icon: Compass,
    image: "/images/guides/fila_emerald_silver_gobi.png",
    badge: "Youth & Bachelor Posture",
  },
  {
    id: "left",
    yorubaName: "Ìtẹ̀sí Òsì",
    englishTitle: "Tilted to the Left",
    posture: "Folded or inclined toward the left ear",
    meaning: "Elders, Married Men & Titled Chiefs (Ọlọ́lá)",
    culturalContext:
      "Traditionally reserved for elders, married family heads, and men of traditional title. Folding to the left communicates settled authority, mature dignity, and social seniority.",
    recommendedStyle: "Vintage Aṣọ Òkè Gòbì / Ìjẹ̀bú",
    icon: Crown,
    image: "/images/guides/fila_alaari_crimson_gold_gobi.png",
    badge: "Elder & Chieftaincy Posture",
  },
  {
    id: "forward",
    yorubaName: "Ìtẹ̀sí Iwájú",
    englishTitle: "Tilted Forward",
    posture: "Pushed gently forward over the forehead",
    meaning: "Humility, Reverence & Respect (Ìtẹríba)",
    culturalContext:
      "A gesture of deep reverence worn when approaching kings (Kábíyèsí), family patriarchs, or entering ancestral sacred grounds. It shows modesty and respectful disposition.",
    recommendedStyle: "Sányán Silk / Handwoven Twill",
    icon: HeartHandshake,
    image: "/images/guides/fila_sovereign_multistripe_sanyan_gobi.jpg",
    badge: "Humility & Reverence",
  },
  {
    id: "upright",
    yorubaName: "Abetíajá / Gíga",
    englishTitle: "Upright & Flaunted Flaps",
    posture: "Flaps standing tall or angled outward symmetrically",
    meaning: "Coronation, Victory & Festival Triumph",
    culturalContext:
      "The ceremonial posture of the Abetíajá ('Dog's Ears') cap. When both flaps stand erect, it heralds grand jubilation, festive triumph, chieftaincy conferment, and wedding grandeur.",
    recommendedStyle: "Abetíajá / Celestial Velvet",
    icon: Shield,
    image: "/images/guides/fila_forest_emerald_sanyan_gobi.png",
    badge: "Royal Celebration",
  },
];

export default function FilaEtiquette({
  availableGuideImages = [],
}: {
  availableGuideImages?: string[];
}) {
  const [selectedId, setSelectedId] = useState("right");
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const activeRule = TILT_RULES.find((r) => r.id === selectedId) || TILT_RULES[0];
  const Icon = activeRule.icon;

  // Guides folder is the ONLY source for guide images.
  // If the guides folder is empty, or this image file does not exist, or image fails to load,
  // we display the curated Yoruba Background & Gradient Card.
  const imageFilename = activeRule.image ? activeRule.image.split("/").pop() || "" : "";
  const isImageInGuidesFolder =
    availableGuideImages.length > 0 && availableGuideImages.includes(imageFilename);
  const hasFailed = Boolean(failedImages[activeRule.id]);
  const shouldDisplayImage = Boolean(activeRule.image && isImageInGuidesFolder && !hasFailed);

  return (
    <section className="py-20 lg:py-28 bg-[#FAF9F6] border-y border-[#E4E4E7] overflow-hidden relative">
      {/* Background Accent Glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-[#FED501]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#000000]/5 border border-[#000000]/10 text-xs font-bold uppercase tracking-widest text-[#FED501]">
            <Sparkles className="w-3.5 h-3.5" /> Ètò Ìbò Fìlà &bull; Cultural Etiquette
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#000000] tracking-tight">
            The Art of Tilting Your Fìlà
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            In Yoruba tradition, a cap is not merely placed on the head—the direction of its fold speaks silent volumes about status, marriage, age, and respect.
          </p>
        </div>

        {/* 4 Interactive Posture Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {TILT_RULES.map((rule) => {
            const isSelected = rule.id === selectedId;
            const TabIcon = rule.icon;
            return (
              <button
                key={rule.id}
                type="button"
                onClick={() => setSelectedId(rule.id)}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#000000] text-white border-[#000000] shadow-xl shadow-black/15 scale-[1.02]"
                    : "bg-white text-[#000000] border-[#E8E1D5] hover:border-[#FED501] hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSelected ? "bg-[#FED501] text-[#000000]" : "bg-[#000000]/5 text-[#000000]"
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FED501]" />}
                </div>

                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest block mb-0.5 ${
                      isSelected ? "text-[#FED501]" : "text-slate-500"
                    }`}
                  >
                    {rule.yorubaName}
                  </span>
                  <h3 className="font-serif font-bold text-sm sm:text-base leading-tight">
                    {rule.englishTitle}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Posture Detail Showcase Card */}
        <div className="bg-white rounded-3xl border border-[#E8E1D5] shadow-lg p-6 sm:p-10 lg:p-12 transition-all duration-500">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Image or Background & Gradient Card */}
            <div className="lg:col-span-5 relative aspect-[4/3] sm:aspect-square w-full rounded-2xl overflow-hidden shadow-md">
              {shouldDisplayImage ? (
                <div className="relative w-full h-full bg-slate-900">
                  <Image
                    src={activeRule.image}
                    alt={activeRule.englishTitle}
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover object-center transition-all duration-700 hover:scale-105"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [activeRule.id]: true }))
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/85 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-[#FED501] border border-white/20">
                      {activeRule.badge}
                    </span>
                    <p className="mt-1 font-serif font-bold text-base text-white truncate">
                      {activeRule.yorubaName} &bull; {activeRule.recommendedStyle}
                    </p>
                  </div>
                </div>
              ) : (
                <ImageFallbackCard
                  title={activeRule.yorubaName}
                  subtitle={activeRule.englishTitle}
                  badge={activeRule.badge}
                  icon={Icon}
                  variant="lg"
                />
              )}
            </div>

            {/* Right Column: Cultural Explanation & Protocol */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#000000] text-[#FED501] flex items-center justify-center shadow-sm">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#FED501] font-bold block">
                    {activeRule.yorubaName}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold font-serif text-[#000000]">
                    {activeRule.englishTitle}
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E1D5] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Symbolic Meaning:
                </span>
                <p className="font-bold text-[#000000] text-sm sm:text-base">
                  {activeRule.meaning}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Ancestral Protocol & Heritage:
                </span>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {activeRule.culturalContext}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-[#000000] block">Recommended Silhouette:</span>
                  <span>{activeRule.recommendedStyle}</span>
                </div>

                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all shadow-md shadow-black/10"
                >
                  <span>Explore Matching Filas</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FED501]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
