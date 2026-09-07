import { NextResponse } from "next/server";
import { verifyPaystackTransaction, finalizeSuccessfulPayment } from "@/server/services/payment.service";
import { getOrderByReference, updateOrderStatus, notifyOrderPaid } from "@/server/services/order.service";
import { logAuditEvent } from "@/server/services/audit.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { message: "Transaction reference is required" },
        { status: 400 }
      );
    }

    // 1. Locate matching order in database
    const order = await getOrderByReference(reference);
    if (!order) {
      return NextResponse.json(
        { message: "No matching order found for this transaction reference." },
        { status: 404 }
      );
    }

    // Fast-path Idempotency Guard: If order has already been confirmed paid
    if (order.paymentStatus === "paid" || ["paid", "confirmed", "crafting", "shipped", "delivered"].includes(order.status)) {
      const existingItems = (order.items || []).map((item: any) => ({
        productId: item.product?.id || item.productId || item.id,
        selectedSize: item.selectedSize || item.size || "Standard",
        quantity: item.quantity,
      }));

      return NextResponse.json({
        success: true,
        status: "paid",
        orderId: order.id,
        orderNumber: order.orderNumber || order.id.slice(0, 8).toUpperCase(),
        amount: order.total,
        reference: order.paymentReference || reference,
        email: order.customer?.email || "",
        paidAt: order.paidAt,
        channel: order.paymentMethod || "Paystack",
        items: existingItems,
        message: "Order has already been verified and paid.",
      });
    }

    // 2. Verify transaction with Paystack API
    const verification = await verifyPaystackTransaction(reference);

    if (verification.status === "success") {
      // 3. Amount & Currency Verification: Ensure currency is NGN and paid amount in Kobo matches order total
      if (verification.currency && verification.currency !== "NGN") {
        console.error(`🚨 [SECURITY ALERT] Paystack currency mismatch: ${verification.currency}`);
        return NextResponse.json(
          {
            success: false,
            status: "currency_mismatch",
            message: "Payment currency mismatch. Transactions must be in NGN.",
          },
          { status: 400 }
        );
      }

      const expectedAmountKobo = Math.round(order.total * 100);
      if (typeof verification.amount === "number" && verification.amount < expectedAmountKobo) {
        console.error(
          `🚨 [SECURITY ALERT] Paystack verify amount mismatch! Expected ₦${order.total} (${expectedAmountKobo} kobo), received ${verification.amount} kobo.`
        );
        await logAuditEvent({
          action: "SECURITY_PAYMENT_MISMATCH",
          entity: "Order",
          entityId: order.id,
          details: { expectedKobo: expectedAmountKobo, receivedKobo: verification.amount, reference },
        });

        return NextResponse.json(
          {
            success: false,
            status: "amount_mismatch",
            message: "Payment amount verification failed. Paid amount does not match the order total.",
          },
          { status: 400 }
        );
      }

      // 4. Centralized Payment Finalization
      const finalResult = await finalizeSuccessfulPayment({
        orderId: order.id,
        amount: verification.amount / 100,
        reference: verification.reference,
        method: "PAYSTACK",
        provider: "PAYSTACK",
        verifiedBy: "SYSTEM_PAYSTACK_CALLBACK",
        channel: verification.channel,
        rawResponse: verification as any,
      });

      // Dispatch real-time in-app admin alert & customer/admin emails strictly once
      if (finalResult.success && !finalResult.alreadyProcessed) {
        await notifyOrderPaid(order.id);
      }

      const updatedOrder = finalResult.order;
      const orderId = updatedOrder?.id || order.id;
      const orderNumber = updatedOrder?.orderNumber || order.orderNumber || orderId.slice(0, 8).toUpperCase();
      const amountInNaira = verification.amount / 100;

      const updatedItems = (updatedOrder?.items || order.items || []).map((item: any) => ({
        productId: item.product?.id || item.productId || item.id,
        selectedSize: item.selectedSize || item.size || "Standard",
        quantity: item.quantity,
      }));

      return NextResponse.json({
        success: true,
        status: "paid",
        orderId,
        orderNumber,
        amount: amountInNaira,
        reference: verification.reference,
        email: updatedOrder?.customer?.email || order.customer?.email || verification.customer?.email || "",
        paidAt: verification.paid_at,
        channel: verification.channel,
        items: updatedItems,
      });
    }

    // If transaction failed or was abandoned
    await updateOrderStatus(reference, "failed", reference);

    return NextResponse.json(
      {
        success: false,
        status: "failed",
        message: verification.gateway_response || "Payment was not successful",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Paystack verification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
