"use client";

import Link from "next/link";
import { useCollections } from "@/hooks/use-collections";
import {
  Sparkles,
  ShieldCheck,
  Truck,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Lock,
} from "lucide-react";

export default function Footer() {
  const { data: collections, isLoading } = useCollections();

  const handleScrollToCollections = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = document.getElementById("collections");
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", "/#collections");
    }
  };

  return (
    <footer className="bg-[#000000] text-white border-t border-white/10 relative overflow-hidden">
      {/* Subtle Yellow Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-[#FED501] to-transparent opacity-40" />

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Column 1: Brand & Heritage Seal */}
          <div className="lg:col-span-2 space-y-5">
            <div className="inline-flex flex-col items-start gap-2">
              <Link href="/" className="inline-block transition-transform duration-200 hover:scale-105" aria-label="Fìlà Yorùbá Home">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden isolate shrink-0">
                  <img
                    src="/images/fallback%20logo/fallback%20logo.jpg"
                    alt="Fìlà Yorùbá"
                    className="w-full h-full object-cover rounded-full scale-[1.7]"
                    loading="eager"
                  />
                </div>
              </Link>
              <span className="text-[9px] uppercase tracking-widest text-[#FED501] font-semibold mt-1 block">
                Authentic Heritage &bull; Thoroughbred Gentlemen
              </span>
            </div>

            <p className="text-xs text-white/70 leading-relaxed max-w-sm">
              Nigeria’s foremost luxury Yoruba headwear house. Individually handwoven on ancestral Oyo narrow-looms using vintage Aṣọ Òkè, Sányán raw silk, Aláàárì crimson, and ceremonial velvet.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-white/80 pt-2">
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FED501]" /> 100% Authentic Aṣọ Òkè
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <Truck className="w-3.5 h-3.5 text-emerald-400" /> Nationwide Delivery
              </span>
            </div>
          </div>

          {/* Column 2: Master Collections */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#FED501]">
              Yoruba Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              {isLoading && !collections ? (
                <>
                  <li className="h-3.5 w-32 bg-white/10 rounded-sm animate-pulse" />
                  <li className="h-3.5 w-28 bg-white/10 rounded-sm animate-pulse" />
                  <li className="h-3.5 w-36 bg-white/10 rounded-sm animate-pulse" />
                  <li className="h-3.5 w-24 bg-white/10 rounded-sm animate-pulse" />
                </>
              ) : collections && collections.length > 0 ? (
                <>
                  {collections.slice(0, 8).map((col) => (
                    <li key={col.id}>
                      <Link
                        href={`/products?collection=${col.slug}`}
                        className="hover:text-white hover:underline transition-colors block truncate"
                      >
                        {col.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/#collections"
                      onClick={handleScrollToCollections}
                      className="text-[#FED501] font-bold hover:underline transition-colors inline-flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      View All Collections →
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link
                      href="/#collections"
                      onClick={handleScrollToCollections}
                      className="hover:text-white hover:underline transition-colors cursor-pointer"
                    >
                      Browse Collections
                    </Link>
                  </li>
                  <li>
                    <Link href="/products" className="text-[#FED501] font-bold hover:underline transition-colors">
                      View All Filas →
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Column 3: Patron Services */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#FED501]">
              Patron Services
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li>
                <Link href="/track-order" className="text-[#FED501] font-bold hover:underline transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FED501] animate-pulse" />
                  Live Order Tracker
                </Link>
              </li>
              <li>
                <Link href="/cancel-order" className="hover:text-white hover:underline transition-colors text-slate-300">
                  Cancel or Modify Order
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="hover:text-white hover:underline transition-colors">
                  Head Sizing Calculator
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white hover:underline transition-colors">
                  Patron Portal & History
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white hover:underline transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white hover:underline transition-colors">
                  Our Ancestral Heritage
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Showcase & Inquiries */}
          <div className="lg:col-span-1 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#FED501]">
              Demo Concierge
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#FED501] shrink-0 mt-0.5" />
                <span>Lagos &amp; Abuja, Nigeria (Portfolio Demo)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FED501] shrink-0" />
                <a href="mailto:demo@filayoruba.com" className="hover:text-white hover:underline transition-colors">
                  demo@filayoruba.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#FED501] shrink-0" />
                <span className="text-white/60">+234 (0) 800 FILA DEMO</span>
              </li>
              <li className="pt-1">
                <Link
                  href="/admin/login"
                  className="text-[#FED501] font-bold hover:underline transition-colors inline-flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Sandbox ⚡</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>
            &copy; {new Date().getFullYear()} Fìlà Yorùbá — Showcase Edition. Portfolio Demonstration.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/return-policy" className="hover:text-white transition-colors">
              Return &amp; Cancellation Policy
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact Concierge
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
