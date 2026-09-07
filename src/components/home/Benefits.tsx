import {
  Gem,
  Truck,
  ShieldCheck,
  Crown,
  Ruler,
  Lock,
  Sparkles,
} from "lucide-react";

const benefits = [
  {
    title: "100% Handwoven Aso-Oke",
    description: "Authentic yarns woven on traditional Nigerian looms in Oyo State.",
    icon: Gem,
  },
  {
    title: "Sovereign Gobi & Abeti-Aja Folds",
    description: "Hand-structured geometric angles that retain their shape through all celebrations.",
    icon: Crown,
  },
  {
    title: "Precision Yoruba Sizing",
    description: "Available from XS to 3XL (22″ to 25″) for the authentic royal ceremonial fit.",
    icon: Ruler,
  },
  {
    title: "Nationwide Dispatch (1–3 Days)",
    description: "Fast express courier delivery to Lagos, Abuja, Port Harcourt, and all states.",
    icon: Truck,
  },
  {
    title: "Signature Luxury Box Packaging",
    description: "Shipped in structured Fìlà Yorùbá packaging to prevent crushing in transit.",
    icon: Sparkles,
  },
  {
    title: "Instant Paystack Protection",
    description: "Bank-grade encrypted checkout supporting cards, bank transfer, and USSD.",
    icon: Lock,
  },
];

export default function Benefits() {
  return (
    <section className="py-20 lg:py-28 bg-[#FAF9F6]">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#FED501] mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> The Fìlà Yorùbá Standard
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#000000] tracking-tight">
            Why Discerning Patrons Choose Fìlà Yorùbá
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Uncompromising authenticity, master weaving, and royal craftsmanship in every thread.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white border border-[#E8E1D5] rounded-3xl p-7 shadow-sm hover:shadow-xl hover:border-[#FED501]/70 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#000000]/5 group-hover:bg-[#000000] text-[#000000] group-hover:text-[#FED501] flex items-center justify-center mb-5 transition-all shadow-sm">
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-base font-bold font-serif text-[#000000] group-hover:text-black transition-colors">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}