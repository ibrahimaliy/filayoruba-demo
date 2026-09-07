import { Star, CheckCircle2, Quote, Sparkles } from "lucide-react";

const testimonials = [
  {
    name: "Chief Babatunde Adeleke",
    title: "Patron in Ibadan",
    cap: "Emerald & Silver Handwoven Gobi",
    review:
      "The silver yarn catches the light with remarkable subtlety. Wore it to a high-profile chieftaincy ceremony in Oyo and received endless praise.",
  },
  {
    name: "Dr. Femi Ogundipe",
    title: "Patron in Lagos",
    cap: "Royal Indigo & Wheat Gold Gobi",
    review:
      "The geometric fold holds its shape all day without sagging. Outstanding packaging and arrived in Victoria Island within 24 hours.",
  },
  {
    name: "Hon. Segun Awolowo",
    title: "Patron in Abuja",
    cap: "Imperial Purple & Crimson Gold Gobi",
    review:
      "A masterpiece of Yoruba color harmony. The texture and weight of the Aso-Oke speaks volumes of genuine artisanal craftsmanship.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 lg:py-28 bg-white border-b border-[#E4E4E7]">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#FED501] mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Patron Praise
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#000000] tracking-tight">
            Voices of Distinction
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Real experiences from leaders, dignitaries, and grooms across Nigeria and the global diaspora.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="bg-[#FAF9F6] border border-[#E8E1D5] rounded-3xl p-7 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-lg transition-all"
            >
              <div className="space-y-4">
                {/* 5 Stars */}
                <div className="flex items-center gap-1 text-[#FED501]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-[#FED501]" />
                  ))}
                </div>

                <Quote className="w-8 h-8 text-[#FED501]/30" />

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-serif italic">
                  "{item.review}"
                </p>
              </div>

              {/* Reviewer Details */}
              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#000000] flex items-center gap-1.5">
                    <span>{item.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {item.title} &bull; {item.cap}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}