import { NextResponse } from "next/server";
import { validatePaystackSignature, finalizeSuccessfulPayment } from "@/server/services/payment.service";
import { getOrderByReference, notifyOrderPaid } from "@/server/services/order.service";
import { logAuditEvent } from "@/server/services/audit.service";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // 1. Verify HMAC SHA-512 signature
    const isValid = validatePaystackSignature(rawBody, signature);
    if (!isValid) {
      console.warn("⚠️ [SECURITY WARNING] Unauthorized Paystack webhook signature rejected.");
      return NextResponse.json(
        { message: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // 2. Parse event payload
    const event = JSON.parse(rawBody);

    // 3. Process charge.success event
    if (event.event === "charge.success" && event.data) {
      const { reference, channel, amount, currency } = event.data;

      if (reference) {
        const order = await getOrderByReference(reference);

        if (!order) {
          console.warn(`⚠️ [WEBHOOK] No matching order found for reference: ${reference}`);
          return NextResponse.json({ received: true, note: "order_not_found" }, { status: 200 });
        }

        // Idempotency Guard: Avoid duplicate processing if already paid
        if (order.paymentStatus === "paid") {
          return NextResponse.json({ received: true, note: "already_processed" }, { status: 200 });
        }

        // Currency Validation: Paystack payments must be NGN
        if (currency && currency !== "NGN") {
          console.error(`🚨 [SECURITY ALERT] Webhook currency mismatch: ${currency}`);
          return NextResponse.json({ received: true, error: "invalid_currency" }, { status: 400 });
        }

        // Amount Verification: Ensure paid amount matches order total in Kobo
        const expectedAmountKobo = Math.round(order.total * 100);
        if (typeof amount === "number" && amount < expectedAmountKobo) {
          console.error(
            `🚨 [SECURITY ALERT] Webhook amount mismatch! Expected ₦${order.total} (${expectedAmountKobo} kobo), received ${amount} kobo. Order ${order.id} NOT marked as paid.`
          );
          await logAuditEvent({
            action: "SECURITY_PAYMENT_MISMATCH",
            entity: "Order",
            entityId: order.id,
            details: { expectedKobo: expectedAmountKobo, receivedKobo: amount, reference },
          });
          return NextResponse.json({ received: true, error: "amount_mismatch" }, { status: 400 });
        }

        // Invoke authoritative centralized payment finalizer
        const finalResult = await finalizeSuccessfulPayment({
          orderId: order.id,
          amount: amount / 100,
          reference,
          method: "PAYSTACK",
          provider: "PAYSTACK",
          verifiedBy: "SYSTEM_PAYSTACK_WEBHOOK",
          channel,
          rawResponse: event.data,
        });

        // Dispatch real-time in-app admin alert & customer/admin emails strictly once
        if (finalResult.success && !finalResult.alreadyProcessed) {
          await notifyOrderPaid(order.id);
        }

        await logAuditEvent({
          action: "WEBHOOK_ORDER_PAID",
          entity: "Order",
          entityId: order.id,
          details: { reference, channel, amountKobo: amount },
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json(
      { message: "Webhook handler error" },
      { status: 500 }
    );
  }
}
