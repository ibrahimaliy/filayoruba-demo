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

async function verifyFeature() {
  console.log("=== VERIFYING ORDER ADDRESS CHANGE FEATURE ===");

  const testEmail = `patron.test.${Date.now()}@example.com`;
  const testOrderNum = `FY-TEST-${Date.now().toString().slice(-6)}`;

  // 1. Create a test order in CRAFTING status
  console.log("\n1. Creating test order in CRAFTING status...");
  const order = await prisma.order.create({
    data: {
      orderNumber: testOrderNum,
      status: "CRAFTING",
      subtotal: 42000,
      shippingFee: 2000,
      total: 44000,
      customerEmail: testEmail,
      customerName: "Babatunde Adeleke",
      customerPhone: "08022223333",
      shippingAddress: "Old Address, 12 Campbell Street",
      shippingCity: "Lagos Island",
      shippingState: "Lagos",
    },
  });
  console.log(`✓ Test order created: #${order.orderNumber} (ID: ${order.id})`);

  // 2. Test Input Validations via HTTP
  console.log("\n2. Testing API Validations on /api/customer/orders/address...");
  
  // 2a. Missing orderId
  const r1 = await fetch("http://localhost:3000/api/customer/orders/address", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const d1 = await r1.json();
  console.log(`- Empty payload -> HTTP ${r1.status}: ${d1.message}`);
  if (r1.status !== 400) throw new Error("Expected 400 for empty payload");

  // 2b. Missing street address
  const r2 = await fetch("http://localhost:3000/api/customer/orders/address", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: order.orderNumber, email: testEmail, address: " " }),
  });
  const d2 = await r2.json();
  console.log(`- Missing address -> HTTP ${r2.status}: ${d2.message}`);
  if (r2.status !== 400) throw new Error("Expected 400 for missing address");

  // 2c. Unauthorized email
  const r3 = await fetch("http://localhost:3000/api/customer/orders/address", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: order.orderNumber,
      email: "impostor@gmail.com",
      address: "15 Admiralty Way",
      city: "Lekki",
      state: "Lagos",
    }),
  });
  const d3 = await r3.json();
  console.log(`- Wrong email -> HTTP ${r3.status}: ${d3.message}`);
  if (r3.status !== 400 || !d3.message.includes("Unauthorized")) {
    throw new Error("Expected 400 Unauthorized for mismatching email");
  }

  // 3. Test Successful Address Change (Before Dispatch: CRAFTING)
  console.log("\n3. Testing Successful Address Change on CRAFTING order...");
  const newDeliveryAddress = {
    address: "Royal Penthouse, 24 Alexander Road",
    city: "Ikoyi",
    state: "Lagos",
    country: "Nigeria",
  };

  const r4 = await fetch("http://localhost:3000/api/customer/orders/address", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: order.orderNumber,
      email: testEmail,
      address: newDeliveryAddress.address,
      city: newDeliveryAddress.city,
      state: newDeliveryAddress.state,
      country: newDeliveryAddress.country,
      customerPhone: "08099998888",
    }),
  });
  const d4 = await r4.json();
  console.log(`- Update address -> HTTP ${r4.status}: ${d4.message}`);
  if (!r4.ok || !d4.success) throw new Error(`Update failed: ${d4.message}`);

  // Verify database state
  const updatedDb = await prisma.order.findUnique({ where: { id: order.id } });
  console.log(`- DB shippingAddress: "${updatedDb.shippingAddress}"`);
  console.log(`- DB shippingCity: "${updatedDb.shippingCity}"`);
  console.log(`- DB customerPhone: "${updatedDb.customerPhone}"`);

  if (
    updatedDb.shippingAddress !== newDeliveryAddress.address ||
    updatedDb.shippingCity !== newDeliveryAddress.city
  ) {
    throw new Error("Database did not reflect updated address!");
  }
  console.log("✓ Address updated successfully in database and response!");

  // 4. Test Transition to SHIPPED (Dispatched)
  console.log("\n4. Simulating order dispatch (status -> SHIPPED)...");
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "SHIPPED" },
  });

  // Attempt to update address after dispatch
  const r5 = await fetch("http://localhost:3000/api/customer/orders/address", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: order.orderNumber,
      email: testEmail,
      address: "Trying to divert package post-dispatch",
      city: "Victoria Island",
      state: "Lagos",
    }),
  });
  const d5 = await r5.json();
  console.log(`- Update after dispatch -> HTTP ${r5.status}: ${d5.message}`);

  if (r5.status !== 400 || !d5.message.toLowerCase().includes("dispatched")) {
    throw new Error("Expected rejection after order was dispatched!");
  }
  console.log("✓ Post-dispatch address change correctly blocked!");

  // 5. Verify Audit Log
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entity: "Order",
      entityId: order.id,
      action: "ORDER_ADDRESS_UPDATED",
    },
  });
  console.log(`\n5. Checking audit logs: Found ${auditLogs.length} audit log entries.`);
  if (auditLogs.length === 0) throw new Error("Expected at least 1 audit log entry!");
  console.log("✓ Audit log details:", JSON.stringify(auditLogs[0].details));

  // 6. Cleanup
  console.log("\n6. Cleaning up test data...");
  await prisma.auditLog.deleteMany({ where: { entityId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  console.log("✓ Cleanup done.");

  console.log("\n🎉 ALL TESTS PASSED! FEATURE IS ROCK SOLID & READY!");
}

verifyFeature()
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
