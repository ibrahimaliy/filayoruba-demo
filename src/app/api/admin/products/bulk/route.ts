import { NextResponse } from "next/server";
import {
  bulkTrashProducts,
  bulkRestoreProducts,
  bulkPermanentDeleteProducts,
  bulkUpdateStock,
  bulkUpdateFeatured,
  emptyProductTrash,
} from "@/server/services/product.service";
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
    const { action, ids = [], stock, featured } = body;

    switch (action) {
      case "trash": {
        const count = await bulkTrashProducts(ids);
        await logAuditEvent({
          action: "BULK_PRODUCTS_TRASH",
          entity: "Product",
          userId: session.id,
          userEmail: session.email,
          ipAddress: ip,
          details: { count, ids },
        });
        return NextResponse.json({ success: true, count, message: `${count} item(s) moved to trash.` });
      }

      case "restore": {
        const count = await bulkRestoreProducts(ids);
        await logAuditEvent({
          action: "BULK_PRODUCTS_RESTORE",
          entity: "Product",
          userId: session.id,
          userEmail: session.email,
          ipAddress: ip,
          details: { count, ids },
        });
        return NextResponse.json({ success: true, count, message: `${count} item(s) restored.` });
      }

      case "delete": {
        if (session.role !== "SUPER_ADMIN") {
          return NextResponse.json(
            { message: "Access denied. Only Super Admins can permanently wipe products." },
            { status: 403 }
          );
        }

        const count = await bulkPermanentDeleteProducts(ids);
        await logAuditEvent({
          action: "BULK_PRODUCTS_HARD_DELETE",
          entity: "Product",
          userId: session.id,
          userEmail: session.email,
          ipAddress: ip,
          details: { count, ids },
        });
        return NextResponse.json({ success: true, count, message: `${count} item(s) permanently deleted.` });
      }

      case "stock": {
        const count = await bulkUpdateStock(ids, Number(stock));
        await logAuditEvent({
          action: "BULK_PRODUCTS_STOCK_UPDATE",
          entity: "Product",
          userId: session.id,
          userEmail: session.email,
          ipAddress: ip,
          details: { count, ids, stock },
        });
        return NextResponse.json({ success: true, count, message: `Stock updated for ${count} item(s).` });
      }

      case "featured": {
        const count = await bulkUpdateFeatured(ids, Boolean(featured));
        await logAuditEvent({
          action: "BULK_PRODUCTS_FEATURED_UPDATE",
          entity: "Product",
          userId: session.id,
          userEmail: session.email,
          ipAddress: ip,
          details: { count, ids, featured: Boolean(featured) },
        });
        return NextResponse.json({ success: true, count, message: `Featured status updated for ${count} item(s).` });
      }

      case "empty-trash": {
        if (session.role !== "SUPER_ADMIN") {
          return NextResponse.json(
            { message: "Access denied. Only Super Admins can empty the product trash." },
            { status: 403 }
          );
        }

        const count = await emptyProductTrash();
        await logAuditEvent({
          action: "PRODUCTS_EMPTY_TRASH",
          entity: "Product",
          userId: session.id,
          userEmail: session.email,
          ipAddress: ip,
          details: { count },
        });
        return NextResponse.json({ success: true, count, message: `Trash emptied (${count} items removed).` });
      }

      default:
        return NextResponse.json({ message: "Invalid bulk action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Bulk products action error:", error);
    return NextResponse.json({ message: "Failed to perform bulk action" }, { status: 500 });
  }
}

