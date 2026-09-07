"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useCartStore } from "@/store/cart-store";
import { useCartDrawerStore } from "@/store/cart-drawer-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { subscribeAuthChange } from "@/lib/auth-events";

export default function Navbar() {
  const mounted = useIsMounted();
  const pathname = usePathname();
  const [customer, setCustomer] = useState<{ firstName: string; email: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (!isCurrent) return;
        if (res.ok && data.authenticated && data.customer) {
          setCustomer(data.customer);
        } else {
          setCustomer(null);
        }
      } catch {
        if (isCurrent) setCustomer(null);
      }
    }

    checkAuth();

    // Subscribe to immediate auth state change events (e.g. login/logout)
    const unsubscribe = subscribeAuthChange((e) => {
      if (e?.detail?.loggedOut) {
        setCustomer(null);
      } else {
        checkAuth();
      }
    });

    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const wishlistCount = useWishlistStore((state) => state.productIds.length);
  const items = useCartStore((state) => state.items);
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const openDrawer = useCartDrawerStore((state) => state.open);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Shop All" },
    { href: "/track-order", label: "Track Order", highlight: true },
    { href: "/about", label: "Heritage" },
    { href: "/contact", label: "Contact" },
    { href: "/admin/login", label: "Admin Sandbox ⚡" },
  ];

  return (
    <>
      {/* 1. Regal Continuous Sliding Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Main Navigation with Yellow Background */}
      <header className="sticky top-0 z-40 w-full bg-[#FED501] border-b border-black/10 shadow-xs transition-all">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
          {/* Mobile & Tablet Menu Button & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#000000] hover:bg-black/10 rounded-xl cursor-pointer transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

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
          </div>

          {/* Desktop Navigation Links (>= 1024px) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-xs font-bold uppercase tracking-wider text-[#000000]">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-1.5 transition-colors group ${
                    isActive
                      ? "text-[#000000] font-black"
                      : "text-black/80 hover:text-black"
                  } ${link.highlight ? "text-[#000000] flex items-center gap-1 font-black" : ""}`}
                >
                  <span>{link.label}</span>
                  {link.highlight && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#000000] animate-pulse" />
                  )}
                  {/* Underline Indicator */}
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 bg-[#000000] transition-all duration-300 ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="relative p-2.5 rounded-xl text-[#000000] hover:bg-black/10 transition-all cursor-pointer"
            >
              <Heart size={20} className="stroke-[2.2]" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-[#000000] text-[10px] font-extrabold text-[#FED501] flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <button
              type="button"
              onClick={openDrawer}
              aria-label="Open Shopping Bag"
              className="relative p-2 sm:px-3 sm:py-2.5 rounded-xl bg-[#000000] text-white hover:bg-black transition-all shadow-md shadow-black/10 cursor-pointer flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShoppingBag size={18} className="text-[#FED501]" />
              <span className="text-xs font-bold hidden sm:inline">Bag</span>
              {mounted && totalItemsCount > 0 && (
                <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-[#FED501] text-[10px] font-black text-[#000000] flex items-center justify-center shadow-xs">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Customer Account Button */}
            <Link
              href="/account"
              aria-label="Customer Account Portal"
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-black/20 hover:border-black text-[#000000] bg-black/5 hover:bg-black/10 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {mounted && customer ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000]">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span className="max-w-[80px] truncate">{customer.firstName}</span>
                </div>
              ) : (
                <>
                  <User size={17} className="stroke-[2.2]" />
                  <span className="text-xs font-bold hidden sm:inline">Account</span>
                </>
              )}
            </Link>
          </div>
        </div>

        {/* 3. Mobile & Tablet Navigation Drawer (< 1024px) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-black/10 bg-[#FED501] p-5 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-xl">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                    pathname === link.href
                      ? "bg-[#000000] text-[#FED501]"
                      : "text-[#000000] hover:bg-black/10"
                  }`}
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-4 h-4 opacity-70" />
                </Link>
              ))}
            </nav>

            <div className="pt-3 border-t border-black/10 text-center text-[11px] text-black/70 font-semibold">
              <span>Fìlà Yorùbá Luxury &bull; Handcrafted in Oyo</span>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
