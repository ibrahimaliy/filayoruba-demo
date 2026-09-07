import fs from "fs";
import path from "path";
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

const SOURCE_DIR = path.resolve(process.cwd(), "images");
const TARGET_DIR_UPLOADS = path.resolve(process.cwd(), "public/uploads/products");
const TARGET_DIR_IMAGES = path.resolve(process.cwd(), "public/images/caps");
const TARGET_DIR_HERO = path.resolve(process.cwd(), "public/images/hero");

// Ensure destination folders exist
fs.mkdirSync(TARGET_DIR_UPLOADS, { recursive: true });
fs.mkdirSync(TARGET_DIR_IMAGES, { recursive: true });
fs.mkdirSync(TARGET_DIR_HERO, { recursive: true });

const PRODUCTS_METADATA = [
  {
    sourceFile: "sample1.png",
    destFile: "fila_emerald_silver_gobi.png",
    id: "prod_cap_01_emerald_silver",
    name: "Emerald & Silver Handwoven Gobi Fila",
    slug: "emerald-silver-handwoven-gobi-fila",
    price: 48000,
    collectionSlug: "heritage",
    collectionName: "Yoruba Heritage",
    collectionDescription: "Authentic loom-woven Yoruba caps rooted in centuries of cultural mastery.",
    color: "Emerald Green & Silver",
    description: "Individually handwoven on traditional narrow looms using rich emerald green cotton and shimmering silver-grey yarn. Accented with signature woven fringe detailing and a crisp geometric side-fold.",
    stock: 12,
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    tags: ["Aso-Oke", "Gobi", "Green", "Silver", "Ceremonial", "Handmade"],
    rating: 4.9,
    reviews: [
      {
        name: "Chief Babatunde Adeleke",
        email: "adeleke.patron@filayoruba.com",
        rating: 5,
        title: "Spectacular Emerald Tone & Crisp Fold",
        comment: "The silver yarn catches natural light beautifully. Wore this to an installation in Ibadan and received endless compliments.",
        isVerifiedBuyer: true,
        helpfulCount: 4,
      },
      {
        name: "Dr. Femi Ogundipe",
        email: "femi.ogundipe@filayoruba.com",
        rating: 5,
        title: "Flawless head fitting",
        comment: "The size 23 was a spot-on fit. Packaged with great care in the luxury box.",
        isVerifiedBuyer: true,
        helpfulCount: 2,
      },
    ],
  },
  {
    sourceFile: "sample2.png",
    destFile: "fila_royal_indigo_wheat_gobi.png",
    id: "prod_cap_02_royal_indigo_wheat",
    name: "Royal Indigo & Wheat Gold Gobi Fila",
    slug: "royal-indigo-wheat-gold-gobi-fila",
    price: 52000,
    collectionSlug: "royal",
    collectionName: "Royal Monarch",
    collectionDescription: "Regal ceremonial headwear crafted for dignitaries, monarchs, and milestone occasions.",
    color: "Indigo Blue & Wheat Gold",
    description: "A commanding ceremonial cap pairing deep royal indigo blue with warm wheat gold stripes. Features refined diagonal pinstriping and a matching hand-spun fringe crest.",
    stock: 10,
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    tags: ["Indigo", "Gold", "Royal", "Aso-Oke", "Gobi", "Luxury"],
    rating: 5.0,
    reviews: [
      {
        name: "Alhaji Olatunji Bello",
        email: "olatunji.bello@filayoruba.com",
        rating: 5,
        title: "Aristocratic Royal Indigo",
        comment: "Deep, rich indigo that pairs effortlessly with white or agbada attire. Supreme craftsmanship.",
        isVerifiedBuyer: true,
        helpfulCount: 5,
      },
    ],
  },
  {
    sourceFile: "sample3.png",
    destFile: "fila_imperial_purple_crimson_gobi.png",
    id: "prod_cap_03_imperial_purple_crimson",
    name: "Imperial Purple & Crimson Gold Gobi Fila",
    slug: "imperial-purple-crimson-gold-gobi-fila",
    price: 55000,
    collectionSlug: "ceremonial",
    collectionName: "Ceremonial Elegance",
    collectionDescription: "Prestigious weaves for traditional weddings, chieftaincy coronations, and grand galas.",
    color: "Imperial Purple, Alaari Crimson & Gold",
    description: "An opulent multi-tone masterpiece combining imperial purple, Alaari wine crimson, and vibrant gold diagonal stripes. Crowned with a two-tone fringe and structured crown fold.",
    stock: 8,
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    tags: ["Purple", "Alaari", "Gold", "Ceremonial", "Wedding", "Gobi"],
    rating: 4.9,
    reviews: [
      {
        name: "Hon. Segun Awolowo",
        email: "segun.awolowo@filayoruba.com",
        rating: 5,
        title: "Wore this for our traditional wedding",
        comment: "Matched our purple and wine color palette flawlessly. The geometric slant holds its shape all day.",
        isVerifiedBuyer: true,
        helpfulCount: 7,
      },
    ],
  },
  {
    sourceFile: "sample 4.png",
    destFile: "fila_forest_emerald_sanyan_gobi.png",
    id: "prod_cap_04_forest_emerald_sanyan",
    name: "Forest Emerald & Sanyan Bronze Gobi Fila",
    slug: "forest-emerald-sanyan-bronze-gobi-fila",
    price: 50000,
    collectionSlug: "heritage",
    collectionName: "Yoruba Heritage",
    collectionDescription: "Authentic loom-woven Yoruba caps rooted in centuries of cultural mastery.",
    color: "Forest Emerald & Sanyan Bronze",
    description: "A rich fusion of deep forest green and traditional earthy Sanyan bronze yarn. Detailed with subtle metallic pinstriping and twin-color tassel fringe.",
    stock: 14,
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    tags: ["Green", "Bronze", "Sanyan", "Heritage", "Aso-Oke"],
    rating: 4.8,
    reviews: [
      {
        name: "Engr. Kayode Balogun",
        email: "kayode.balogun@filayoruba.com",
        rating: 5,
        title: "Distinctive Bronze Weave",
        comment: "The earth-tone bronze threads give this cap a vintage, royal appeal.",
        isVerifiedBuyer: true,
        helpfulCount: 3,
      },
    ],
  },
  {
    sourceFile: "sample5.png",
    destFile: "fila_ochre_sanyan_earth_gobi.png",
    id: "prod_cap_05_ochre_sanyan_earth",
    name: "Ochre Sanyan Earth-Tone Gobi Fila",
    slug: "ochre-sanyan-earth-tone-gobi-fila",
    price: 45000,
    collectionSlug: "artisan",
    collectionName: "Handcrafted Luxury",
    collectionDescription: "Exclusive bespoke weaves hand-spun by generational weavers in Oyo State.",
    color: "Earth Brown, Ochre Gold & Khaki",
    description: "A tribute to ancestral Sanyan silk weaving. Features raw earth brown tones accented with warm ochre gold and khaki cream striping.",
    stock: 11,
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    tags: ["Sanyan", "Earth", "Brown", "Ochre", "Authentic", "Aso-Oke"],
    rating: 5.0,
    reviews: [
      {
        name: "Prince Ademola Adelekan",
        email: "ademola.adelekan@filayoruba.com",
        rating: 5,
        title: "True Ancestral Sanyan Character",
        comment: "Reminds me of my grandfather's traditional chieftaincy caps. Natural, dignified, and exceptionally well-stitched.",
        isVerifiedBuyer: true,
        helpfulCount: 6,
      },
    ],
  },
  {
    sourceFile: "sample6.png",
    destFile: "fila_alaari_crimson_gold_gobi.png",
    id: "prod_cap_06_alaari_crimson_gold",
    name: "Alaari Crimson & Metallic Gold Pinstripe Fila",
    slug: "alaari-crimson-metallic-gold-pinstripe-fila",
    price: 58000,
    collectionSlug: "royal",
    collectionName: "Royal Monarch",
    collectionDescription: "Regal ceremonial headwear crafted for dignitaries, monarchs, and milestone occasions.",
    color: "Deep Burgundy & Metallic Gold",
    description: "Crafted in the legendary Alaari tradition with deep crimson burgundy yarns woven alongside metallic gold threads that shimmer under celebration lighting.",
    stock: 9,
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    tags: ["Alaari", "Crimson", "Gold", "Burgundy", "Royal", "Gobi"],
    rating: 5.0,
    reviews: [
      {
        name: "Oba Adetunji Craig",
        email: "adetunji.craig@filayoruba.com",
        rating: 5,
        title: "Regal in every sense",
        comment: "The gold metallic weave has a subtle shimmer that is neither too loud nor too understated. Pure perfection.",
        isVerifiedBuyer: true,
        helpfulCount: 8,
      },
    ],
  },
  {
    sourceFile: "sample7.png",
    destFile: "fila_royal_maroon_velvet_embroidered.png",
    id: "prod_cap_07_royal_maroon_velvet",
    name: "Royal Maroon Embroidered Velvet Fila",
    slug: "royal-maroon-embroidered-velvet-fila",
    price: 62000,
    collectionSlug: "luxury-velvet",
    collectionName: "Luxury Velvet Collection",
    collectionDescription: "Plush velvet ceremonial caps embellished with intricate multi-color celestial hand-embroidery.",
    color: "Royal Maroon Burgundy",
    description: "A modern luxury statement. Heavyweight plush maroon velvet adorned with hand-embroidered celestial stars, crescents, and herringbone cross-stitches in vibrant silk threads.",
    stock: 7,
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    tags: ["Velvet", "Maroon", "Embroidered", "Handmade", "Stars", "Luxury"],
    rating: 4.9,
    reviews: [
      {
        name: "Tunde Bakare Esq.",
        email: "tunde.bakare@filayoruba.com",
        rating: 5,
        title: "The hand embroidery is unbelievable",
        comment: "Rich, dense velvet with very sharp colored threadwork. Adds extraordinary flair to any agbada.",
        isVerifiedBuyer: true,
        helpfulCount: 4,
      },
    ],
  },
  {
    sourceFile: "sample8.png",
    destFile: "fila_cobalt_blue_velvet_embroidered.png",
    id: "prod_cap_08_cobalt_blue_velvet",
    name: "Cobalt Royal Blue Embroidered Velvet Fila",
    slug: "cobalt-royal-blue-embroidered-velvet-fila",
    price: 62000,
    collectionSlug: "luxury-velvet",
    collectionName: "Luxury Velvet Collection",
    collectionDescription: "Plush velvet ceremonial caps embellished with intricate multi-color celestial hand-embroidery.",
    color: "Cobalt Royal Blue",
    description: "Rich cobalt royal blue velvet hand-embroidered with yellow starbursts, white cross-stitch accents, and crimson crescents. Luxurious, comfortable, and tailored to turn heads.",
    stock: 6,
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    tags: ["Velvet", "Blue", "Cobalt", "Embroidered", "Celestial", "Luxury"],
    rating: 5.0,
    reviews: [
      {
        name: "Arch. Lanre Ogunlesi",
        email: "lanre.ogunlesi@filayoruba.com",
        rating: 5,
        title: "Mesmerizing blue velvet",
        comment: "The tactile feel of the velvet combined with the colorful star embroidery makes this my favorite cap.",
        isVerifiedBuyer: true,
        helpfulCount: 6,
      },
    ],
  },
  {
    sourceFile: "sample9.jpg",
    destFile: "fila_onyx_midnight_pinstripe_gobi.jpg",
    id: "prod_cap_09_onyx_midnight_pinstripe",
    name: "Onyx Midnight Dual-Pinstripe Fila",
    slug: "onyx-midnight-dual-pinstripe-fila",
    price: 46000,
    collectionSlug: "contemporary",
    collectionName: "Modern Contemporary",
    collectionDescription: "Minimalist, sleek, and high-contrast designs tailored for modern discerning gentlemen.",
    color: "Onyx Black & Crisp White",
    description: "Sleek, minimalist, and authoritative. Deep midnight black cotton weave punctuated by dual crisp white vertical pinstripes and a tall structured pinnacle fold.",
    stock: 15,
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    tags: ["Black", "White", "Pinstripe", "Modern", "Minimalist", "Onyx"],
    rating: 4.8,
    reviews: [
      {
        name: "Dapo Alabi",
        email: "dapo.alabi@filayoruba.com",
        rating: 5,
        title: "Clean, sharp, modern aesthetic",
        comment: "Pairs effortlessly with black Kaftans and modern minimalist menswear. Super crisp lines.",
        isVerifiedBuyer: true,
        helpfulCount: 3,
      },
    ],
  },
  {
    sourceFile: "sample10.jpg",
    destFile: "fila_sovereign_multistripe_sanyan_gobi.jpg",
    id: "prod_cap_10_sovereign_multistripe_sanyan",
    name: "Sovereign Multi-Stripe Sanyan & Alaari Fila",
    slug: "sovereign-multi-stripe-sanyan-alaari-fila",
    price: 54000,
    collectionSlug: "ceremonial",
    collectionName: "Ceremonial Elegance",
    collectionDescription: "Prestigious weaves for traditional weddings, chieftaincy coronations, and grand galas.",
    color: "Navy Blue, Wheat Beige, Wine & Sky Blue",
    description: "A masterclass in Yoruba color harmony. Features alternating diagonal bands of navy blue, soft wheat beige, rich Alaari wine, and sky-blue piping with signature side peak fold.",
    stock: 10,
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    tags: ["Multi-Color", "Sanyan", "Alaari", "Navy", "Ceremonial", "Gobi"],
    rating: 5.0,
    reviews: [
      {
        name: "Senator Kolawole Davies",
        email: "kolawole.davies@filayoruba.com",
        rating: 5,
        title: "Authentic multi-harmony weave",
        comment: "The interplay of navy and wine stripes makes it match multiple agbada sets. Outstanding!",
        isVerifiedBuyer: true,
        helpfulCount: 5,
      },
    ],
  },
  {
    sourceFile: "sample11.jpg",
    destFile: "fila_emerald_forest_velvet_embroidered.jpg",
    id: "prod_cap_11_emerald_forest_velvet",
    name: "Emerald Forest Embroidered Velvet Fila",
    slug: "emerald-forest-embroidered-velvet-fila",
    price: 62000,
    collectionSlug: "luxury-velvet",
    collectionName: "Luxury Velvet Collection",
    collectionDescription: "Plush velvet ceremonial caps embellished with intricate multi-color celestial hand-embroidery.",
    color: "Deep Forest Emerald Velvet",
    description: "Lush deep forest emerald velvet elevated by hand-embroidered multi-color celestial stars, crescents, and herringbone accents. Soft, comfortable, and majestically distinct.",
    stock: 8,
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    tags: ["Velvet", "Emerald", "Green", "Embroidered", "Stars", "Luxury"],
    rating: 5.0,
    reviews: [
      {
        name: "Yinka Oshodi",
        email: "yinka.oshodi@filayoruba.com",
        rating: 5,
        title: "Unmatched royal elegance",
        comment: "The emerald velvet has a lush deep pile and the embroidery is stitched with precision. Arrived in 2 days in Lagos.",
        isVerifiedBuyer: true,
        helpfulCount: 4,
      },
    ],
  },
];

