/**
 * Moments of Elegance Showcase Configuration
 * -------------------------------------------
 * Editorial photo shoot images, celebration moments, and dignitary portraits.
 */

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  title: string;
  location: string;
  category: string;
  collectionSlug: string;
  collectionName: string;
  description?: string;
  capLink?: string;
  price?: string;
  occasion?: string;
  etiquetteTip?: string;
}

export const galleryImages: GalleryItem[] = [
  {
    id: "elegance-1",
    src: "/images/elegance/5.jpg",
    alt: "Timeless Confidence - Cobalt Blue Embroidered Velvet Fila",
    title: "Timeless Confidence",
    location: "Lagos, Nigeria",
    category: "Embroidered Velvet",
    collectionSlug: "luxury-velvet",
    collectionName: "Embroidered Royal Velvet",
    description: "Deep cobalt royal velvet handcrafted with starry embroidery, worn for distinguished gentleman affairs.",
    capLink: "/products/cobalt-blue-embroidered-velvet-fila",
    price: "₦40,000",
    occasion: "Gentlemen Galas & VIP Receptions",
    etiquetteTip: "Fold to the right for vigor and youthful prominence, or to the left for elders and titled chiefs.",
  },
  {
    id: "elegance-2",
    src: "/images/elegance/6.jpg",
    alt: "Bold & Regal - Royal Black Agbada & Gold Pinstripe Gobi",
    title: "Bold & Regal",
    location: "Lagos, Nigeria",
    category: "Royal & Ceremonial",
    collectionSlug: "royal-gobi",
    collectionName: "Royal Gòbì",
    description: "A sovereign statement of luxury—black structured Agbada paired with royal coral beads and a gold pinstripe Fila.",
    capLink: "/products/onyx-midnight-dual-pinstripe-gobi-fila",
    price: "₦45,000",
    occasion: "Luxury Yoruba Weddings & Coronations",
    etiquetteTip: "Maintain sharp crease definition along the crown axis for stately sovereign posture.",
  },
  {
    id: "elegance-3",
    src: "/images/elegance/2.jpg",
    alt: "Classic Heritage - Sanyan & Senator Headwear",
    title: "Classic Heritage",
    location: "Ibadan, Oyo State",
    category: "Ancestral Sanyan",
    collectionSlug: "aso-oke",
    collectionName: "Vintage Aṣọ Òkè",
    description: "Ancestral narrow-loom wild silk Sányán weave honoring generational craftsmanship in Oyo.",
    capLink: "/products/sovereign-multi-stripe-sanyan-gobi-fila",
    price: "₦50,000",
    occasion: "Traditional Rites & Milestone Anniversaries",
    etiquetteTip: "Crafted from raw cocoon wild silk that deepens in character and luster across decades.",
  },
  {
    id: "elegance-4",
    src: "/images/elegance/7.jpg",
    alt: "Simplicity Elevated - Monochrome Kaftan & Low-Profile Fila",
    title: "Simplicity Elevated",
    location: "Port Harcourt, Rivers State",
    category: "Modern Contemporary",
    collectionSlug: "ijebu-senator",
    collectionName: "Fìlà Ìjẹ̀bú & Sénítọ̀",
    description: "Clean minimalist lines crafted for bespoke Kaftans, executive meetings, and contemporary dignitary style.",
    capLink: "/products/onyx-midnight-dual-pinstripe-gobi-fila",
    price: "₦35,000",
    occasion: "Executive Kaftan & Black-Tie Gatherings",
    etiquetteTip: "Structured low-profile crown tailored specifically for contemporary Senator collars.",
  },
  {
    id: "elegance-5",
    src: "/images/elegance/8.jpg",
    alt: "Royal Occasions - Olu of Igbo-Ora Palace Coronation",
    title: "Royal Occasions",
    location: "Kano, Nigeria",
    category: "Royal & Ceremonial",
    collectionSlug: "royal-gobi",
    collectionName: "Royal Gòbì",
    description: "Palace coronation and royal court grandeur featuring ancestral gold and crimson Aso-Oke weaves.",
    capLink: "/products/alaari-crimson-metallic-gold-pinstripe-fila",
    price: "₦45,000",
    occasion: "Royal Coronations & Chieftaincy Rites",
    etiquetteTip: "The definitive royal fold—worn exclusively with regal agbada and ancestral horsetail fly-whisk.",
  },
  {
    id: "elegance-6",
    src: "/images/elegance/4.jpg",
    alt: "Culture in Style - Equestrian Heritage Fila",
    title: "Culture in Style",
    location: "Abuja, FCT",
    category: "Handwoven Aso-Oke",
    collectionSlug: "aso-oke",
    collectionName: "Vintage Aṣọ Òkè",
    description: "Equestrian tradition meets Nigerian artisanal heritage with handwoven gold pinstripe headwear.",
    capLink: "/products/emerald-silver-handwoven-gobi-fila",
    price: "₦38,000",
    occasion: "Durbar & Cultural Exhibitions",
    etiquetteTip: "Pair with hand-loomed striped trousers and dark sunglasses for high-fashion equestrian flair.",
  },
  {
    id: "elegance-7",
    src: "/images/elegance/3.jpg",
    alt: "Everyday Elegance - Blue Tunic & Multi-Tone Fila",
    title: "Everyday Elegance",
    location: "Ilorin, Kwara State",
    category: "Modern Contemporary",
    collectionSlug: "aso-oke",
    collectionName: "Vintage Aṣọ Òkè",
    description: "Casual sovereign styling showcasing colorful narrow-loom strips for daily panache.",
    capLink: "/products/sovereign-multi-stripe-sanyan-gobi-fila",
    price: "₦38,000",
    occasion: "Weekend Gatherings & Cultural Brunches",
    etiquetteTip: "Wear with an easy casual attitude—the colorful weaves speak for themselves.",
  },
  {
    id: "elegance-8",
    src: "/images/elegance/1.jpg",
    alt: "Artisan Flair - Handcrafted Streetwear & Narrow-Loom Fila",
    title: "Artisan Flair",
    location: "Lagos, Nigeria",
    category: "Handwoven Aso-Oke",
    collectionSlug: "aso-oke",
    collectionName: "Vintage Aṣọ Òkè",
    description: "Bold contemporary streetwear seamlessly integrated with century-old Oyo hand-loomed headwear.",
    capLink: "/products/emerald-silver-handwoven-gobi-fila",
    price: "₦38,000",
    occasion: "High-Fashion Galas & Creative Showcases",
    etiquetteTip: "Celebrates the youthful renaissance of Yoruba textiles in global luxury fashion.",
  },
];
