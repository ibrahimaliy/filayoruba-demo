import "dotenv/config";
import pg from "pg";

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/filayoruba?sslmode=disable";

const pool = new pg.Pool({
  connectionString,
  ...(connectionString.includes("neon.tech") || connectionString.includes("sslmode=require")
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
});

async function main() {
  const slides = [
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

  for (const s of slides) {
    await pool.query(
      `INSERT INTO "hero_slides" ("id", "title", "subtitle", "badge", "tag", "price", "link", "image", "order", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       ON CONFLICT ("id") DO UPDATE 
       SET "title" = EXCLUDED."title", "image" = EXCLUDED."image"`,
      [s.id, s.title, s.subtitle, s.badge, s.tag, s.price, s.link, s.image, s.order, s.isActive]
    );
  }
  console.log("✓ Successfully seeded 4 Hero Slides!");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
