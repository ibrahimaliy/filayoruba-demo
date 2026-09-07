"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { AnnouncementBarConfig } from "@/types/announcement";
import { DEFAULT_ANNOUNCEMENT_CONFIG } from "@/data/default-announcements";

export default function AnnouncementBar() {
  const [config, setConfig] = useState<AnnouncementBarConfig>(DEFAULT_ANNOUNCEMENT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    async function fetchConfig() {
      try {
        const res = await fetch("/api/announcement");
        if (!res.ok) return;
        const data = await res.json();
        if (isCurrent && data?.success && data?.config) {
          setConfig(data.config);
        }
      } catch {
        // Fall back gracefully to default configuration
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    fetchConfig();

    return () => {
      isCurrent = false;
    };
  }, []);

  // If disabled or no messages, do not render
  if (!config.isEnabled || !config.messages || config.messages.length === 0) {
    return null;
  }

  // Duplicate messages twice for a mathematically seamless, gap-free infinite ticker loop
  const tickerItems = [...config.messages, ...config.messages];
  const durationSeconds = Math.max(config.speed || 25, 5);

  return (
    <aside
      role="region"
      aria-label="Store Announcements"
      className="relative w-full bg-[#000000] text-white text-[11px] sm:text-xs font-medium py-2 sm:py-2.5 border-b border-white/10 overflow-hidden select-none"
    >
      {/* Edge Gradient Shadows for regal, cinematic infinite scroll aesthetic */}
      <div
        className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#000000] via-[#000000]/80 to-transparent z-10 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#000000] via-[#000000]/80 to-transparent z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Marquee Wrapper with Hover-To-Pause Capability */}
      <div
        className="marquee-wrapper flex overflow-hidden w-full cursor-default"
        title="Store Announcements — Hover to pause"
      >
        <div
          className="animate-marquee flex items-center shrink-0 whitespace-nowrap"
          style={
            {
              "--marquee-duration": `${durationSeconds}s`,
            } as React.CSSProperties
          }
        >
          {tickerItems.map((message, idx) => (
            <div
              key={`ticker-${idx}-${message.slice(0, 10)}`}
              className="inline-flex items-center shrink-0"
            >
              <span className="text-white/95 tracking-wide px-3 sm:px-4">
                {message}
              </span>
              <span
                className="inline-flex items-center text-[#FED501] opacity-90 mx-2 sm:mx-3 shrink-0"
                aria-hidden="true"
              >
                <Sparkles className="w-3 h-3 text-[#FED501]" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
