"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  User,
  Package,
  Sliders,
  LogOut,
  Sparkles,
  Loader2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { notifyAuthChange } from "@/lib/auth-events";
import { useCheckoutStore } from "@/store/checkout-store";

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoading, setIsLoading] = useState(true);
  const [customer, setCustomer] = useState<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  } | null>(null);

  // Check customer session
  useEffect(() => {
    // If we're on the login page itself, don't check session loop
    if (pathname === "/account/login") {
      setIsLoading(false);
      return;
    }

    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();

        if (res.ok && data.authenticated && data.customer) {
          setCustomer(data.customer);
        } else {
          router.push(`/account/login?from=${encodeURIComponent(pathname)}`);
        }
      } catch {
        router.push(`/account/login?from=${encodeURIComponent(pathname)}`);
      } finally {
        setIsLoading(false);
      }
    }

    checkSession();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      useCheckoutStore.getState().clearCheckout();
      notifyAuthChange({ loggedOut: true });
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/account/login");
      router.refresh();
    } catch {
      useCheckoutStore.getState().clearCheckout();
      notifyAuthChange({ loggedOut: true });
      router.push("/account/login");
    }
  };

  // If on login page, render children directly without dashboard shell
  if (pathname === "/account/login") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#000000] mx-auto" />
          <p className="text-xs text-slate-500 mt-3 font-medium">Verifying customer portal...</p>
        </div>
      </main>
    );
  }

  const navItems = [
    {
      href: "/account",
      label: "Account Overview",
      icon: User,
    },
    {
      href: "/account/orders",
      label: "Order History",
      icon: Package,
    },
    {
      href: "/account/profile",
      label: "Profile & Sizing",
      icon: Sliders,
    },
  ];

  return (
    <main className="min-h-[85vh] bg-[#FAF9F6] py-10 sm:py-14 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="bg-[#000000] text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl shadow-[#000000]/10 border border-[#262626]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FED501] to-[#EAB308] flex items-center justify-center text-[#000000] font-serif text-2xl font-bold shadow-lg shadow-[#FED501]/20">
              {customer?.firstName ? customer.firstName.charAt(0).toUpperCase() : "F"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-[#FED501] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Patron
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-white mt-0.5">
                Welcome, {customer?.firstName} {customer?.lastName}
              </h1>
              <p className="text-xs text-white/60 mt-0.5">{customer?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
            >
              Browse Collections
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Portal Grid */}
        <div className="grid lg:grid-cols-[240px_1fr] gap-8 items-start">
          {/* Navigation Sidebar */}
          <aside className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all",
                    isActive
                      ? "bg-[#000000] text-white shadow-md shadow-[#000000]/10"
                      : "text-slate-600 hover:text-[#000000] hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4", isActive ? "text-[#FED501]" : "text-slate-400")} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={cn("w-3.5 h-3.5 opacity-50", isActive ? "text-white" : "text-slate-400")} />
                </Link>
              );
            })}
          </aside>

          {/* Main Tab Content */}
          <section className="min-w-0">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
