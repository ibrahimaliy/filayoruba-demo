import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error("❌ [INDEX ERROR]: DATABASE_URL or DIRECT_URL environment variable is required.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

const indexes = [
  `CREATE INDEX IF NOT EXISTS "idx_products_archived_created" ON "products"("isArchived", "createdAt" DESC);`,
  `CREATE INDEX IF NOT EXISTS "idx_products_featured_archived" ON "products"("featured", "isArchived");`,
  `CREATE INDEX IF NOT EXISTS "idx_products_collection_archived" ON "products"("collectionId", "isArchived");`,
  `CREATE INDEX IF NOT EXISTS "idx_reviews_product_created" ON "reviews"("productId", "createdAt" DESC);`,
  `CREATE INDEX IF NOT EXISTS "idx_customers_created" ON "customers"("createdAt" DESC);`,
  `CREATE INDEX IF NOT EXISTS "idx_addresses_customer" ON "addresses"("customerId");`,
  `CREATE INDEX IF NOT EXISTS "idx_orders_archived_created" ON "orders"("isArchived", "createdAt" DESC);`,
  `CREATE INDEX IF NOT EXISTS "idx_orders_status_created" ON "orders"("status", "createdAt" DESC);`,
  `CREATE INDEX IF NOT EXISTS "idx_orders_customer" ON "orders"("customerId");`,
  `CREATE INDEX IF NOT EXISTS "idx_orders_customer_email" ON "orders"("customerEmail");`,
  `CREATE INDEX IF NOT EXISTS "idx_order_items_order" ON "order_items"("orderId");`,
  `CREATE INDEX IF NOT EXISTS "idx_order_items_product" ON "order_items"("productId");`,
  `CREATE INDEX IF NOT EXISTS "idx_payment_tx_order" ON "payment_transactions"("orderId");`,
  `CREATE INDEX IF NOT EXISTS "idx_audit_logs_created" ON "audit_logs"("createdAt" DESC);`,
  `CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity" ON "audit_logs"("entity", "entityId");`,
  `CREATE INDEX IF NOT EXISTS "idx_hero_slides_active_order" ON "hero_slides"("isActive", "order" ASC);`,
];

async function run() {
  console.log("Applying non-destructive performance indexes to PostgreSQL database...");
  const client = await pool.connect();
  try {
    for (const sql of indexes) {
      console.log(`Executing: ${sql}`);
      await client.query(sql);
    }
    console.log("✅ All performance indexes created successfully!");
  } catch (err) {
    console.error("Index creation error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
