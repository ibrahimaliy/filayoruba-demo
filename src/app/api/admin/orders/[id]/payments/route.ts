import { NextResponse } from "next/server";
import { getAdminSession } from "@/server/auth";
import { recordOrderPayment, getOrder } from "@/server/services/order.service";
import { logAuditEvent } from "@/server/services/audit.service";
import { getClientIp } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin authentication required." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    const order = await getOrder(id);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { message: "Valid positive payment amount is required." },
        { status: 400 }
      );
    }

    const method = body.method || "BANK_TRANSFER";
    const reference = body.reference ? body.reference.trim() : undefined;
    const notes = body.notes ? body.notes.trim() : undefined;

    const result = await recordOrderPayment({
      orderId: order.id,
      amount,
      method,
      reference,
      verifiedBy: session.id || session.email || "admin",
      notes,
    });

    await logAuditEvent({
      action: "MANUAL_PAYMENT_RECORDED",
      entity: "Order",
      entityId: order.id,
      userId: session.id || undefined,
      userEmail: session.email,
      ipAddress: ip,
      details: {
        orderNumber: order.orderNumber,
        amount,
        method,
        reference: result.order?.paymentReference,
        newPaymentStatus: result.newPaymentStatus,
      },
    });

    const updatedOrder = await getOrder(order.id);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      alreadyProcessed: result.alreadyProcessed,
      hasExpiredReservation: result.hasExpiredReservation,
    });
  } catch (error: any) {
    console.error("Failed to record manual payment:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to record payment" },
      { status: 500 }
    );
  }
}