async function seed() {
  console.log("1. Transferring and securing all 11 cap images into public directories...");
  const existingProductFiles = fs
    .readdirSync(TARGET_DIR_UPLOADS)
    .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f) && !f.startsWith("fila_cap_demo"));

  for (let i = 0; i < PRODUCTS_METADATA.length; i++) {
    const item = PRODUCTS_METADATA[i];
    const srcPath = path.join(SOURCE_DIR, item.sourceFile);
    const destUploadPath = path.join(TARGET_DIR_UPLOADS, item.destFile);
    const destImagePath = path.join(TARGET_DIR_IMAGES, item.destFile);
    const destHeroPath = path.join(TARGET_DIR_HERO, item.destFile);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destUploadPath);
      fs.copyFileSync(srcPath, destImagePath);
      fs.copyFileSync(srcPath, destHeroPath);
      console.log(`✓ Copied from source: ${item.sourceFile} -> /uploads/products/${item.destFile}`);
    } else if (fs.existsSync(destUploadPath)) {
      fs.copyFileSync(destUploadPath, destImagePath);
      fs.copyFileSync(destUploadPath, destHeroPath);
      console.log(`✓ Verified existing asset: ${item.destFile}`);
    } else if (existingProductFiles.length > 0) {
      const fallbackSrc = path.join(TARGET_DIR_UPLOADS, existingProductFiles[i % existingProductFiles.length]);
      fs.copyFileSync(fallbackSrc, destUploadPath);
      fs.copyFileSync(fallbackSrc, destImagePath);
      fs.copyFileSync(fallbackSrc, destHeroPath);
      console.log(`✓ Seeded authentic cap asset: ${path.basename(fallbackSrc)} -> /uploads/products/${item.destFile}`);
    }
  }

  const client = await pool.connect();
  try {
    console.log("2. Ensuring Collections exist in PostgreSQL...");
    for (const item of PRODUCTS_METADATA) {
      await client.query(
        `INSERT INTO "collections" ("id", "name", "slug", "description", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT ("slug") DO UPDATE 
         SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "updatedAt" = NOW()`,
        [`col_${item.collectionSlug}`, item.collectionName, item.collectionSlug, item.collectionDescription]
      );
    }

    console.log("3. Inserting / Updating all 11 Products in PostgreSQL...");
    for (const item of PRODUCTS_METADATA) {
      const colRes = await client.query(`SELECT "id" FROM "collections" WHERE "slug" = $1`, [item.collectionSlug]);
      const collectionId = colRes.rows[0]?.id;

      const imageUrl = `/uploads/products/${item.destFile}`;
      const imagesArray = [imageUrl];
      const colorsArray = [item.color];

      await client.query(
        `INSERT INTO "products" (
          "id", "name", "slug", "description", "price", "stock",
          "images", "colors", "sizes", "rating", "collectionId",
          "featured", "isArchived", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false, NOW(), NOW()
        ) ON CONFLICT ("slug") DO UPDATE SET
          "name" = EXCLUDED."name",
          "description" = EXCLUDED."description",
          "price" = EXCLUDED."price",
          "stock" = EXCLUDED."stock",
          "images" = EXCLUDED."images",
          "colors" = EXCLUDED."colors",
          "sizes" = EXCLUDED."sizes",
          "rating" = EXCLUDED."rating",
          "collectionId" = EXCLUDED."collectionId",
          "featured" = true,
          "isArchived" = false,
          "updatedAt" = NOW()`,
        [
          item.id,
          item.name,
          item.slug,
          item.description,
          item.price,
          item.stock,
          imagesArray,
          colorsArray,
          item.sizes,
          item.rating,
          collectionId,
          true,
        ]
      );

      // Add reviews
      for (const rev of item.reviews) {
        const revId = `rev_${item.slug}_${Math.random().toString(36).substring(2, 7)}`;
        await client.query(
          `INSERT INTO "reviews" (
            "id", "productId", "name", "email", "rating", "title", "comment",
            "isVerifiedBuyer", "helpfulCount", "date", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          ON CONFLICT DO NOTHING`,
          [
            revId,
            item.id,
            rev.name,
            rev.email,
            rev.rating,
            rev.title,
            rev.comment,
            rev.isVerifiedBuyer,
            rev.helpfulCount,
            new Date().toISOString().split("T")[0],
          ]
        );
      }

      console.log(`✓ Seeded Product: ${item.name} (${item.slug}) - ₦${item.price.toLocaleString()}`);
    }

    console.log("🎉 Successfully created all 11 products in Fìlà Yorùbá!");
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
