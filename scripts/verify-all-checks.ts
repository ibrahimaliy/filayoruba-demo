import "dotenv/config";

// Standalone runner shim for server-only package
const Module = require("module");
const origRequire = Module.prototype.require;
Module.prototype.require = function (path: string) {
  if (path === "server-only") return {};
  return origRequire.apply(this, arguments);
};

import { db } from "../src/server/db";
import { createManualOrder, recordOrderRefund, cancelCustomerOrder } from "../src/server/services/order.service";
import { finalizeSuccessfulPayment } from "../src/server/services/payment.service";
import { getAvailableStock } from "../src/server/services/inventory.service";

async function runComprehensiveChecks() {
  console.log("===================================================================");
  console.log("🚀 STARTING COMPREHENSIVE V4 OMNICHANNEL CHECKS & VERIFICATIONS");
  console.log("===================================================================\n");

  // Setup test products
  const timestamp = Date.now();
  const prodA = await db.product.create({
    data: {
      name: `Test Cap A ${timestamp}`,
      slug: `test-cap-a-${timestamp}`,
      price: 20000,
      stock: 10,
      rating: 5,
      images: ["https://example.com/a.jpg"],
      colors: ["Red"],
      sizes: ["22"],
    },
  });

  const prodB = await db.product.create({
    data: {
      name: `Test Cap B ${timestamp}`,
      slug: `test-cap-b-${timestamp}`,
      price: 30000,
      stock: 10,
      rating: 5,
      images: ["https://example.com/b.jpg"],
      colors: ["Blue"],
      sizes: ["23"],
    },
  });

  const testIdsToClean = {
    orderIds: [] as string[],
    productIds: [prodA.id, prodB.id],
    customerEmails: [] as string[],
  };

  try {
    // -------------------------------------------------------------------------
    // CHECK 1 & 3: Expired Reservation Payment Flow
    // -------------------------------------------------------------------------
    console.log("[Check 1 & 3] Expired Reservation Payment Flow...");
    const testEmail1 = `patron1.${timestamp}@example.com`;
    testIdsToClean.customerEmails.push(testEmail1);

    const order1 = await createManualOrder({
      channel: "WHATSAPP",
      customer: {
        firstName: "Adebayo",
        lastName: "ExpiredTest",
        phone: `+234801${String(timestamp).slice(-7)}`,
        email: testEmail1,
      },
      items: [{ productId: prodA.id, quantity: 2, selectedSize: "22" }],
      paymentTiming: "RESERVE_PAY_LATER",
      reservationMinutes: 60,
    });
    testIdsToClean.orderIds.push(order1.id);

    // Artificially expire the reservation
    const pastDate = new Date(Date.now() - 3600 * 1000); // 1 hour in the past
    await db.inventoryReservation.updateMany({
      where: { orderId: order1.id },
      data: { expiresAt: pastDate },
    });

    const stockBeforePayment = (await db.product.findUniqueOrThrow({ where: { id: prodA.id } })).stock;

    // Simulate Paystack/Transfer payment arriving AFTER expiry
    const ref1 = `exp_pay_${timestamp}`;
    const payResult1 = await finalizeSuccessfulPayment({
      orderId: order1.id,
      amount: order1.total,
      reference: ref1,
      method: "PAYSTACK",
      provider: "PAYSTACK",
      verifiedBy: "SYSTEM_TEST",
    });

    // Verify assertions:
    // 1. Payment status must be PAID
    if (!payResult1.order || payResult1.order.paymentStatus !== "PAID") {
      throw new Error(`Expected paymentStatus to remain PAID, got ${payResult1.order?.paymentStatus}`);
    }
    // 2. hasExpiredReservation flag must be true
    if (!payResult1.hasExpiredReservation) {
      throw new Error("Expected hasExpiredReservation to be true!");
    }
    // 3. Physical stock must NOT be silently deducted
    const stockAfterPayment = (await db.product.findUniqueOrThrow({ where: { id: prodA.id } })).stock;
    if (stockAfterPayment !== stockBeforePayment) {
      throw new Error(`Physical stock should NOT be deducted for expired reservation! Before: ${stockBeforePayment}, After: ${stockAfterPayment}`);
    }
    // 4. Order internalNotes should contain staff resolution alert
    const refreshedOrder1 = await db.order.findUniqueOrThrow({ where: { id: order1.id } });
    if (!refreshedOrder1.internalNotes?.includes("ALERT: Payment finalized but one or more inventory reservations had expired")) {
      throw new Error("Expected internalNotes to contain staff resolution alert!");
    }
    console.log("  ✓ Payment remains PAID financially, physical stock is NOT deducted, staff resolution alert flagged.");

    // -------------------------------------------------------------------------
    // CHECK 2: Refund State Independence
    // -------------------------------------------------------------------------
    console.log("\n[Check 2] Refund State Independence...");
    // Issue a partial refund on order 1
    const partialRefundAmount = 5000;
    const refundedOrder = await recordOrderRefund({
      orderId: order1.id,
      amount: partialRefundAmount,
      reason: "Customer requested partial courtesy refund",
      refundedBy: "admin_tester",
    });

    if (refundedOrder.paymentStatus !== "paid") {
      throw new Error(`Expected paymentStatus to remain 'paid', got ${refundedOrder.paymentStatus}`);
    }
    if (refundedOrder.refundStatus !== "partially_refunded") {
      throw new Error(`Expected refundStatus to be 'partially_refunded', got ${refundedOrder.refundStatus}`);
    }
    if (refundedOrder.amountRefunded !== partialRefundAmount) {
      throw new Error(`Expected amountRefunded to be ${partialRefundAmount}, got ${refundedOrder.amountRefunded}`);
    }

    // Verify that attempting to refund more than paid throws error
    let overRefundCaught = false;
    try {
      await recordOrderRefund({
        orderId: order1.id,
        amount: Number(order1.total) * 2, // Exceeds total
        refundedBy: "admin_tester",
      });
    } catch (err: any) {
      overRefundCaught = true;
      console.log(`  ✓ Over-refund rejected cleanly: "${err.message}"`);
    }
    if (!overRefundCaught) {
      throw new Error("Expected over-refund to be rejected!");
    }
    console.log("  ✓ PaymentStatus and RefundStatus remain strictly independent.");

    // -------------------------------------------------------------------------
    // CHECK 6: Cancellation After Unresolved Payment (No False Stock Restoration)
    // -------------------------------------------------------------------------
    console.log("\n[Check 6] Cancellation After Payment With Expired Reservation...");
    const stockBeforeCancel = (await db.product.findUniqueOrThrow({ where: { id: prodA.id } })).stock;

    // Cancel order 1 (which had expired reservation and thus never deducted stock)
    await cancelCustomerOrder({
      orderIdOrNumber: order1.id,
      cancelledBy: "admin",
      adminUserId: "admin_tester",
      reason: "Cancelled due to expired inventory allocation",
    });

    const stockAfterCancel = (await db.product.findUniqueOrThrow({ where: { id: prodA.id } })).stock;
    if (stockAfterCancel !== stockBeforeCancel) {
      throw new Error(`Physical stock was falsely restored on an order that never deducted physical stock! Before: ${stockBeforeCancel}, After: ${stockAfterCancel}`);
    }
    console.log("  ✓ Order cancellation correctly checked for actual SALE movement; physical stock was NOT falsely restored.");

    // -------------------------------------------------------------------------
    // CHECK 4 & 5: Duplicate Payment Protection & Manual Idempotency
    // -------------------------------------------------------------------------
    console.log("\n[Check 4 & 5] Duplicate Payment / Webhook Protection...");
    const testEmail2 = `patron2.${timestamp}@example.com`;
    testIdsToClean.customerEmails.push(testEmail2);

    const order2 = await createManualOrder({
      channel: "INSTAGRAM",
      customer: {
        firstName: "Folake",
        lastName: "DupeTest",
        phone: `+234802${String(timestamp).slice(-7)}`,
        email: testEmail2,
      },
      items: [{ productId: prodB.id, quantity: 1, selectedSize: "23" }],
      paymentTiming: "RESERVE_PAY_LATER",
      reservationMinutes: 60,
    });
    testIdsToClean.orderIds.push(order2.id);

    const initialStockB = (await db.product.findUniqueOrThrow({ where: { id: prodB.id } })).stock;
    const paymentRef2 = `bank_trf_ref_${timestamp}`;

    // First payment attempt
    const resPayA = await finalizeSuccessfulPayment({
      orderId: order2.id,
      amount: order2.total,
      reference: paymentRef2,
      method: "BANK_TRANSFER",
      provider: "INTERNAL",
      verifiedBy: "admin_tester",
    });
    if (resPayA.alreadyProcessed) {
      throw new Error("First payment attempt should not be alreadyProcessed!");
    }

    const stockAfterPayA = (await db.product.findUniqueOrThrow({ where: { id: prodB.id } })).stock;
    if (stockAfterPayA !== initialStockB - 1) {
      throw new Error(`Physical stock should have decremented by 1, expected ${initialStockB - 1}, got ${stockAfterPayA}`);
    }

    // Duplicate payment attempt (simulating duplicate webhook or staff double-click)
    const resPayB = await finalizeSuccessfulPayment({
      orderId: order2.id,
      amount: order2.total,
      reference: paymentRef2,
      method: "BANK_TRANSFER",
      provider: "INTERNAL",
      verifiedBy: "admin_tester",
    });
    if (!resPayB.alreadyProcessed) {
      throw new Error("Second payment attempt with identical reference MUST return alreadyProcessed: true!");
    }

    // Ensure stock was NOT decremented again
    const stockAfterPayB = (await db.product.findUniqueOrThrow({ where: { id: prodB.id } })).stock;
    if (stockAfterPayB !== stockAfterPayA) {
      throw new Error(`Duplicate payment falsely decremented stock again! Before: ${stockAfterPayA}, After: ${stockAfterPayB}`);
    }

    // Verify only ONE Payment row exists with this reference
    const paymentCount = await db.payment.count({ where: { reference: paymentRef2 } });
    if (paymentCount !== 1) {
      throw new Error(`Expected exactly 1 payment record for reference ${paymentRef2}, found ${paymentCount}`);
    }
    console.log("  ✓ Duplicate payment correctly recognized, stock deduction prevented, exactly 1 payment record preserved.");

    // -------------------------------------------------------------------------
    // CHECK 7: Multi-Product Concurrency (Opposite Ordering Deadlock Prevention)
    // -------------------------------------------------------------------------
    console.log("\n[Check 7] Multi-Product Concurrency & Deterministic Deadlock Prevention...");
    const emailConcur1 = `concur1.${timestamp}@example.com`;
    const emailConcur2 = `concur2.${timestamp}@example.com`;
    testIdsToClean.customerEmails.push(emailConcur1, emailConcur2);

    // Launch Order 1 with [Prod A, Prod B] and Order 2 with [Prod B, Prod A] concurrently
    const [concurOrder1, concurOrder2] = await Promise.all([
      createManualOrder({
        channel: "WALK_IN",
        customer: { firstName: "Concur", lastName: "One", email: emailConcur1 },
        items: [
          { productId: prodA.id, quantity: 1, selectedSize: "22" },
          { productId: prodB.id, quantity: 1, selectedSize: "23" },
        ],
        paymentTiming: "IMMEDIATE",
        paymentMethod: "CASH",
      }),
      createManualOrder({
        channel: "WHATSAPP",
        customer: { firstName: "Concur", lastName: "Two", email: emailConcur2 },
        items: [
          { productId: prodB.id, quantity: 1, selectedSize: "23" }, // Reversed order!
          { productId: prodA.id, quantity: 1, selectedSize: "22" },
        ],
        paymentTiming: "IMMEDIATE",
        paymentMethod: "POS",
      }),
    ]);
    testIdsToClean.orderIds.push(concurOrder1.id, concurOrder2.id);

    console.log(`  ✓ Concurrently processed Order #${concurOrder1.orderNumber} and #${concurOrder2.orderNumber} with reverse-ordered items without deadlocks!`);

    // -------------------------------------------------------------------------
    // CHECK 8: Negative Stock Protection
    // -------------------------------------------------------------------------
    console.log("\n[Check 8] Negative Stock Invariant Protection...");
    // Attempt to manually reserve or deduct more than available
    let negativeStockPrevented = false;
    try {
      await createManualOrder({
        channel: "WALK_IN",
        customer: { firstName: "Greedy", lastName: "Buyer" },
        items: [{ productId: prodA.id, quantity: 9999, selectedSize: "22" }],
        paymentTiming: "IMMEDIATE",
        paymentMethod: "CASH",
      });
    } catch (err: any) {
      negativeStockPrevented = true;
      console.log(`  ✓ Overselling prevented: "${err.message}"`);
    }
    if (!negativeStockPrevented) {
      throw new Error("Expected overselling order to be rejected!");
    }

    // Direct database test on CHECK constraint: products_stock_non_negative
    let checkConstraintFired = false;
    try {
      await db.product.update({
        where: { id: prodA.id },
        data: { stock: -5 },
      });
    } catch (err: any) {
      checkConstraintFired = true;
      console.log("  ✓ Database constraint `products_stock_non_negative` rejected stock = -5 at PostgreSQL engine level.");
    }
    if (!checkConstraintFired) {
      throw new Error("Expected PostgreSQL check constraint `products_stock_non_negative` to reject negative stock!");
    }

    // -------------------------------------------------------------------------
    // CHECK 9: Stock Ledger Audit Integrity
    // -------------------------------------------------------------------------
    console.log("\n[Check 9] Stock Ledger Audit Integrity...");
    const movements = await db.stockMovement.findMany({
      where: { orderId: { in: testIdsToClean.orderIds } },
    });
    for (const mov of movements) {
      if (typeof mov.previousStock !== "number" || typeof mov.newStock !== "number") {
        throw new Error(`Stock movement ${mov.id} missing previousStock or newStock!`);
      }
      if (mov.newStock !== mov.previousStock + mov.quantity) {
        throw new Error(`Stock movement mathematical invariant broken: previous (${mov.previousStock}) + qty (${mov.quantity}) !== new (${mov.newStock})`);
      }
    }
    console.log(`  ✓ Audited ${movements.length} StockMovement records. All mathematical invariants (previous + qty = new) hold.`);

    // -------------------------------------------------------------------------
    // CHECK 12: Concurrent Customer Creation with Same Phone
    // -------------------------------------------------------------------------
    console.log("\n[Check 12] Concurrent Customer Creation with Same Phone...");
    const sharedPhone = `+234810${String(timestamp).slice(-7)}`;

    // Launch two simultaneous order creations with identical phone and NO email
    const [custOrderA, custOrderB] = await Promise.all([
      createManualOrder({
        channel: "WALK_IN",
        customer: { firstName: "Shared", lastName: "Patron", phone: sharedPhone },
        items: [{ productId: prodA.id, quantity: 1, selectedSize: "22" }],
        paymentTiming: "RESERVE_PAY_LATER",
      }),
      createManualOrder({
        channel: "WALK_IN",
        customer: { firstName: "Shared", lastName: "Patron", phone: sharedPhone },
        items: [{ productId: prodA.id, quantity: 1, selectedSize: "22" }],
        paymentTiming: "RESERVE_PAY_LATER",
      }),
    ]);
    testIdsToClean.orderIds.push(custOrderA.id, custOrderB.id);

    const custACount = await db.customer.count({ where: { phone: sharedPhone } });
    if (custACount !== 1) {
      throw new Error(`Expected exactly 1 customer row for phone ${sharedPhone}, found ${custACount}!`);
    }
    console.log(`  ✓ Concurrent creation with phone ${sharedPhone} safely produced exactly 1 customer profile (ID: ${custOrderA.customer.id}).`);

  } finally {
    // Cleanup
    console.log("\n[Cleanup] Cleaning up comprehensive test entities...");
    if (testIdsToClean.orderIds.length > 0) {
      await db.stockMovement.deleteMany({ where: { orderId: { in: testIdsToClean.orderIds } } });
      await db.inventoryReservation.deleteMany({ where: { orderId: { in: testIdsToClean.orderIds } } });
      await db.payment.deleteMany({ where: { orderId: { in: testIdsToClean.orderIds } } });
      await db.orderItem.deleteMany({ where: { orderId: { in: testIdsToClean.orderIds } } });
      await db.order.deleteMany({ where: { id: { in: testIdsToClean.orderIds } } });
    }
    if (testIdsToClean.customerEmails.length > 0) {
      await db.customer.deleteMany({ where: { email: { in: testIdsToClean.customerEmails } } });
    }
    if (testIdsToClean.productIds.length > 0) {
      await db.product.deleteMany({ where: { id: { in: testIdsToClean.productIds } } });
    }
    console.log("  ✓ All test artifacts purged cleanly.");
  }

  console.log("\n===================================================================");
  console.log("🎉 ALL FINAL CHECKS & CONCURRENCY TESTS PASSED WITH ZERO ERRORS!");
  console.log("===================================================================\n");
}

runComprehensiveChecks()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });
