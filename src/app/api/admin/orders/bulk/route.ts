import { NextResponse } from "next/server";
import {
  bulkTrashOrders,
  bulkRestoreOrders,
  bulkPermanentDeleteOrders,
  bulkUpdateOrderStatus,
  bulkVerifyAndSyncOrdersWithPaystack,
  emptyOrderTrash,
} from "@/server/services/order.service";
import { getAdminSession } from "@/server/auth";
import { logAuditEvent } from "@/server/services/audit.service";
import { getClientIp } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { action, ids = [], status } = body;

    switch (action) {
      case "trash": {
        const count = await bulkTrashOrders(ids);
        await logAuditEvent({
          action: "BULK_ORDERS_TRASH",
          entity: "Order",
          userId: session.id,
          userEmail: session.email,
          ipAddress: ip,
          details: { count, ids },
        });
        return NextResponse.json({ success: true, count, message: `${count} order(s) moved to trash.` });
      }

      case "restore": {
        const count = await bulkRestoreOrders(ids);
        await logAuditEvent({
          action: "BULK_ORDERS_RESTORE",
          entity: "Order",
          userId: session.id,
          userEmail: session.email,
          ipAddress: ip,
          details: { count, ids },
        });
        return NextResponse.json({ success: true, count, message: `${count} order(s) restored.` });
      }

      case "delete": {
        if (session.role !== "SUPER_ADMIN") {
          return NextResponse.json(
            { message: "Access denied. Only Super Admins can permanently wipe orders." },
            { status: 403 }
          );
        }

        const count = await bulkPermanentDeleteOrders(ids);
        await logAuditEvent({
          action: "BULK_ORDERS_HARD_DELETE",
          entity: "Order",
          userId: session.id,
          userEmail: session.email,
          ipAddress: ip,
          details: { count, ids },
        });
        return NextResponse.json({ success: true, count, message: `${count} order(s) permanently deleted.` });
      }

      case "verify-paystack": {
        const { verifiedCount, totalChecked } = await bulkVerifyAndSyncOrdersWithPaystack(ids);
        await logAuditEvent({
          action: "BULK_ORDERS_PAYSTACK_VERIFY",
          entity: "Order",
          userId: session.id,
          userEmail: session.email,
          ipAddress: ip,
          details: { totalChecked, verifiedCount, ids },
        });
        return NextResponse.json({
          success: true,
          verifiedCount,
          totalChecked,
          message: `Checked ${totalChecked} order(s) with Paystack: ${verifiedCount} confirmed paid.`,
        });
      }

      case "cancel": {
        const count = await bulkUpdateOrderStatus(ids, "cancelled");
        await logAuditEvent({
          action: "BULK_ORDERS_CANCEL",
          entity: "Order",
          userId: session.id,
          userEmail: session.email,
          ipAddress: ip,
          details: { count, ids, stockRestored: true },
        });
        return NextResponse.json({
          success: true,
          count,
          message: `${count} order(s) successfully cancelled and stock restored.`,
        });
      }

      case "status": {
        if (!status) {
          return NextResponse.json({ message: "Status is required" }, { status: 400 });
        }
        const count = await bulkUpdateOrderStatus(ids, status);
        const isFulfillment = ["crafting", "shipped", "delivered"].includes(status);
        const note = isFulfillment && count < ids.length ? ` (${ids.length - count} unpaid order(s) skipped)` : "";
        
        await logAuditEvent({
          action: "BULK_ORDERS_STATUS_UPDATE",
          entity: "Order",
          userId: session.id,
          userEmail: session.email,
          ipAddress: ip,
          details: { newStatus: status, count, targetIds: ids },
        });

        return NextResponse.json({
          success: true,
          count,
          message: `Status updated to ${status.toUpperCase()} for ${count} eligible order(s)${note}.`,
        });
      }

      case "empty-trash": {
        if (session.role !== "SUPER_ADMIN") {
          return NextResponse.json(
            { message: "Access denied. Only Super Admins can empty the trash." },
            { status: 403 }
          );
        }

        const count = await emptyOrderTrash();
        await logAuditEvent({
          action: "ORDERS_EMPTY_TRASH",
          entity: "Order",
          userId: session.id,
          userEmail: session.email,
          ipAddress: ip,
          details: { count },
        });
        return NextResponse.json({ success: true, count, message: `Trash emptied (${count} orders removed).` });
      }

      default:
        return NextResponse.json({ message: "Invalid bulk action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Bulk orders action error:", error);
    return NextResponse.json({ message: "Failed to perform bulk action" }, { status: 500 });
  }
}

