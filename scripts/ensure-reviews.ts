import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  try {
    console.log("Checking and ensuring reviews table schema in PostgreSQL...");
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "reviews" (
        "id" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT,
        "rating" INTEGER NOT NULL DEFAULT 5,
        "title" TEXT,
        "comment" TEXT NOT NULL,
        "isVerifiedBuyer" BOOLEAN NOT NULL DEFAULT false,
        "helpfulCount" INTEGER NOT NULL DEFAULT 0,
        "date" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await db.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "email" TEXT;`);
    await db.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "title" TEXT;`);
    await db.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "isVerifiedBuyer" BOOLEAN NOT NULL DEFAULT false;`);
    await db.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "helpfulCount" INTEGER NOT NULL DEFAULT 0;`);
    await db.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`);

    console.log("✅ Reviews table columns verified and ensured successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await db.$disconnect();
    await pool.end();
  }
}

main();

