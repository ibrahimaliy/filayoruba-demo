import { Sparkles } from "lucide-react";

export default function RootLoading() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-24 text-center">
      <div className="relative flex flex-col items-center space-y-6 max-w-sm mx-auto">
        {/* Pulsing Ambient Glow & Logo */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-[#FED501]/25 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden isolate shadow-xl shrink-0">
            <img
              src="/images/fallback%20logo/fallback%20logo.jpg"
              alt="Fìlà Yorùbá"
              className="w-full h-full object-cover rounded-full scale-[1.7] animate-pulse"
              loading="eager"
            />
          </div>
        </div>

        {/* Brand Caption */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#FED501]">
            <Sparkles className="w-3 h-3 text-[#FED501]" />
            <span>Fìlà Yorùbá Atelier</span>
          </div>
          <h2 className="text-lg font-serif font-bold text-[#000000]">
            Weaving Masterpieces...
          </h2>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Handcrafting authentic Yoruba heritage on ancestral Oyo narrow-looms.
          </p>
        </div>

        {/* Ambient Loading Bar */}
        <div className="w-36 h-1 rounded-full bg-slate-200 overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-[#FED501] via-[#FFF59D] to-[#FED501] w-full animate-shimmer" />
        </div>
      </div>
    </main>
  );
}
