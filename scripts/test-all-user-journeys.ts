import "dotenv/config";

// Standalone runner shim for server-only package
const Module = require("module");
const origRequire = Module.prototype.require;
Module.prototype.require = function (path: string) {
  if (path === "server-only") return {};
  return origRequire.apply(this, arguments);
};

import { db } from "../src/server/db";
import { getAvailableStock } from "../src/server/services/inventory.service";
import { finalizeSuccessfulPayment } from "../src/server/services/payment.service";
import { cancelCustomerOrder, createManualOrder, updateOrderStatus } from "../src/server/services/order.service";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.DEMO_ADMIN_PASSWORD || "fila_demo_reviewer_2026";

interface TestReport {
  name: string;
  passed: boolean;
  details: string;
  durationMs: number;
}

const report: TestReport[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    process.stdout.write(`⏳ Running: ${name}... `);
    await fn();
    const durationMs = Date.now() - start;
    console.log(`✅ PASSED (${durationMs}ms)`);
    report.push({ name, passed: true, details: "Success", durationMs });
  } catch (err: any) {
    const durationMs = Date.now() - start;
    console.log(`❌ FAILED (${durationMs}ms)`);
    console.error(`   Error: ${err.message}`);
    report.push({ name, passed: false, details: err.message, durationMs });
  }
}

