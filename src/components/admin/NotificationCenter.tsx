"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Volume2,
  VolumeX,
  CheckCheck,
  Trash2,
  Package,
  Sparkles,
  AlertTriangle,
  Star,
  ShieldAlert,
  ExternalLink,
  Check,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useAdminRealtime } from "@/hooks/useAdminRealtime";
import { AdminNotification, NotificationFilterCategory } from "@/types/notification";

function getRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 30) return "Just now";
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  } catch {
    return "Recent";
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "ORDER_PAID":
      return (
        <div className="w-8 h-8 rounded-xl bg-[#FED501] flex items-center justify-center text-[#000000] shadow-sm shadow-[#FED501]/30 shrink-0 font-bold">
          <Sparkles className="w-4 h-4 text-[#000000]" />
        </div>
      );
    case "ORDER_STATUS":
    case "ORDER_CREATED":
      return (
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
          <Package className="w-4 h-4" />
        </div>
      );
    case "STOCK_LOW":
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    case "NEW_REVIEW":
      return (
        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center shrink-0">
          <Star className="w-4 h-4 fill-purple-600" />
        </div>
      );
    case "SECURITY_ALERT":
      return (
        <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4" />
        </div>
      );
  }
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilterCategory>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isConnected,
    isMuted,
    toggleSound,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useAdminRealtime();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "orders") {
      return ["ORDER_PAID", "ORDER_STATUS", "ORDER_CREATED"].includes(n.type);
    }
    if (filter === "inventory") {
      return n.type === "STOCK_LOW";
    }
    if (filter === "reviews") {
      return n.type === "NEW_REVIEW";
    }
    if (filter === "security") {
      return n.type === "SECURITY_ALERT";
    }
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications center"
        className="relative p-2 rounded-xl text-[#000000] hover:text-[#000000] bg-slate-100/80 border border-[#000000] transition-all cursor-pointer group"
      >
        <Bell className="w-4 h-4 text-[#000000] group-hover:scale-110 transition-transform" />

        {/* Live SSE status indicator dot */}
        <span
          title={isConnected ? "Real-time updates active" : "Reconnecting to live feed..."}
          className={`absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full border border-white ${
            isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
          }`}
        />

        {/* Unread badge count */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-extrabold text-[10px] flex items-center justify-center shadow-sm animate-in zoom-in-75">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Dropdown Drawer */}
      {isOpen && (
        <div className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-16 sm:top-auto mt-1 sm:mt-2.5 w-auto sm:w-[420px] max-w-[calc(100vw-16px)] sm:max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-[#000000] text-white flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-bold tracking-wide">Live Feed</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#FED501] text-[#000000] text-[10px] font-extrabold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                title={isMuted ? "Unmute audio chime" : "Mute audio chime"}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isMuted ? "text-white/40 hover:text-white/80" : "text-[#FED501] hover:bg-white/10"
                }`}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="Mark all notifications as read"
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Clear All */}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  title="Clear all notifications"
                  className="p-1.5 rounded-lg text-white/70 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs overflow-x-auto no-scrollbar">
            {(
              [
                { id: "all", label: "All" },
                { id: "orders", label: "Orders" },
                { id: "inventory", label: "Inventory" },
                { id: "reviews", label: "Reviews" },
                { id: "security", label: "Security" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                  filter === tab.id
                    ? "bg-[#000000] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications Scroll List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center text-slate-400 mb-3">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Live updates will appear here automatically when orders or events occur.
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 transition-colors flex items-start gap-3 relative group ${
                    n.isRead ? "bg-white hover:bg-slate-50/80" : "bg-blue-50/40 hover:bg-blue-50/70"
                  }`}
                >
                  {/* Icon */}
                  {getNotificationIcon(n.type)}

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs ${n.isRead ? "font-bold text-slate-800" : "font-extrabold text-[#000000]"}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {getRelativeTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>

                    {/* Quick Link Action */}
                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={() => {
                          markAsRead(n.id);
                          setIsOpen(false);
                        }}
                        className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-[#000000] hover:text-[#FED501] transition-colors"
                      >
                        <span>View details</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>

                  {/* Mark single as read button */}
                  {!n.isRead && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      title="Mark as read"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-200/60 transition-all absolute right-2 top-3 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Status Bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Live Push Active</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-500 animate-pulse" />
                  <span className="text-amber-700 font-medium">Reconnecting...</span>
                </>
              )}
            </div>

            <Link
              href="/admin/activity"
              onClick={() => setIsOpen(false)}
              className="text-[#000000] hover:text-[#FED501] font-bold transition-colors"
            >
              Full Audit Logs →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
