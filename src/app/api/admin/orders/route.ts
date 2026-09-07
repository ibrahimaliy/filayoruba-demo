import { NextResponse } from "next/server";
import {
  listAllOrders,
  listTrashedOrders,
  listOrdersPaginated,
  createManualOrder,
} from "@/server/services/order.service";
import { getAdminSession } from "@/server/auth";
import { logAuditEvent } from "@/server/services/audit.service";
import { getClientIp } from "@/server/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin authentication required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status")?.toLowerCase();
    const paymentStatus = searchParams.get("paymentStatus")?.toLowerCase();
    const channel = searchParams.get("channel")?.toUpperCase();
    const fulfillmentType = searchParams.get("fulfillmentType")?.toLowerCase();
    const search = searchParams.get("search")?.trim();
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    // If explicit pagination requested
    if (pageParam || limitParam) {
      const page = pageParam ? parseInt(pageParam, 10) : 1;
      const limit = limitParam ? parseInt(limitParam, 10) : 20;

      const paginated = await listOrdersPaginated({
        includeArchived: status === "trash",
        status: status && status !== "trash" ? status : undefined,
        paymentStatus: paymentStatus && paymentStatus !== "all" ? paymentStatus : undefined,
        channel: channel && channel !== "ALL" ? channel : undefined,
        fulfillmentType: fulfillmentType && fulfillmentType !== "all" ? fulfillmentType : undefined,
        search,
        startDate,
        endDate,
        page,
        limit,
      });

      return NextResponse.json(paginated, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      });
    }

    // Default list query (filtered in SQL)
    const orders =
      status === "trash"
        ? await listTrashedOrders(search)
        : await listAllOrders({
            status: status && status !== "all" ? status : undefined,
            paymentStatus: paymentStatus && paymentStatus !== "all" ? paymentStatus : undefined,
            channel: channel && channel !== "ALL" ? channel : undefined,
            fulfillmentType: fulfillmentType && fulfillmentType !== "all" ? fulfillmentType : undefined,
            search,
            startDate,
            endDate,
          });

    return NextResponse.json(orders, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("Admin orders error:", error);
    return NextResponse.json(
      { message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin authentication required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const clientRequestId =
      req.headers.get("x-client-request-id") || body.clientRequestId || undefined;

    if (!body.customer || !body.customer.firstName || !body.customer.lastName) {
      return NextResponse.json(
        { message: "Customer first and last name are required." },
        { status: 400 }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { message: "At least one product item is required to create an order." },
        { status: 400 }
      );
    }

    const createdOrder = await createManualOrder({
      clientRequestId,
      salesChannel: body.salesChannel || "WHATSAPP",
      fulfillmentType: body.fulfillmentType || "delivery",
      customer: {
        firstName: body.customer.firstName.trim(),
        lastName: body.customer.lastName.trim(),
        phone: body.customer.phone ? body.customer.phone.trim() : undefined,
        email: body.customer.email ? body.customer.email.trim() : undefined,
        instagramHandle: body.customer.instagramHandle ? body.customer.instagramHandle.trim() : undefined,
        xHandle: body.customer.xHandle ? body.customer.xHandle.trim() : undefined,
      },
      address: body.address
        ? {
            address: body.address.address,
            city: body.address.city,
            state: body.address.state,
            country: body.address.country || "Nigeria",
          }
        : undefined,
      items: body.items.map((i: any) => ({
        productId: i.productId,
        size: i.size || "Standard",
        quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
      })),
      discount: Math.max(0, parseFloat(body.discount) || 0),
      shippingFee: Math.max(0, parseFloat(body.shippingFee) || 0),
      paymentStatus: body.paymentStatus || "UNPAID",
      paymentMethod: body.paymentMethod || "CASH",
      paymentReference: body.paymentReference ? body.paymentReference.trim() : undefined,
      reservationHours: body.reservationHours ? parseInt(body.reservationHours, 10) : 4,
      internalNotes: body.internalNotes ? body.internalNotes.trim() : undefined,
      createdById: session.id,
    });

    await logAuditEvent({
      action: "MANUAL_ORDER_CREATED",
      entity: "Order",
      entityId: createdOrder.id,
      userId: session.id,
      userEmail: session.email,
      ipAddress: ip,
      details: {
        orderNumber: createdOrder.orderNumber,
        salesChannel: createdOrder.salesChannel,
        paymentStatus: createdOrder.paymentStatus,
        total: createdOrder.total,
        clientRequestId,
      },
    });

    return NextResponse.json(
      { success: true, order: createdOrder },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to create manual order:", error);
    const msg = error?.message || "Failed to create order.";
    const status = msg.includes("Identity Conflict") || msg.includes("Insufficient") ? 400 : 500;
    return NextResponse.json({ message: msg }, { status });
  }
}
