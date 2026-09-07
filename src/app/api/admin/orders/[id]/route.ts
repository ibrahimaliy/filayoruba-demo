import { NextResponse } from "next/server";
import {
  getOrder,
  updateOrderStatus,
  verifyAndSyncOrderWithPaystack,
  trashOrder,
  restoreOrder,
  permanentDeleteOrder,
  cancelCustomerOrder,
} from "@/server/services/order.service";
import { OrderStatus } from "@/types/order";
import { getAdminSession } from "@/server/auth";
import { logAuditEvent } from "@/server/services/audit.service";
import { getClientIp } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

export async function PATCH(
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
    const { status, action } = body;

    const existing = await getOrder(id);
    if (!existing) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (action === "restore") {
      await restoreOrder(id);
      await logAuditEvent({
        action: "ORDER_RESTORED",
        entity: "Order",
        entityId: id,
        userId: session.id,
        userEmail: session.email,
        ipAddress: ip,
        details: { orderNumber: existing.orderNumber, status: existing.status },
      });
      return NextResponse.json({ success: true, message: "Order restored from trash" });
    }

    if (action === "trash") {
      await trashOrder(id);
      await logAuditEvent({
        action: "ORDER_TRASHED",
        entity: "Order",
        entityId: id,
        userId: session.id,
        userEmail: session.email,
        ipAddress: ip,
        details: { orderNumber: existing.orderNumber, status: existing.status },
      });
      return NextResponse.json({ success: true, message: "Order moved to trash" });
    }

    if (action === "verify-paystack") {
      const result = await verifyAndSyncOrderWithPaystack(id);
      await logAuditEvent({
        action: "ORDER_PAYSTACK_VERIFY",
        entity: "Order",
        entityId: id,
        userId: session.id,
        userEmail: session.email,
        ipAddress: ip,
        details: {
          orderNumber: existing.orderNumber,
          success: result.success,
          newStatus: result.status,
        },
      });

      if (!result.success) {
        return NextResponse.json(
          { message: result.message, status: result.status },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: result.message,
        order: result.order,
      });
    }

    if (action === "cancel" || status === "cancelled") {
      const result = await cancelCustomerOrder({
        orderIdOrNumber: id,
        reason: (body.reason as string) || "Cancelled by Admin",
        notes: (body.notes as string) || undefined,
        cancelledBy: "admin",
        adminUserId: session.id,
        adminEmail: session.email,
        ipAddress: ip,
      });

      if (!result.success) {
        return NextResponse.json({ message: result.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        order: result.order,
      });
    }

    if (status) {
      const validStatuses: OrderStatus[] = [
        "pending",
        "confirmed",
        "paid",
        "crafting",
        "shipped",
        "delivered",
        "cancelled",
        "failed",
      ];

      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }

      const isFulfillmentStage = ["crafting", "shipped", "delivered"].includes(status);
      const isAlreadyInFulfillment = ["crafting", "shipped", "delivered"].includes(existing.status);
      const isUnpaid =
        existing.paymentStatus !== "paid" &&
        existing.status !== "paid" &&
        existing.status !== "confirmed";
      const allowOverride = Boolean(body.overridePaymentGuard || body.force);

      // Guard: Do not allow advancing unpaid pending orders to crafting or dispatch unless already in fulfillment or overridden by admin
      if (isUnpaid && isFulfillmentStage && !isAlreadyInFulfillment && !allowOverride) {
        return NextResponse.json(
          {
            message: "Payment must be confirmed (via Paystack, Bank Transfer, Cash, or POS) before advancing to crafting or dispatch.",
            requiresOverride: true,
          },
          { status: 400 }
        );
      }

      // If user marks order as "paid" directly:
      if (status === "paid" && isUnpaid) {
        let paymentMethod = body.paymentMethod || existing.paymentMethod || "BANK_TRANSFER";

        if (paymentMethod === "PAYSTACK" && existing.paymentReference && !allowOverride) {
          const verifyResult = await verifyAndSyncOrderWithPaystack(id);
          if (verifyResult.success && verifyResult.status === "paid") {
            return NextResponse.json({
              success: true,
              order: verifyResult.order,
            });
          }
          // If Paystack verification was not completed, fallback to Bank Transfer if explicitly requested or with override
          if (!body.paymentMethod && !allowOverride) {
            return NextResponse.json(
              {
                message: verifyResult.message || "Paystack verification was not successful for this order. You can confirm it manually via Bank Transfer, Cash, or POS.",
                requiresManualPayment: true,
              },
              { status: 400 }
            );
          }
          paymentMethod = body.paymentMethod || "BANK_TRANSFER";
        }

        // Internal payment verification (Bank Transfer, Cash, POS)
        const updated = await updateOrderStatus(
          id,
          "paid",
          body.paymentReference,
          paymentMethod,
          body.channel
        );
        return NextResponse.json({
          success: true,
          order: updated,
        });
      }

      const updated = await updateOrderStatus(id, status);

      await logAuditEvent({
        action: "ORDER_STATUS_UPDATE",
        entity: "Order",
        entityId: id,
        userId: session.id,
        userEmail: session.email,
        ipAddress: ip,
        details: {
          orderNumber: existing.orderNumber,
          fromStatus: existing.status,
          toStatus: status,
        },
      });

      if (!updated) {
        return NextResponse.json(
          { message: "Order not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        order: updated,
      });
    }

    return NextResponse.json({ message: "Invalid patch payload" }, { status: 400 });
  } catch (error) {
    console.error("Update order status/action error:", error);
    return NextResponse.json(
      { message: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(req.url);
    const isHard = searchParams.get("hard") === "true";

    const existing = await getOrder(id);
    if (!existing) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (isHard) {
      if (session.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { message: "Access denied. Only Super Admins can permanently wipe order records." },
          { status: 403 }
        );
      }

      await permanentDeleteOrder(id);
      await logAuditEvent({
        action: "ORDER_HARD_DELETED",
        entity: "Order",
        entityId: id,
        userId: session.id,
        userEmail: session.email,
        ipAddress: ip,
        details: { orderNumber: existing.orderNumber, total: existing.total },
      });

      return NextResponse.json({ success: true, message: "Order permanently deleted" });
    } else {
      await trashOrder(id);
      await logAuditEvent({
        action: "ORDER_TRASHED",
        entity: "Order",
        entityId: id,
        userId: session.id,
        userEmail: session.email,
        ipAddress: ip,
        details: { orderNumber: existing.orderNumber },
      });

      return NextResponse.json({ success: true, message: "Order moved to trash" });
    }
  } catch (error) {
    console.error("Delete order error:", error);
    return NextResponse.json(
      { message: "Failed to delete order" },
      { status: 500 }
    );
  }
}