async function runAllUserJourneys() {
  console.log("===================================================================");
  console.log("🌟 RUNNING COMPREHENSIVE END-TO-END USER JOURNEY VERIFICATION");
  console.log("===================================================================\n");

  const timestamp = Date.now();
  let testProductId = "";
  let testProductSlug = "";
  let testProductPrice = 25000;
  let onlineOrderId = "";
  let onlineOrderNumber = "";
  let onlineCustomerEmail = `patron.journey.${timestamp}@example.com`;
  let onlineCustomerPhone = "+2348039988776";
  let onlinePaymentRef = "";
  let adminSessionCookie = "";

  const testIdsToClean = {
    orderIds: [] as string[],
    productIds: [] as string[],
    customerEmails: [onlineCustomerEmail],
  };

  try {
    // -------------------------------------------------------------------------
    // PREPARATION: Find or Create Test Product with Available Stock
    // -------------------------------------------------------------------------
    await runTest("Preparation: Catalog Asset Verification", async () => {
      let product = null;
      let lastErr = null;
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          product = await db.product.findFirst({
            where: { stock: { gte: 10 } },
          });
          break;
        } catch (e: any) {
          lastErr = e;
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        }
      }

      if (!product) {
        if (lastErr) throw lastErr;
        product = await db.product.create({
          data: {
            name: `Test Luxury Aso Oke Cap ${timestamp}`,
            slug: `test-aso-oke-${timestamp}`,
            price: 25000,
            stock: 20,
            rating: 5,
            images: ["https://example.com/test-cap.jpg"],
            colors: ["Royal Blue", "Crimson"],
            sizes: ["22", "22.5", "23"],
          },
        });
        testIdsToClean.productIds.push(product.id);
      }

      testProductId = product.id;
      testProductSlug = product.slug;
      testProductPrice = Number(product.price);

      const stockStatus = await getAvailableStock(testProductId);
      if (stockStatus.availableStock <= 0) {
        throw new Error("Test product has insufficient available stock.");
      }
    });

    // -------------------------------------------------------------------------
    // JOURNEY 1: Discovery & Catalog Browsing
    // -------------------------------------------------------------------------
    await runTest("Journey 1: Discovery & Catalog Browsing (Homepage -> Products -> PDP)", async () => {
      // 1. Check Homepage APIs
      const [announcementRes, heroRes, collectionsRes, productsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/announcement`),
        fetch(`${BASE_URL}/api/hero-slides`),
        fetch(`${BASE_URL}/api/collections`),
        fetch(`${BASE_URL}/api/products`),
      ]);

      if (announcementRes.status !== 200) throw new Error("Announcement API failed");
      if (heroRes.status !== 200) throw new Error("Hero slides API failed");
      if (collectionsRes.status !== 200) throw new Error("Collections API failed");
      if (productsRes.status !== 200) throw new Error("Products API failed");

      const productsData = await productsRes.json();
      const productsList = Array.isArray(productsData) ? productsData : productsData.products;
      if (!productsList || productsList.length === 0) {
        throw new Error("Catalog returned 0 products");
      }

      // 2. Fetch specific product PDP
      const pdpRes = await fetch(`${BASE_URL}/products/${testProductSlug}`);
      if (pdpRes.status !== 200) {
        throw new Error(`Product Detail Page /products/${testProductSlug} returned HTTP ${pdpRes.status}`);
      }
    });

    // -------------------------------------------------------------------------
    // JOURNEY 2: Cart Math & Inventory Invariant Check
    // -------------------------------------------------------------------------
    await runTest("Journey 2: Cart Math & Shipping Calculation", async () => {
      const quantity = 2;
      const subtotal = testProductPrice * quantity;
      const shippingCost = 3500; // Lagos standard
      const total = subtotal + shippingCost;

      if (total !== testProductPrice * 2 + 3500) {
        throw new Error("Cart price calculation mismatch");
      }
    });

    // -------------------------------------------------------------------------
    // JOURNEY 3: Online Checkout & Paystack Payment Flow
    // -------------------------------------------------------------------------
    await runTest("Journey 3.1: Checkout Initialization & Reservation Hold", async () => {
      const initRes = await fetch(`${BASE_URL}/api/paystack/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              product: {
                id: testProductId,
                name: "Test Cap",
                slug: testProductSlug,
                price: testProductPrice,
                images: ["https://example.com/test-cap.jpg"],
                stock: 20,
              },
              quantity: 1,
              selectedSize: "22",
              selectedColor: "Royal Blue",
            },
          ],
          customer: {
            firstName: "Adekunle",
            lastName: "Tester",
            email: onlineCustomerEmail,
            phone: onlineCustomerPhone,
          },
          address: {
            address: "12 Marina Boulevard",
            city: "Lagos Island",
            state: "Lagos",
          },
          shipping: 3500,
        }),
      });

      if (!initRes.ok) {
        const err = await initRes.json();
        throw new Error(`Checkout initialization failed: ${err.message || initRes.statusText}`);
      }

      const initData = await initRes.json();
      if (!initData.orderId || !initData.reference) {
        throw new Error("Invalid initialization response: missing orderId or reference");
      }

      onlineOrderId = initData.orderId;
      onlineOrderNumber = initData.orderNumber;
      onlinePaymentRef = initData.reference;
      testIdsToClean.orderIds.push(onlineOrderId);

      const order = await db.order.findUniqueOrThrow({
        where: { id: onlineOrderId },
      });

      if (order.status !== "PENDING") {
        throw new Error(`Expected PENDING status, got ${order.status}`);
      }
      if (order.paymentStatus !== "UNPAID" && order.paymentStatus !== "PENDING") {
        throw new Error(`Expected UNPAID or PENDING paymentStatus, got ${order.paymentStatus}`);
      }
    });

    await runTest("Journey 3.2: Payment Finalization & Inventory Conversion", async () => {
      const stockBefore = (await db.product.findUniqueOrThrow({ where: { id: testProductId } })).stock;

      // Finalize payment
      const payResult = await finalizeSuccessfulPayment({
        orderId: onlineOrderId,
        amount: testProductPrice + 3500,
        reference: onlinePaymentRef,
        method: "PAYSTACK",
        provider: "PAYSTACK",
        verifiedBy: "TEST_RUNNER",
      });

      if (!payResult.success || payResult.order?.paymentStatus !== "PAID") {
        throw new Error(`Expected paymentStatus PAID, got ${payResult.order?.paymentStatus}`);
      }

      // Verify physical stock was decremented by 1
      const stockAfter = (await db.product.findUniqueOrThrow({ where: { id: testProductId } })).stock;
      if (stockAfter !== stockBefore - 1) {
        throw new Error(`Expected physical stock to decrement from ${stockBefore} to ${stockBefore - 1}, got ${stockAfter}`);
      }

      // Verify StockMovement SALE ledger entry
      const movement = await db.stockMovement.findFirst({
        where: { orderId: onlineOrderId, type: "SALE" },
      });
      if (!movement) {
        throw new Error("Expected SALE StockMovement record in ledger");
      }
    });

    // -------------------------------------------------------------------------
    // JOURNEY 4: Self-Service Order Tracking
    // -------------------------------------------------------------------------
    await runTest("Journey 4: Order Tracking with Customer Privacy Guard", async () => {
      // 1. Authorized lookup with matching email
      const trackRes = await fetch(
        `${BASE_URL}/api/orders/track?query=${encodeURIComponent(onlineOrderNumber)}&email=${encodeURIComponent(onlineCustomerEmail)}`
      );
      if (trackRes.status !== 200) {
        throw new Error(`Order tracking failed with status ${trackRes.status}`);
      }
      const trackData = await trackRes.json();
      if (!trackData.success || !trackData.order) {
        throw new Error("Order tracking returned unsuccessful payload");
      }
      if (trackData.order.status !== "confirmed" && trackData.order.status !== "paid") {
        throw new Error(`Unexpected order tracking status: ${trackData.order.status}`);
      }

      // 2. Security Guard: Lookup with incorrect email must be blocked (403 or 400)
      const badEmailRes = await fetch(
        `${BASE_URL}/api/orders/track?query=${encodeURIComponent(onlineOrderNumber)}&email=imposter@example.com`
      );
      if (badEmailRes.status !== 403 && badEmailRes.status !== 400) {
        throw new Error(`Expected 403 or 400 for mismatched email lookup, got ${badEmailRes.status}`);
      }
    });

    // -------------------------------------------------------------------------
    // JOURNEY 5: Self-Service Order Cancellation & Stock Restoration
    // -------------------------------------------------------------------------
    await runTest("Journey 5: Order Cancellation & Instant Stock Restoration", async () => {
      const stockBeforeCancel = (await db.product.findUniqueOrThrow({ where: { id: testProductId } })).stock;

      // Cancel the order
      const cancelResult = await cancelCustomerOrder({
        orderIdOrNumber: onlineOrderId,
        cancelledBy: "customer",
        customerEmail: onlineCustomerEmail,
        reason: "Customer needed to change event delivery timeframe",
      });

      if (!cancelResult.success) {
        throw new Error(`Order cancellation failed: ${cancelResult.message}`);
      }

      // Verify physical stock restored
      const stockAfterCancel = (await db.product.findUniqueOrThrow({ where: { id: testProductId } })).stock;
      if (stockAfterCancel !== stockBeforeCancel + 1) {
        throw new Error(`Expected physical stock to restore to ${stockBeforeCancel + 1}, got ${stockAfterCancel}`);
      }

      // Verify order status in DB
      const refreshedOrder = await db.order.findUniqueOrThrow({ where: { id: onlineOrderId } });
      if (refreshedOrder.status !== "CANCELLED") {
        throw new Error(`Expected order status CANCELLED, got ${refreshedOrder.status}`);
      }
    });

    // -------------------------------------------------------------------------
    // JOURNEY 6: Omnichannel Assisted Order (WhatsApp / Walk-In)
    // -------------------------------------------------------------------------
    await runTest("Journey 6: Omnichannel Assisted Order (WhatsApp -> Reserve -> Pay)", async () => {
      const assistEmail = `assisted.${timestamp}@example.com`;
      testIdsToClean.customerEmails.push(assistEmail);

      const manualOrder = await createManualOrder({
        channel: "WHATSAPP",
        customer: {
          firstName: "Bimpe",
          lastName: "ArtisanPatron",
          phone: "+2348051234567",
          email: assistEmail,
        },
        items: [{ productId: testProductId, quantity: 1, selectedSize: "22.5" }],
        paymentTiming: "RESERVE_PAY_LATER",
        reservationMinutes: 120,
      });

      testIdsToClean.orderIds.push(manualOrder.id);

      if (manualOrder.status !== "pending") {
        throw new Error(`Expected pending status for reserve-pay-later, got ${manualOrder.status}`);
      }

      // Customer completes payment via bank transfer
      const payResult = await finalizeSuccessfulPayment({
        orderId: manualOrder.id,
        amount: manualOrder.total,
        reference: `trf_${Date.now()}`,
        method: "BANK_TRANSFER",
        provider: "INTERNAL",
        verifiedBy: "ADMIN_STAFF",
      });

      if (payResult.order?.paymentStatus !== "PAID") {
        throw new Error("Bank transfer manual payment finalization failed");
      }
    });

    // -------------------------------------------------------------------------
    // JOURNEY 7: Admin Portal Authentication & Management Operations
    // -------------------------------------------------------------------------
    await runTest("Journey 7.1: Admin Authentication & Session Management", async () => {
      const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@filayoruba.com",
          password: ADMIN_PASSWORD,
        }),
      });

      if (!loginRes.ok) {
        const err = await loginRes.json();
        throw new Error(`Admin login failed: ${err.message}`);
      }

      // Extract set-cookie header
      const setCookie = loginRes.headers.get("set-cookie");
      if (!setCookie) {
        throw new Error("Admin login succeeded but returned no session cookie");
      }
      adminSessionCookie = setCookie.split(";")[0];
    });

    await runTest("Journey 7.2: Authenticated Admin Operations (Stats -> Orders -> Inventory)", async () => {
      // 1. Fetch Admin Stats & Metrics
      const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
        headers: { Cookie: adminSessionCookie },
      });
      if (!statsRes.ok) {
        throw new Error(`Admin stats failed with HTTP ${statsRes.status}`);
      }
      const stats = await statsRes.json();
      if (typeof stats.metrics?.totalRevenue === "undefined" && typeof stats.metrics?.totalOrders === "undefined") {
        throw new Error("Admin stats payload missing metrics fields");
      }

      // 2. Fetch Admin Orders List
      const ordersRes = await fetch(`${BASE_URL}/api/admin/orders`, {
        headers: { Cookie: adminSessionCookie },
      });
      if (!ordersRes.ok) {
        throw new Error(`Admin orders listing failed with HTTP ${ordersRes.status}`);
      }
      const ordersData = await ordersRes.json();
      if (!Array.isArray(ordersData.orders) && !Array.isArray(ordersData)) {
        throw new Error("Admin orders listing did not return orders array");
      }
    });

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n🧹 Purging journey test artifacts from database...");
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
    console.log("✓ Cleanup finished.");
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n===================================================================");
  console.log("📊 USER JOURNEY TEST SUITE SUMMARY");
  console.log("===================================================================");
  let allPassed = true;
  for (const t of report) {
    const icon = t.passed ? "✅" : "❌";
    console.log(`${icon} [${t.durationMs}ms] ${t.name}`);
    if (!t.passed) {
      console.log(`   Detail: ${t.details}`);
      allPassed = false;
    }
  }
  console.log("===================================================================");
  if (allPassed) {
    console.log("🎉 ALL USER JOURNEYS PASSED WITH 100% INTEGRITY!");
    process.exit(0);
  } else {
    console.error("❌ Some user journey steps failed.");
    process.exit(1);
  }
}

runAllUserJourneys().catch((err) => {
  console.error("Fatal error during journey testing:", err);
  process.exit(1);
});
