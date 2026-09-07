"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";
import {
  LayoutDashboard,
  PackageCheck,
  ShoppingBag,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Layers,
  History,
  Users,
  BookUser,
  Sliders,
  Menu,
  X,
  MessageSquareQuote,
} from "lucide-react";

import AdminHeaderActions from "@/components/admin/AdminHeaderActions";

interface AdminShellProps {
  children: ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isLoginPage = pathname === "/admin/login";

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // If on /admin/login, render children full-screen without admin sidebar or topbar
  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    {
      href: "/admin",
      label: "Overview",
      icon: LayoutDashboard,
      description: "Revenue & Store Metrics",
    },
    {
      href: "/admin/orders",
      label: "Order Fulfillment",
      icon: PackageCheck,
      description: "Live Artisan Pipeline",
    },
    {
      href: "/admin/customers",
      label: "Customer Book",
      icon: BookUser,
      description: "Patron Directory & LTV",
    },
    {
      href: "/admin/products",
      label: "Products & Stock",
      icon: ShoppingBag,
      description: "Inventory & Catalog",
    },
    {
      href: "/admin/collections",
      label: "Collections",
      icon: Layers,
      description: "Cap Families & Weaves",
    },
    {
      href: "/admin/reviews",
      label: "Customer Reviews",
      icon: MessageSquareQuote,
      description: "Ratings & Moderation",
    },
    {
      href: "/admin/hero",
      label: "Hero & Banners",
      icon: Sliders,
      description: "Homepage Slider & Promo",
    },
    {
      href: "/admin/activity",
      label: "Activity Logs",
      icon: History,
      description: "Audit Trail & Events",
    },
    {
      href: "/admin/team",
      label: "Team & Roles",
      icon: Users,
      description: "Admin RBAC & Access",
    },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F8FAFC] text-[#000000] flex flex-col lg:flex-row">
      {/* 1. Mobile & Tablet Backdrop Overlay */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* 2. Admin Sidebar (Responsive Drawer on Mobile & Tablets, Fixed Sidebar on Desktop >= 1024px) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 sm:w-80 lg:w-64 xl:w-72 h-full bg-[#000000] text-white flex-shrink-0 flex flex-col justify-between border-r border-[#262626] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto scrollbar-none">
          {/* Brand Header */}
          <div className="p-5 lg:p-6 border-b border-white/10 flex items-center justify-between shrink-0">
            <Link href="/admin" className="inline-block transition-transform duration-200 hover:scale-105" aria-label="Fìlà Yorùbá Admin">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden isolate shrink-0">
                <img
                  src="/images/fallback%20logo/fallback%20logo.jpg"
                  alt="Fìlà Yorùbá"
                  className="w-full h-full object-cover rounded-full scale-[1.7]"
                  loading="eager"
                />
              </div>
            </Link>

            {/* Mobile/Tablet Close Button */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white lg:hidden cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 lg:p-4 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#FED501]">
              Operations & Guild
            </div>
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? "bg-[#FED501] text-[#000000] shadow-md shadow-[#FED501]/20 font-bold"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? "text-[#000000]" : "text-[#FED501]"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer & Storefront Link */}
        <div className="p-4 border-t border-white/10 shrink-0 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-all group"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FED501]" />
              <span>Live Storefront</span>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-white/50 group-hover:text-[#FED501] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>
        </div>
      </aside>

      {/* 3. Main Content View Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 lg:h-18 bg-[#FED501] border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-[#000000] uppercase tracking-wider">
                Artisan Operations Management
              </span>
            </div>
          </div>

          {/* Admin Header Actions (Avatar, Sign Out, etc.) */}
          <AdminHeaderActions />
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
