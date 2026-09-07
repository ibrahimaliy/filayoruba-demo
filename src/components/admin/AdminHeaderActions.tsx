"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, Crown, Shield } from "lucide-react";
import NotificationCenter from "@/components/admin/NotificationCenter";

interface AdminUserSession {
  id?: string;
  name?: string;
  email?: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER";
}

export default function AdminHeaderActions() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUserSession | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/admin/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isSuper = user?.role === "SUPER_ADMIN";

  return (
    <div className="flex items-center gap-1.5 sm:gap-3 ">
      {/* 1. Realtime Push Notification Center */}
      <NotificationCenter />

      {user && (
        <div
          title={`${user.name || (isSuper ? "Super Admin" : "Admin")} (${user.role})`}
          className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:pl-2 sm:pr-3 sm:py-1.5 rounded-full bg-slate-100/90 border border-[#000000] text-xs font-semibold text-[#000000] shadow-2xs"
        >
          <div
            className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
              isSuper
                ? "bg-[#FED501] text-[#000000] shadow-xs font-bold"
                : "bg-[#000000] text-white"
            }`}
          >
            {isSuper ? <Crown className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-bold text-slate-800 max-w-[110px] lg:max-w-[140px] truncate">
              {user.name || (isSuper ? "Super Admin" : "Artisan Admin")}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        title="Log out of Admin Portal"
        className="flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold text-[#000000] bg-slate-100/90 hover:text-rose-600 hover:bg-rose-50 border border-[#000000] hover:border-rose-200 transition-all disabled:opacity-50 cursor-pointer"
        aria-label="Logout"
      >
        {isLoggingOut ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
        ) : (
          <LogOut className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}

