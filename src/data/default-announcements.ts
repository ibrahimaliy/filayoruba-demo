import { AnnouncementBarConfig } from "@/types/announcement";

export const DEFAULT_ANNOUNCEMENT_MESSAGES: string[] = [
  "👑 Portfolio Showcase Sandbox — Full Storefront, Paystack Test Checkout & Admin Suite Live",
  "Fìlà Yorùbá — Handcrafted for Thoroughbred Gentlemen",
  "⚡ Instant Admin Sandbox Access Available via /admin/login",
  "Express Nationwide Dispatch — 1 to 3 Working Days Across All 36 States",
  "Imperial Artisanship — Master Embroidered Velvet, Aso-Oke & Sányán Silk",
];

export const DEFAULT_ANNOUNCEMENT_CONFIG: AnnouncementBarConfig = {
  id: "default",
  isEnabled: true,
  speed: 25, // 25 seconds for a complete loop
  messages: DEFAULT_ANNOUNCEMENT_MESSAGES,
};