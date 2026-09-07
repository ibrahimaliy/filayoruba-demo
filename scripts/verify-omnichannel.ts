import "dotenv/config";

// Standalone runner shim for server-only package
const Module = require("module");
const origRequire = Module.prototype.require;
Module.prototype.require = function (path: string) {
  if (path === "server-only") return {};
  return origRequire.apply(this, arguments);
};

import { db } from "../src/server/db";
import { normalizePhoneNumber, isValidPhoneNumber } from "../src/lib/phone";
import { createManualOrder } from "../src/server/services/order.service";
import { finalizeSuccessfulPayment } from "../src/server/services/payment.service";
import { getAvailableStock } from "../src/server/services/inventory.service";

async function runOmnichannelVerification() {
  console.log("=== STARTING OMNICHANNEL SUITE VERIFICATION ===");

  // 1. Phone Normalization & E.164 Tests
  console.log("\n[Test 1] Testing Phone Normalization & E.164 Conversion...");
  const phoneTests = [
    { input: "0803 123 4567", expected: "+2348031234567" },
    { input: "09012345678", expected: "+2349012345678" },
    { input: "+234-803-123-4567", expected: "+2348031234567" },
    { input: "2348031234567", expected: "+2348031234567" },
    { input: "invalid-phone", expected: null },
  ];

  for (const t of phoneTests) {
    const res = normalizePhoneNumber(t.input);
    if (t.expected === null) {
      if (isValidPhoneNumber(t.input)) {
        throw new Error(`Expected "${t.input}" to be invalid, but passed!`);
      }
    } else {
      if (res !== t.expected) {
        throw new Error(`Expected normalize("${t.input}") to equal "${t.expected}", got "${res}"`);
      }
    }
  }
  console.log("  ✓ Phone normalization and validation passed!");

  // Find or create test product
  let product = await db.product.findFirst({ where: { stock: { gte: 5 } } });
  if (!product) {
    product = await db.product.create({
      data: {
        name: "Test Omnichannel Royal Fila",
        slug: `test-omni-fila-${Date.now()}`,
        price: 35000,
        stock: 20,
        featured: false,
        rating: 5,
        images: ["https://example.com/test.jpg"],
        colors: ["Navy"],
        sizes: ["22", "23"],
      },
    });
  }

  const initialPhysicalStock = product.stock;
  const initialAvailableStock = (await getAvailableStock(product.id)).availableStock;
  console.log(`\n[Test Product]: ${product.name} (ID: ${product.id})`);
  console.log(`  Initial Physical Stock: ${initialPhysicalStock}, Initial Available: ${initialAvailableStock}`);

  // 2. Test Manual Order Creation with Active Reservation
  console.log("\n[Test 2] Creating Manual WhatsApp Order with Inventory Reservation...");
  const clientRequestId = `test_req_${Date.now()}`;
  const testPhone = "+2348099998888";
  const testEmail = `test.omni.${Date.now()}@example.com`;

  const order = await createManualOrder({
    channel: "WHATSAPP",
    customer: {
      firstName: "Omowale",
      lastName: "TestPatron",
      phone: testPhone,
      email: testEmail,
    },
    items: [
      {
        productId: product.id,
        quantity: 2,
        selectedSize: "22",
      },
    ],
    fulfillmentType: "DELIVERY",
    shippingFee: 2500,
    discount: 1000,
    address: {
      address: "14 Broad Street, Marina",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
    },
    paymentTiming: "RESERVE_PAY_LATER",
    reservationMinutes: 60,
    clientRequestId,
    adminUserId: "admin_test_runner",
    adminEmail: "admin@filayoruba.internal",
  });

  console.log(`  ✓ Created Order #${order.orderNumber} (ID: ${order.id})`);

  // Check physical stock vs available stock
  const postOrderPhysical = (await db.product.findUniqueOrThrow({ where: { id: product.id } })).stock;
  const postOrderAvailable = (await getAvailableStock(product.id)).availableStock;
  console.log(`  Post-Order Physical Stock: ${postOrderPhysical} (must equal initial ${initialPhysicalStock})`);
  console.log(`  Post-Order Available Stock: ${postOrderAvailable} (must equal initial ${initialAvailableStock} - 2 = ${initialAvailableStock - 2})`);

  if (postOrderPhysical !== initialPhysicalStock) {
    throw new Error(`Physical stock should NOT decrease on reservation! Expected ${initialPhysicalStock}, got ${postOrderPhysical}`);
  }
  if (postOrderAvailable !== initialAvailableStock - 2) {
    throw new Error(`Available stock should decrease by 2! Expected ${initialAvailableStock - 2}, got ${postOrderAvailable}`);
  }
  console.log("  ✓ Reservation correctly deducted from available stock without touching physical stock!");

  // 3. Test Idempotency with clientRequestId
  console.log("\n[Test 3] Testing Idempotent Order Creation...");
  const duplicateOrder = await createManualOrder({
    channel: "WHATSAPP",
    customer: {
      firstName: "Omowale",
      lastName: "TestPatron",
      phone: testPhone,
      email: testEmail,
    },
    items: [{ productId: product.id, quantity: 2, selectedSize: "22" }],
    fulfillmentType: "DELIVERY",
    clientRequestId, // Duplicate request ID
    adminUserId: "admin_test_runner",
  });

  if (duplicateOrder.id !== order.id) {
    throw new Error(`Idempotency failed: expected order ID ${order.id}, got ${duplicateOrder.id}`);
  }
  console.log("  ✓ Idempotency verified: returned existing order without duplicate reservation or database row!");

  // 4. Test Finalizing Payment & Converting Reservation to Sale
  console.log("\n[Test 4] Finalizing Successful Payment via Centralized Engine...");
  const payResult = await finalizeSuccessfulPayment({
    orderId: order.id,
    amount: order.total,
    provider: "INTERNAL",
    method: "BANK_TRANSFER",
    reference: `test_transfer_ref_${Date.now()}`,
    verifiedBy: "admin_test_runner",
  });

  if (!payResult.order) {
    throw new Error("Expected payResult to have an order object");
  }

  console.log(`  ✓ Payment finalized: status=${payResult.order.status}, paymentStatus=${payResult.order.paymentStatus}`);
  if (payResult.order.paymentStatus.toLowerCase() !== "paid") {
    throw new Error(`Expected order paymentStatus to be 'paid', got ${payResult.order.paymentStatus}`);
  }

  // Check physical stock decremented
  const finalProduct = await db.product.findUniqueOrThrow({ where: { id: product.id } });
  console.log(`  Final Physical Stock: ${finalProduct.stock} (expected ${postOrderPhysical - 2})`);
  if (finalProduct.stock !== postOrderPhysical - 2) {
    throw new Error(`Physical stock should have decremented by 2 upon payment finalization!`);
  }

  // Check reservation status
  const reservation = await db.inventoryReservation.findFirst({
    where: { orderId: order.id, productId: product.id },
  });
  console.log(`  Reservation Status: ${reservation?.status} (expected CONVERTED)`);
  if (reservation?.status !== "CONVERTED") {
    throw new Error(`Reservation should be CONVERTED upon payment finalization!`);
  }

  // Check StockMovement ledger entry
  const movement = await db.stockMovement.findFirst({
    where: { productId: product.id, orderId: order.id },
  });
  console.log(`  StockMovement Ledger: type=${movement?.type}, qty=${movement?.quantity}`);
  if (!movement || movement.type !== "SALE" || movement.quantity !== -2) {
    throw new Error(`Stock movement SALE (-2) ledger row was not properly recorded!`);
  }
  console.log("  ✓ Payment finalization, stock decrement, reservation conversion, and ledger audited cleanly!");

  // 5. Customer Conflict Detection Test
  console.log("\n[Test 5] Testing Customer Identity Conflict Detection...");
  const conflictPhone = "+2348011112222";
  const conflictEmailA = `customer.a.${Date.now()}@example.com`;
  const conflictEmailB = `customer.b.${Date.now()}@example.com`;

  // Create Customer A
  await db.customer.create({
    data: {
      firstName: "Customer",
      lastName: "Alpha",
      phone: conflictPhone,
      email: conflictEmailA,
    },
  });

  // Create Customer B
  await db.customer.create({
    data: {
      firstName: "Customer",
      lastName: "Beta",
      phone: "+2348033334444",
      email: conflictEmailB,
    },
  });

  // Try creating an order with Customer A's phone and Customer B's email
  let caughtConflict = false;
  try {
    await createManualOrder({
      channel: "INSTAGRAM",
      customer: {
        firstName: "Conflicted",
        lastName: "User",
        phone: conflictPhone, // Belongs to Customer A
        email: conflictEmailB, // Belongs to Customer B
      },
      items: [{ productId: product.id, quantity: 1, selectedSize: "22" }],
      adminUserId: "admin_test_runner",
    });
  } catch (err: any) {
    if (err.message && (err.message.includes("Identity Conflict") || err.message.includes("conflict"))) {
      caughtConflict = true;
      console.log(`  ✓ Correctly rejected conflicting identity: "${err.message}"`);
    } else {
      throw err;
    }
  }

  if (!caughtConflict) {
    throw new Error("Expected createManualOrder to reject mismatched customer phone and email!");
  }

  // 6. Cleanup test records
  console.log("\n[Test 6] Cleaning up test data...");
  await db.stockMovement.deleteMany({ where: { orderId: order.id } });
  await db.inventoryReservation.deleteMany({ where: { orderId: order.id } });
  await db.payment.deleteMany({ where: { orderId: order.id } });
  await db.orderItem.deleteMany({ where: { orderId: order.id } });
  await db.order.delete({ where: { id: order.id } });
  await db.customer.deleteMany({
    where: {
      email: { in: [testEmail, conflictEmailA, conflictEmailB] },
    },
  });
  // Restore product stock
  await db.product.update({
    where: { id: product.id },
    data: { stock: initialPhysicalStock },
  });
  console.log("  ✓ Test artifacts cleaned up and stock restored.");

  console.log("\n=======================================================");
  console.log("🎉 ALL OMNICHANNEL ARCHITECTURE INTEGRATION TESTS PASSED!");
  console.log("=======================================================\n");
}

runOmnichannelVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Verification failed with error:", err);
    process.exit(1);
  });
