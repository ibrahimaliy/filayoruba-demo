import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

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

const MASTER_COLLECTIONS = [
  {
    id: "col_aso_oke",
    slug: "aso-oke",
    name: "Handwoven Aso-Oke",
    description: "Centuries of Yoruba loom-weaving heritage featuring raw Sanyan silk, Alaari, and hand-spun fringe detailing.",
    image: "/uploads/products/fila_emerald_silver_gobi.png",
  },
  {
    id: "col_royal_ceremonial",
    slug: "royal-ceremonial",
    name: "Royal & Ceremonial",
    description: "Opulent headwear woven with metallic gold pinstripes and rich coronation palettes for milestone celebrations.",
    image: "/uploads/products/fila_alaari_crimson_gold_gobi.png",
  },
  {
    id: "col_luxury_velvet",
    slug: "luxury-velvet",
    name: "Embroidered Velvet",
    description: "Heavyweight plush velvet crowned with hand-embroidered multi-color celestial stars and tribal motifs.",
    image: "/uploads/products/fila_royal_maroon_velvet_embroidered.png",
  },
  {
    id: "col_contemporary",
    slug: "contemporary",
    name: "Modern Contemporary",
    description: "Minimalist, sleek, and high-contrast designs tailored for modern Kaftans and urban gentlemen.",
    image: "/uploads/products/fila_onyx_midnight_pinstripe_gobi.jpg",
  },
];

const PRODUCT_MAPPINGS = [
  // 1. Handwoven Aso-Oke
  { slug: "emerald-silver-handwoven-gobi-fila", collectionSlug: "aso-oke" },
  { slug: "forest-emerald-sanyan-bronze-gobi-fila", collectionSlug: "aso-oke" },
  { slug: "ochre-sanyan-earth-tone-gobi-fila", collectionSlug: "aso-oke" },
  { slug: "sovereign-multi-stripe-sanyan-alaari-fila", collectionSlug: "aso-oke" },

  // 2. Royal & Ceremonial
  { slug: "royal-indigo-wheat-gold-gobi-fila", collectionSlug: "royal-ceremonial" },
  { slug: "imperial-purple-crimson-gold-gobi-fila", collectionSlug: "royal-ceremonial" },
  { slug: "alaari-crimson-metallic-gold-pinstripe-fila", collectionSlug: "royal-ceremonial" },

  // 3. Embroidered Velvet
  { slug: "royal-maroon-embroidered-velvet-fila", collectionSlug: "luxury-velvet" },
  { slug: "cobalt-royal-blue-embroidered-velvet-fila", collectionSlug: "luxury-velvet" },
  { slug: "emerald-forest-embroidered-velvet-fila", collectionSlug: "luxury-velvet" },

  // 4. Modern Contemporary
  { slug: "onyx-midnight-dual-pinstripe-fila", collectionSlug: "contemporary" },
];

async function reorganize() {
  const client = await pool.connect();
  try {
    console.log("1. Upserting the 4 Master Collections...");
    for (const col of MASTER_COLLECTIONS) {
      await client.query(
        `INSERT INTO "collections" ("id", "slug", "name", "description", "image", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT ("slug") DO UPDATE 
         SET "name" = EXCLUDED."name",
             "description" = EXCLUDED."description",
             "image" = EXCLUDED."image",
             "updatedAt" = NOW()`,
        [col.id, col.slug, col.name, col.description, col.image]
      );
      console.log(`✓ Collection ready: ${col.name} (${col.slug})`);
    }

    console.log("2. Mapping all 11 products to their respective collection...");
    for (const mapping of PRODUCT_MAPPINGS) {
      const colRes = await client.query(`SELECT "id" FROM "collections" WHERE "slug" = $1`, [mapping.collectionSlug]);
      const collectionId = colRes.rows[0]?.id;

      if (collectionId) {
        await client.query(
          `UPDATE "products" SET "collectionId" = $1, "updatedAt" = NOW() WHERE "slug" = $2`,
          [collectionId, mapping.slug]
        );
        console.log(`✓ Product '${mapping.slug}' linked to collection '${mapping.collectionSlug}'`);
      }
    }

    // Remove any orphaned old collections that have 0 products
    console.log("3. Cleaning up old empty collections...");
    await client.query(`
      DELETE FROM "collections" 
      WHERE "id" NOT IN (SELECT DISTINCT "collectionId" FROM "products" WHERE "collectionId" IS NOT NULL)
      AND "slug" NOT IN ('aso-oke', 'royal-ceremonial', 'luxury-velvet', 'contemporary')
    `);

    console.log("🎉 Successfully reorganized all products into 4 Master Collections!");
  } finally {
    client.release();
    await pool.end();
  }
}

reorganize().catch(console.error);
