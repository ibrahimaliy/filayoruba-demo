import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/filayoruba?sslmode=disable";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const collections = [
  {
    name: "Aso-Oke Collection",
    slug: "aso-oke",
    description: "Premium handcrafted Yoruba Aso-Oke Fila caps woven with ceremonial precision.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Embroidered Collection",
    slug: "embroidered",
    description: "Intricately hand-stitched embroidered Fila caps designed for high-society banquets and royal events.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Traditional Classic Collection",
    slug: "classic",
    description: "Timeless traditional Yoruba Fila designs capturing the heritage of Nigerian craftsmanship.",
    image: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80",
  },
];

const products = [
  {
    slug: "silver-stripe-fila",
    name: "Silver Stripe Fila",
    collectionSlug: "aso-oke",
    price: 18000,
    images: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    ],
    description: "Handcrafted from hand-woven metallic Aso-Oke fabric featuring crisp silver striping. Perfect for weddings and chieftaincy celebrations.",
    colors: ["Silver", "White"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    featured: true,
    stock: 12,
    rating: 4.8,
    reviews: [
      {
        name: "Adewale O.",
        rating: 5,
        comment: "Excellent craftsmanship and a perfect fit for my wedding ceremony.",
        date: "2026-05-18",
      },
    ],
  },
  {
    slug: "royal-blue-fila",
    name: "Royal Blue Fila",
    collectionSlug: "aso-oke",
    price: 18000,
    images: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
    ],
    description: "Rich royal blue Aso-Oke cap with subtle sheen and reinforced structure for sharp, enduring folds in Gobi or Abeti Aja styles.",
    colors: ["Royal Blue"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    featured: true,
    stock: 15,
    rating: 4.9,
    reviews: [
      {
        name: "Tunde A.",
        rating: 5,
        comment: "The colour is rich and the finish feels truly premium.",
        date: "2026-06-02",
      },
    ],
  },
  {
    slug: "burgundy-prestige-fila",
    name: "Burgundy Prestige Fila",
    collectionSlug: "aso-oke",
    price: 20000,
    images: [
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80",
    ],
    description: "Deep burgundy luxury cap woven by master artisans in Oyo. Features high thread density and breathable cotton backing.",
    colors: ["Burgundy", "Wine"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    featured: true,
    stock: 10,
    rating: 4.9,
    reviews: [
      {
        name: "Chinedu E.",
        rating: 5,
        comment: "Beautifully made, comfortable, and exactly as pictured.",
        date: "2026-04-27",
      },
    ],
  },
  {
    slug: "royal-blue-embroidered-fila",
    name: "Royal Blue Embroidered Fila",
    collectionSlug: "embroidered",
    price: 20000,
    images: [
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80",
    ],
    description: "Hand-embroidered with intricate golden motifs across crown and rim. A majestic statement piece for any traditional ensemble.",
    colors: ["Royal Blue", "Gold"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    featured: true,
    stock: 8,
    rating: 4.8,
    reviews: [
      {
        name: "Kunle B.",
        rating: 5,
        comment: "The embroidery is detailed and makes the outfit stand out.",
        date: "2026-06-21",
      },
    ],
  },
  {
    slug: "black-heritage-fila",
    name: "Black Heritage Fila",
    collectionSlug: "classic",
    price: 17000,
    images: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    ],
    description: "A classic black ceremonial Fila offering understated elegance, versatile matching with Agbada or Kaftan, and lasting resilience.",
    colors: ["Black"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    featured: true,
    stock: 20,
    rating: 4.7,
    reviews: [
      {
        name: "Femi D.",
        rating: 5,
        comment: "A timeless piece with an excellent, secure fit.",
        date: "2026-05-09",
      },
    ],
  },
  {
    slug: "teal-embroidered-fila",
    name: "Teal Embroidered Fila",
    collectionSlug: "embroidered",
    price: 20000,
    images: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
    ],
    description: "Lustrous teal fabric embellished with silver thread embroidery. Hand-tailored to maintain firm silhouette throughout long events.",
    colors: ["Teal", "Silver"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    featured: true,
    stock: 9,
    rating: 4.9,
    reviews: [
      {
        name: "Seyi A.",
        rating: 5,
        comment: "The teal shade is even better in person. I love it.",
        date: "2026-07-03",
      },
    ],
  },
];

const heroSlides = [
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

async function main() {
  console.log("🌱 Starting Fìlà Yorùbá database seeding...");

  const collectionMap = new Map<string, string>();

  // 1. Upsert collections
  for (const c of collections) {
    const record = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        description: c.description,
        image: c.image,
      },
      create: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
      },
    });
    collectionMap.set(c.slug, record.id);
    console.log(`✓ Collection: ${c.name}`);
  }

  // 2. Upsert products
  for (const p of products) {
    const collectionId = collectionMap.get(p.collectionSlug);

    const productRecord = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        price: p.price,
        images: p.images,
        description: p.description,
        colors: p.colors,
        sizes: p.sizes,
        featured: p.featured,
        stock: p.stock,
        rating: p.rating,
        collectionId: collectionId || null,
      },
      create: {
        slug: p.slug,
        name: p.name,
        price: p.price,
        images: p.images,
        description: p.description,
        colors: p.colors,
        sizes: p.sizes,
        featured: p.featured,
        stock: p.stock,
        rating: p.rating,
        collectionId: collectionId || null,
      },
    });

    // Upsert reviews
    for (const r of p.reviews) {
      await prisma.review.create({
        data: {
          productId: productRecord.id,
          name: r.name,
          rating: r.rating,
          comment: r.comment,
          date: r.date,
        },
      });
    }

    console.log(`✓ Product: ${p.name}`);
  }

  // 3. Upsert hero slides
  for (const slide of heroSlides) {
    await prisma.heroSlide.upsert({
      where: { id: slide.id },
      update: {
        title: slide.title,
        subtitle: slide.subtitle,
        badge: slide.badge,
        tag: slide.tag,
        price: slide.price,
        link: slide.link,
        image: slide.image,
        order: slide.order,
        isActive: slide.isActive,
      },
      create: {
        id: slide.id,
        title: slide.title,
        subtitle: slide.subtitle,
        badge: slide.badge,
        tag: slide.tag,
        price: slide.price,
        link: slide.link,
        image: slide.image,
        order: slide.order,
        isActive: slide.isActive,
      },
    });
    console.log(`✓ Hero Slide: ${slide.title}`);
  }

  console.log("✨ Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

