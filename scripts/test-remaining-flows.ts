import "./mock-server-only.cjs";
import "dotenv/config";
import crypto from "node:crypto";

import { db } from "../src/server/db";
import { redisGet } from "../src/server/redis";
import { createVerifiedOrder, saveOrder } from "../src/server/services/order.service";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "sk_test_dummy_mock_secret_for_tests";

interface StepResult {
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

const steps: StepResult[] = [];

async function step(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    process.stdout.write(`⏳ Testing: ${name}... `);
    await fn();
    const durationMs = Date.now() - start;
    console.log(`✅ PASSED (${durationMs}ms)`);
    steps.push({ name, passed: true, message: "OK", durationMs });
  } catch (err: any) {
    const durationMs = Date.now() - start;
    console.log(`❌ FAILED (${durationMs}ms)`);
    console.error(`   Error: ${err.message}`);
    steps.push({ name, passed: false, message: err.message, durationMs });
  }
}

function computeSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha512", secret).update(payload).digest("hex");
}

async function runRemainingTests() {
  console.log("===================================================================");
  console.log("🚀 TESTING REMAINING MODULES: WEBHOOKS, CUSTOMER AUTH, REVIEWS, GATEWAY");
  console.log("===================================================================\n");

  const timestamp = Date.now();
  const testEmail = `patron.account.${timestamp}@example.com`;
  let testProduct: any = null;
  let customerSessionCookie = "";
  let testOrderId = "";
  let testOrderNumber = "";
  let testWebhookRef = `wh_test_${timestamp}`;

  const cleanups = {
    orderIds: [] as string[],
    customerEmails: [testEmail],
    reviewIds: [] as string[],
    productIds: [] as string[],
  };

  try {
    // -------------------------------------------------------------------------
    // SETUP: Warmup DB and Create / Find Test Product
    // -------------------------------------------------------------------------
    await step("Setup: Active Product & Stock Preparation", async () => {
      let prod = await db.product.findFirst({ where: { stock: { gte: 10 } } });
      if (!prod) {
        prod = await db.product.create({
          data: {
            name: `Webhook Test Cap ${timestamp}`,
            slug: `wh-test-cap-${timestamp}`,
            price: 30000,
            stock: 25,
            rating: 5,
            images: ["https://example.com/cap.jpg"],
            colors: ["Gold"],
            sizes: ["22", "23"],
          },
        });
        cleanups.productIds.push(prod.id);
      }
      testProduct = prod;

      // Create an order to be paid via webhook
      const initialOrder = await createVerifiedOrder(
        [{ product: { id: testProduct.id }, quantity: 1, selectedSize: "22" }],
        { firstName: "Webhook", lastName: "Patron", email: testEmail, phone: "+2348031239999" },
        { address: "10 Victoria Island", city: "Lagos", state: "Lagos" },
        3500,
        testWebhookRef
      );
      const saved = await saveOrder(initialOrder);
      testOrderId = saved.id;
      testOrderNumber = saved.orderNumber || "";
      cleanups.orderIds.push(testOrderId);
    });

    // -------------------------------------------------------------------------
    // AREA 1: Paystack Webhook Security & Execution
    // -------------------------------------------------------------------------
    await step("Area 1.1: Webhook Forged / Invalid Signature Rejection", async () => {
      const payload = JSON.stringify({
        event: "charge.success",
        data: { reference: testWebhookRef, amount: 3350000, currency: "NGN" },
      });

      const res = await fetch(`${BASE_URL}/api/webhooks/paystack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-paystack-signature": "bad_forged_signature_1234567890abcdef",
        },
        body: payload,
      });

      if (res.status !== 401) {
        throw new Error(`Expected 401 Unauthorized for forged signature, got ${res.status}`);
      }
    });

    await step("Area 1.2: Webhook Underpayment Protection", async () => {
      const underpaidPayload = JSON.stringify({
        event: "charge.success",
        data: {
          reference: testWebhookRef,
          amount: 50000, // 500 NGN instead of 33,500 NGN
          currency: "NGN",
        },
      });
      const validSig = computeSignature(underpaidPayload, PAYSTACK_SECRET);

      const res = await fetch(`${BASE_URL}/api/webhooks/paystack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-paystack-signature": validSig,
        },
        body: underpaidPayload,
      });

      if (res.status !== 400) {
        throw new Error(`Expected 400 Bad Request for underpayment attack, got ${res.status}`);
      }
    });

    await step("Area 1.3: Webhook Currency Mismatch Protection", async () => {
      const badCurrencyPayload = JSON.stringify({
        event: "charge.success",
        data: {
          reference: testWebhookRef,
          amount: 3350000,
          currency: "USD",
        },
      });
      const sig = computeSignature(badCurrencyPayload, PAYSTACK_SECRET);

      const res = await fetch(`${BASE_URL}/api/webhooks/paystack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-paystack-signature": sig,
        },
        body: badCurrencyPayload,
      });

      if (res.status !== 400) {
        throw new Error(`Expected 400 Bad Request for foreign currency attack, got ${res.status}`);
      }
    });

    await step("Area 1.4: Legitimate Paystack Webhook Finalization (charge.success)", async () => {
      const stockBefore = (await db.product.findUniqueOrThrow({ where: { id: testProduct.id } })).stock;
      const orderBefore = await db.order.findUniqueOrThrow({ where: { id: testOrderId } });
      const totalKobo = Math.round(Number(orderBefore.total) * 100);

      const legitimatePayload = JSON.stringify({
        event: "charge.success",
        data: {
          reference: testWebhookRef,
          amount: totalKobo,
          currency: "NGN",
          channel: "card",
          paid_at: new Date().toISOString(),
        },
      });
      const validSig = computeSignature(legitimatePayload, PAYSTACK_SECRET);

      const res = await fetch(`${BASE_URL}/api/webhooks/paystack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-paystack-signature": validSig,
        },
        body: legitimatePayload,
      });

      if (res.status !== 200) {
        throw new Error(`Legitimate webhook failed with HTTP ${res.status}`);
      }

      // Verify order transitioned to PAID in database
      const orderAfter = await db.order.findUniqueOrThrow({ where: { id: testOrderId } });
      if (orderAfter.paymentStatus !== "PAID") {
        throw new Error(`Expected order paymentStatus to be PAID, got ${orderAfter.paymentStatus}`);
      }

      // Verify physical stock decremented
      const stockAfter = (await db.product.findUniqueOrThrow({ where: { id: testProduct.id } })).stock;
      if (stockAfter !== stockBefore - 1) {
        throw new Error(`Expected stock to decrement from ${stockBefore} to ${stockBefore - 1}, got ${stockAfter}`);
      }
    });

    await step("Area 1.5: Webhook Idempotency on Duplicate Replay", async () => {
      const stockBefore = (await db.product.findUniqueOrThrow({ where: { id: testProduct.id } })).stock;
      const order = await db.order.findUniqueOrThrow({ where: { id: testOrderId } });
      const totalKobo = Math.round(Number(order.total) * 100);

      const replayPayload = JSON.stringify({
        event: "charge.success",
        data: {
          reference: testWebhookRef,
          amount: totalKobo,
          currency: "NGN",
          channel: "card",
        },
      });
      const sig = computeSignature(replayPayload, PAYSTACK_SECRET);

      const res = await fetch(`${BASE_URL}/api/webhooks/paystack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-paystack-signature": sig,
        },
        body: replayPayload,
      });

      if (res.status !== 200) {
        throw new Error(`Duplicate webhook failed with HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data.note?.includes("already_processed")) {
        throw new Error(`Expected note 'already_processed', got ${JSON.stringify(data)}`);
      }

      // Verify stock was not deducted again
      const stockAfter = (await db.product.findUniqueOrThrow({ where: { id: testProduct.id } })).stock;
      if (stockAfter !== stockBefore) {
        throw new Error(`Duplicate webhook caused double stock deduction! Before: ${stockBefore}, After: ${stockAfter}`);
      }
    });

    // -------------------------------------------------------------------------
    // AREA 2: Customer Authentication & Account Portal Lifecycle
    // -------------------------------------------------------------------------
    await step("Area 2.1: Customer OTP Engine (Generate & Verify Code)", async () => {
      const { sendCustomerOtp, verifyCustomerOtp } = await import("../src/server/customer-auth");
      const sendRes = await sendCustomerOtp(testEmail);
      if (!sendRes.success) throw new Error(sendRes.message);

      const record = await redisGet<{ code: string }>(`otp:${testEmail.toLowerCase()}`);
      if (!record?.code) throw new Error("Could not retrieve generated OTP from cache");

      const verifyRes = await verifyCustomerOtp(testEmail, record.code);
      if (!verifyRes.success || !verifyRes.token) {
        throw new Error(`verifyCustomerOtp failed: ${verifyRes.error}`);
      }
    });

    await step("Area 2.2: Establish Authenticated Customer Session Cookie", async () => {
      const { createCustomerSessionToken } = await import("../src/server/customer-auth");
      const cust = await db.customer.upsert({
        where: { email: testEmail },
        update: {},
        create: {
          email: testEmail,
          firstName: "Verified",
          lastName: "Patron",
          phone: "+2348039988776",
        },
      });
      const token = await createCustomerSessionToken(cust.id, cust.email || testEmail);
      customerSessionCookie = `filayoruba_customer_session=${token}`;
    });

    await step("Area 2.3: Authenticated Customer Session Inspection", async () => {
      const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
        headers: { Cookie: customerSessionCookie },
      });

      if (!sessionRes.ok) {
        throw new Error(`Session check failed with HTTP ${sessionRes.status}`);
      }
      const data = await sessionRes.json();
      if (!data.authenticated || data.customer?.email !== testEmail.toLowerCase()) {
        throw new Error(`Expected authenticated customer with email ${testEmail}, got ${JSON.stringify(data)}`);
      }
    });

    await step("Area 2.4: Customer Address Book CRUD", async () => {
      // Create new address
      const addRes = await fetch(`${BASE_URL}/api/customer/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: customerSessionCookie,
        },
        body: JSON.stringify({
          address: "Plot 42 Adeola Odeku",
          city: "Victoria Island",
          state: "Lagos",
          postalCode: "101241",
          isDefault: true,
        }),
      });

      if (!addRes.ok) {
        const err = await addRes.json();
        throw new Error(`Address creation failed: ${err.message}`);
      }

      // Fetch saved addresses
      const getRes = await fetch(`${BASE_URL}/api/customer/addresses`, {
        headers: { Cookie: customerSessionCookie },
      });
      if (!getRes.ok) throw new Error("Failed to fetch customer addresses");

      const addrData = await getRes.json();
      if (!Array.isArray(addrData.addresses) || addrData.addresses.length === 0) {
        throw new Error("Customer addresses array is empty after addition");
      }
    });

    await step("Area 2.5: Customer Order History Inspection", async () => {
      const ordersRes = await fetch(`${BASE_URL}/api/customer/orders`, {
        headers: { Cookie: customerSessionCookie },
      });

      if (!ordersRes.ok) {
        throw new Error(`Customer orders listing failed with HTTP ${ordersRes.status}`);
      }
      const data = await ordersRes.json();
      if (!Array.isArray(data.orders)) {
        throw new Error("Expected orders array for authenticated customer");
      }
    });

    // -------------------------------------------------------------------------
    // AREA 3: Customer Reviews & Ratings Engine
    // -------------------------------------------------------------------------
    await step("Area 3: Verified Customer Review Submission & Rating Update", async () => {
      // Transition customer's order to DELIVERED to fulfill verified-purchaser guard
      await db.order.update({
        where: { id: testOrderId },
        data: { status: "DELIVERED" },
      });

      const reviewRes = await fetch(`${BASE_URL}/api/products/${testProduct.slug}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: customerSessionCookie,
        },
        body: JSON.stringify({
          rating: 5,
          title: "Superb Yoruba Craftsmanship",
          comment: "The embroidery and quality on this cap is truly world class. Highly recommended!",
        }),
      });

      if (!reviewRes.ok) {
        const err = await reviewRes.json();
        throw new Error(`Review submission failed: ${err.message}`);
      }

      const reviewData = await reviewRes.json();
      if (!reviewData.success || !reviewData.review?.id) {
        throw new Error("Review response missing success confirmation or ID");
      }
      cleanups.reviewIds.push(reviewData.review.id);
    });

    // -------------------------------------------------------------------------
    // AREA 6: Live Payment Gateway & Email Service Connectivity Handshake
    // -------------------------------------------------------------------------
    await step("Area 6: Paystack Gateway API Handshake Verification", async () => {
      // Perform genuine API ping to Paystack using current secret key
      const pRes = await fetch("https://api.paystack.co/transaction/verify/non_existent_ref_handshake", {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      });

      // HTTP 400/404 with JSON message means credentials are valid and reaching Paystack gateway!
      // (HTTP 401 would mean invalid credentials)
      if (pRes.status === 401) {
        throw new Error("Paystack rejected API secret key with 401 Unauthorized.");
      }
      const data = await pRes.json();
      if (typeof data.status === "undefined" && typeof data.message === "undefined") {
        throw new Error("Paystack API handshake returned non-JSON/unexpected response");
      }
    });

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n🧹 Cleaning up test artifacts...");
    if (cleanups.reviewIds.length > 0) {
      await db.review.deleteMany({ where: { id: { in: cleanups.reviewIds } } });
    }
    if (cleanups.orderIds.length > 0) {
      await db.stockMovement.deleteMany({ where: { orderId: { in: cleanups.orderIds } } });
      await db.inventoryReservation.deleteMany({ where: { orderId: { in: cleanups.orderIds } } });
      await db.payment.deleteMany({ where: { orderId: { in: cleanups.orderIds } } });
      await db.orderItem.deleteMany({ where: { orderId: { in: cleanups.orderIds } } });
      await db.order.deleteMany({ where: { id: { in: cleanups.orderIds } } });
    }
    if (cleanups.customerEmails.length > 0) {
      const custs = await db.customer.findMany({ where: { email: { in: cleanups.customerEmails } } });
      const custIds = custs.map((c) => c.id);
      if (custIds.length > 0) {
        await db.address.deleteMany({ where: { customerId: { in: custIds } } });
        await db.customer.deleteMany({ where: { id: { in: custIds } } });
      }
    }
    if (cleanups.productIds.length > 0) {
      await db.product.deleteMany({ where: { id: { in: cleanups.productIds } } });
    }
    console.log("✓ Cleanup finished.");
  }

  // -------------------------------------------------------------------------
  // REPORT
  // -------------------------------------------------------------------------
  console.log("\n===================================================================");
  console.log("📊 AREAS 1, 2, 3, 6 TEST RESULTS SUMMARY");
  console.log("===================================================================");
  let allGood = true;
  for (const s of steps) {
    const icon = s.passed ? "✅" : "❌";
    console.log(`${icon} [${s.durationMs}ms] ${s.name}`);
    if (!s.passed) {
      allGood = false;
      console.log(`   Message: ${s.message}`);
    }
  }
  console.log("===================================================================");
  if (allGood) {
    console.log("🎉 ALL MODULES TESTED & PASSED WITH 100% SUCCESS!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runRemainingTests().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
