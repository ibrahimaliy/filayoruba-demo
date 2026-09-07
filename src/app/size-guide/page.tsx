import type { Metadata } from "next";
import Link from "next/link";
import {
  Ruler,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { MEASUREMENT_STEPS } from "@/data/sizing";
import SizeGuideCalculator from "@/components/products/SizeGuideCalculator";

export const metadata: Metadata = {
  title: "Fìlà Yorùbá Size Guide & How to Measure | Fìlà Yorùbá Luxury",
  description:
    "Official Fìlà Yorùbá sizing guide. Learn how to accurately measure your head circumference for handcrafted Aso-Oke caps (XS to XXXL) with our 4-step measurement guide and interactive calculator.",
  openGraph: {
    title: "Fìlà Yorùbá Size Guide & Measurement Masterclass | Fìlà Yorùbá",
    description:
      "Accurate head measurement guide and official size chart for handcrafted Nigerian Yoruba Fila caps.",
  },
};

export default function SizeGuidePage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 py-10 lg:py-14 max-w-4xl space-y-10">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-none"
      >
        <Link href="/" className="hover:text-[#000000] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <span className="font-semibold text-[#000000]">Size Guide</span>
      </nav>

      {/* Clean Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#FED501]">
          <Sparkles className="w-3.5 h-3.5" /> Official Measurement Standard
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#000000] tracking-tight">
          Fìlà Yorùbá Size Guide
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
          Fìlà Yorùbá sizing is based on head circumference. Use the calculator below to find your exact size, or refer to our standard 4-step measurement principles.
        </p>
      </div>

      {/* Interactive Size Calculator & Size Chart */}
      <section>
        <SizeGuideCalculator />
      </section>

      {/* 4-Step Measurement Guide (Clean 2x2 Grid) */}
      <section className="space-y-4 pt-4 border-t border-slate-100">
        <h2 className="text-xl font-bold font-serif text-[#000000]">
          How to Measure (4 Principles)
        </h2>

        <div className="grid sm:grid-cols-2 gap-3.5">
          {MEASUREMENT_STEPS.map((step) => (
            <div
              key={step.step}
              className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-2 shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#000000] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {step.step}
                </span>
                <h3 className="text-sm font-bold text-[#000000]">
                  {step.title}
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Clean Golden Rule Callout */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-xs flex items-start gap-2.5">
          <span className="font-bold shrink-0">Golden Rule:</span>
          <span>
            If your head measurement falls between two sizes (e.g. 23.2″), always choose the larger size for a comfortable Yoruba crown fit.
          </span>
        </div>
      </section>

      {/* Free Exchanges Footer Assurance */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="text-xs text-slate-600">
            <p className="font-bold text-slate-900">Complimentary Size Exchanges</p>
            <p>Every Fìlà Yorùbá cap includes free size exchange within 7 days of delivery.</p>
          </div>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
        >
          <span>Browse All Caps</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#FED501]" />
        </Link>
      </div>
    </main>
  );
}
