import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  console.error("❌ [MIGRATION ERROR]: DATABASE_URL or DIRECT_URL environment variable is required.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrateOmnichannelData() {
  console.log("🚀 [MIGRATION] Starting Omnichannel V2 Data Backfill...");

  const orders = await prisma.order.findMany({
    include: {
      payments: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`📦 [MIGRATION] Found ${orders.length} orders to inspect/backfill.`);

  let updatedCount = 0;
  let paymentsCreatedCount = 0;

  for (const ord of orders) {
    const totalNum = Number(ord.total);

    // 1. Determine target OrderStatus and PaymentStatus
    let targetOrderStatus = ord.status;
    let targetPaymentStatus = ord.paymentStatus;
    let targetAmountPaid = Number(ord.amountPaid || 0);
    const targetPaidAt = ord.paidAt || (ord.status as string === "PAID" ? ord.updatedAt : null);

    const legacyStatusStr = String(ord.status);

    if (legacyStatusStr === "PAID") {
      targetOrderStatus = "CONFIRMED" as any;
      targetPaymentStatus = "PAID";
      targetAmountPaid = totalNum;
    } else if (["CRAFTING", "SHIPPED", "DELIVERED"].includes(legacyStatusStr)) {
      targetPaymentStatus = "PAID";
      targetAmountPaid = totalNum;
    } else if (legacyStatusStr === "FAILED") {
      targetOrderStatus = "PENDING";
      targetPaymentStatus = "FAILED";
      targetAmountPaid = 0;
    } else if (legacyStatusStr === "PENDING") {
      targetPaymentStatus = "PENDING";
      targetAmountPaid = 0;
    } else if (legacyStatusStr === "CANCELLED") {
      targetPaymentStatus = ord.stockDeducted ? "PAID" : "UNPAID";
      targetAmountPaid = ord.stockDeducted ? totalNum : 0;
    }

    // 2. Perform backfill update
    await prisma.order.update({
      where: { id: ord.id },
      data: {
        salesChannel: ord.salesChannel || "ONLINE_STORE",
        fulfillmentType: ord.fulfillmentType || "DELIVERY",
        refundStatus: ord.refundStatus || "NOT_REFUNDED",
        status: targetOrderStatus,
        paymentStatus: targetPaymentStatus,
        amountPaid: targetAmountPaid,
        paidAt: targetPaidAt,
      },
    });
    updatedCount++;

    // 3. Seed historical Payment record if order was paid and no Payment record exists yet
    if (targetPaymentStatus === "PAID" && ord.payments.length === 0) {
      const ref = ord.paymentReference || `legacy_paystack_${ord.id}`;
      await prisma.payment.upsert({
        where: { reference: ref },
        update: {
          status: "PAID",
          amount: totalNum,
          paidAt: targetPaidAt || new Date(),
        },
        create: {
          orderId: ord.id,
          amount: totalNum,
          currency: "NGN",
          method: "PAYSTACK",
          provider: "PAYSTACK",
          status: "PAID",
          reference: ref,
          paidAt: targetPaidAt || new Date(),
          verifiedBy: "SYSTEM_MIGRATION",
          verifiedAt: targetPaidAt || new Date(),
          notes: "Historical payment backfilled during Omnichannel migration",
        },
      });
      paymentsCreatedCount++;
    }
  }

  console.log(`✅ [MIGRATION COMPLETE] Successfully updated ${updatedCount} orders.`);
  console.log(`💳 [MIGRATION COMPLETE] Created ${paymentsCreatedCount} historical payment records.`);
}

migrateOmnichannelData()
  .catch((err) => {
    console.error("❌ [MIGRATION FAILED]:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
