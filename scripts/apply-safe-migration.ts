import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error("❌ [MIGRATION ERROR]: DATABASE_URL or DIRECT_URL environment variable is required.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function runSafeMigration() {
  const client = await pool.connect();
  console.log("🛡️ [MIGRATION] Connected to PostgreSQL. Applying non-destructive DDL...");

  try {
    // 1. Enums
    console.log("1️⃣ Creating/Updating PostgreSQL ENUMs...");
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SalesChannel') THEN
          CREATE TYPE "SalesChannel" AS ENUM ('ONLINE_STORE', 'WHATSAPP', 'INSTAGRAM', 'X', 'WALK_IN');
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'UNPAID';
        ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PAID';
        ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_PAID';
        ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethod') THEN
          CREATE TYPE "PaymentMethod" AS ENUM ('PAYSTACK', 'BANK_TRANSFER', 'CASH', 'POS');
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentProvider') THEN
          CREATE TYPE "PaymentProvider" AS ENUM ('PAYSTACK', 'INTERNAL');
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FulfillmentType') THEN
          CREATE TYPE "FulfillmentType" AS ENUM ('DELIVERY', 'PICKUP');
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReservationStatus') THEN
          CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'EXPIRED', 'RELEASED');
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockMovementType') THEN
          CREATE TYPE "StockMovementType" AS ENUM ('SALE', 'RESTOCK', 'CANCELLATION', 'RETURN', 'ADJUSTMENT');
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RefundStatus') THEN
          CREATE TYPE "RefundStatus" AS ENUM ('NOT_REFUNDED', 'PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED');
        END IF;
      END $$;
    `);

    // 2. Products table
    console.log("2️⃣ Migrating products table to Decimal and adding non-negative check...");
    await client.query(`
      ALTER TABLE "products" 
        ALTER COLUMN "price" TYPE DECIMAL(12, 2) USING price::numeric(12, 2);

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_stock_non_negative') THEN
          ALTER TABLE "products" ADD CONSTRAINT "products_stock_non_negative" CHECK (stock >= 0);
        END IF;
      END $$;
    `);

    // 3. Customers table
    console.log("3️⃣ Migrating customers table...");
    await client.query(`
      ALTER TABLE "customers" 
        ALTER COLUMN "email" DROP NOT NULL,
        ADD COLUMN IF NOT EXISTS "instagramHandle" TEXT,
        ADD COLUMN IF NOT EXISTS "xHandle" TEXT;
      CREATE INDEX IF NOT EXISTS "customers_phone_idx" ON "customers"("phone");
    `);

    // 4. Orders table
    console.log("4️⃣ Migrating orders table (omnichannel fields & Decimal columns)...");
    await client.query(`
      ALTER TABLE "orders"
        ADD COLUMN IF NOT EXISTS "salesChannel" "SalesChannel" DEFAULT 'ONLINE_STORE',
        ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" DEFAULT 'UNPAID',
        ADD COLUMN IF NOT EXISTS "fulfillmentType" "FulfillmentType" DEFAULT 'DELIVERY',
        ADD COLUMN IF NOT EXISTS "refundStatus" "RefundStatus" DEFAULT 'NOT_REFUNDED',
        ADD COLUMN IF NOT EXISTS "discount" DECIMAL(12, 2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "amountPaid" DECIMAL(12, 2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "amountRefunded" DECIMAL(12, 2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "clientRequestId" TEXT,
        ADD COLUMN IF NOT EXISTS "createdById" TEXT,
        ADD COLUMN IF NOT EXISTS "internalNotes" TEXT,
        ALTER COLUMN "customerEmail" DROP NOT NULL,
        ALTER COLUMN "subtotal" TYPE DECIMAL(12, 2) USING subtotal::numeric(12, 2),
        ALTER COLUMN "shippingFee" TYPE DECIMAL(12, 2) USING "shippingFee"::numeric(12, 2),
        ALTER COLUMN "total" TYPE DECIMAL(12, 2) USING total::numeric(12, 2);

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_createdById_fkey') THEN
          ALTER TABLE "orders" 
            ADD CONSTRAINT "orders_createdById_fkey" 
            FOREIGN KEY ("createdById") REFERENCES "admin_users"("id") ON DELETE SET NULL;
        END IF;
      END $$;

      CREATE UNIQUE INDEX IF NOT EXISTS "orders_clientRequestId_key" ON "orders"("clientRequestId");
      CREATE INDEX IF NOT EXISTS "orders_salesChannel_createdAt_idx" ON "orders"("salesChannel", "createdAt");
      CREATE INDEX IF NOT EXISTS "orders_paymentStatus_status_idx" ON "orders"("paymentStatus", "status");
      CREATE INDEX IF NOT EXISTS "orders_paidAt_idx" ON "orders"("paidAt");
      CREATE INDEX IF NOT EXISTS "orders_customerPhone_idx" ON "orders"("customerPhone");
    `);

    // 5. Order Items
    console.log("5️⃣ Migrating order_items table to Decimal...");
    await client.query(`
      ALTER TABLE "order_items"
        ALTER COLUMN "unitPrice" TYPE DECIMAL(12, 2) USING "unitPrice"::numeric(12, 2),
        ALTER COLUMN "totalPrice" TYPE DECIMAL(12, 2) USING "totalPrice"::numeric(12, 2);
    `);

    // 6. Payment Transactions
    console.log("6️⃣ Migrating payment_transactions table...");
    await client.query(`
      ALTER TABLE "payment_transactions"
        ALTER COLUMN "amount" TYPE DECIMAL(12, 2) USING amount::numeric(12, 2),
        ALTER COLUMN "status" TYPE TEXT USING status::text;
    `);

    // 7. New Table: Payments
    console.log("7️⃣ Creating payments table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" TEXT PRIMARY KEY,
        "orderId" TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "amount" DECIMAL(12, 2) NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'NGN',
        "method" "PaymentMethod" NOT NULL,
        "provider" "PaymentProvider" NOT NULL DEFAULT 'INTERNAL',
        "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
        "reference" TEXT UNIQUE,
        "paidAt" TIMESTAMP(3),
        "verifiedBy" TEXT,
        "verifiedAt" TIMESTAMP(3),
        "notes" TEXT,
        "rawResponse" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "payments_orderId_idx" ON "payments"("orderId");
      CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
      CREATE INDEX IF NOT EXISTS "payments_reference_idx" ON "payments"("reference");
    `);

    // 8. New Table: Inventory Reservations
    console.log("8️⃣ Creating inventory_reservations table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "inventory_reservations" (
        "id" TEXT PRIMARY KEY,
        "productId" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "orderId" TEXT REFERENCES "orders"("id") ON DELETE SET NULL,
        "quantity" INTEGER NOT NULL,
        "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
        "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "reservedBy" TEXT,
        "reason" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "inventory_reservations_productId_status_idx" ON "inventory_reservations"("productId", "status");
      CREATE INDEX IF NOT EXISTS "inventory_reservations_expiresAt_status_idx" ON "inventory_reservations"("expiresAt", "status");
      CREATE INDEX IF NOT EXISTS "inventory_reservations_orderId_idx" ON "inventory_reservations"("orderId");
    `);

    // 9. New Table: Stock Movements
    console.log("9️⃣ Creating stock_movements table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "stock_movements" (
        "id" TEXT PRIMARY KEY,
        "productId" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "orderId" TEXT REFERENCES "orders"("id") ON DELETE SET NULL,
        "quantity" INTEGER NOT NULL,
        "type" "StockMovementType" NOT NULL,
        "previousStock" INTEGER NOT NULL,
        "newStock" INTEGER NOT NULL,
        "reference" TEXT,
        "reason" TEXT,
        "createdBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "stock_movements_productId_createdAt_idx" ON "stock_movements"("productId", "createdAt");
      CREATE INDEX IF NOT EXISTS "stock_movements_type_idx" ON "stock_movements"("type");
      CREATE INDEX IF NOT EXISTS "stock_movements_orderId_idx" ON "stock_movements"("orderId");
    `);

    console.log("✅ [MIGRATION SUCCESS] All DDL statements executed without any data loss!");
  } catch (error) {
    console.error("❌ [MIGRATION ERROR]:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runSafeMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
