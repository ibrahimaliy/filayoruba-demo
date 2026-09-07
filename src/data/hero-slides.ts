import { HeroSlide } from "@/types/hero";

export type { HeroSlide };

export const heroSlides: HeroSlide[] = [
  {
    id: "slide-1",
    image: "/images/hero/fila_alaari_crimson_gold_gobi.png",
    badge: "Imperial Alaari",
    title: "Alaari Crimson & Gold Fila",
    subtitle: "Lustrous Metallic Aso-Oke with Gold Pinstripes",
    price: "₦58,000",
    link: "/products/alaari-crimson-metallic-gold-pinstripe-fila",
    tag: "Master Oyo Weave",
    order: 0,
    isActive: true,
  },
  {
    id: "slide-2",
    image: "/images/hero/fila_emerald_silver_gobi.png",
    badge: "Royal Gòbì",
    title: "Emerald & Silver Handwoven Gobi",
    subtitle: "Hand-Spun Silver Metallic Thread on Narrow Loom",
    price: "₦55,000",
    link: "/products/emerald-silver-handwoven-gobi-fila",
    tag: "Ancestral Loom",
    order: 1,
    isActive: true,
  },
  {
    id: "slide-3",
    image: "/images/hero/fila_royal_maroon_velvet_embroidered.png",
    badge: "Royal Velvet",
    title: "Royal Maroon Celestial Velvet",
    subtitle: "Hand-Stitched Celestial Gold Starburst Embroidery",
    price: "₦62,000",
    link: "/products/royal-maroon-embroidered-velvet-fila",
    tag: "Ceremonial Velvet",
    order: 2,
    isActive: true,
  },
  {
    id: "slide-4",
    image: "/images/hero/fila_sovereign_multistripe_sanyan_gobi.jpg",
    badge: "Ancestral Sányán",
    title: "Sovereign Multi-Stripe Sányán Silk",
    subtitle: "Rare Raw Wild Silk Weave for High Chieftaincy",
    price: "₦58,000",
    link: "/products/sovereign-multi-stripe-sanyan-gobi-fila",
    tag: "Ancestral Prestige",
    order: 3,
    isActive: true,
  },
];

