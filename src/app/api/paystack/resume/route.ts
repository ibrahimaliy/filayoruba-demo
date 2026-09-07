import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { initializePaystackTransaction } from "@/server/services/payment.service";
import { getCustomerFromRequest } from "@/server/customer-auth";
import { checkRateLimit, getClientIp } from "@/server/rate-limit";

interface ResumeRequestBody {
  orderId?: string;
  orderNumber?: string;
  email?: string;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limit = checkRateLimit(`paystack_resume:${ip}`, 15, 5 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { message: `Too many payment retry requests. Please wait ${limit.resetSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body: ResumeRequestBody = await req.json();
    const orderIdentifier = (body.orderId || body.orderNumber || "").trim();

    if (!orderIdentifier) {
      return NextResponse.json(
        { message: "Order ID or Order Number is required to resume payment." },
        { status: 400 }
      );
    }

    // 1. Look up the order in PostgreSQL
    const order = await db.order.findFirst({
      where: {
        OR: [
          { id: orderIdentifier },
          { orderNumber: { equals: orderIdentifier, mode: "insensitive" } },
        ],
        isArchived: false,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Order not found or has been removed." },
        { status: 404 }
      );
    }

    // 2. Authorize requester (session customer or matching email for guest)
    const sessionCustomer = await getCustomerFromRequest(req);
    const orderCustomerEmail = (order.customerEmail || "").trim().toLowerCase();
    const sessionEmail = (sessionCustomer?.email || "").trim().toLowerCase();
    const isOwnerSession = Boolean(sessionEmail && orderCustomerEmail && sessionEmail === orderCustomerEmail);

    const guestEmail = (body.email || "").trim().toLowerCase();
    const isGuestEmailMatch = Boolean(
      guestEmail && orderCustomerEmail && guestEmail === orderCustomerEmail
    );

    if (!isOwnerSession && !isGuestEmailMatch) {
      return NextResponse.json(
        {
          message:
            "Authentication required. Please provide the checkout email matching this order or log in.",
        },
        { status: 403 }
      );
    }

    // 3. Check status: only uncompleted orders can resume payment
    if (
      order.status === "CONFIRMED" ||
      order.status === "PAID" ||
      order.paymentStatus === "PAID" ||
      order.status === "CRAFTING" ||
      order.status === "SHIPPED" ||
      order.status === "DELIVERED"
    ) {
      return NextResponse.json(
        {
          message: "This order has already been paid for and is in fulfillment.",
          status: "ALREADY_PAID",
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
        { status: 400 }
      );
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { message: "This order has been cancelled. Please place a new order from our catalog." },
        { status: 400 }
      );
    }

    // 4. Verify inventory for all items in order
    for (const item of order.items) {
      if (item.product && item.product.stock < item.quantity) {
        return NextResponse.json(
          {
            message: `Insufficient inventory for ${item.productName}. Currently ${item.product.stock} available.`,
          },
          { status: 409 }
        );
      }
    }

    // 5. Generate a unique new payment reference for this attempt
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const reference = `trad_resume_${timestamp}_${randomSuffix}`;

    // Update order with the latest reference
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentReference: reference,
      },
    });

    // 6. Callback URL
    const origin = req.headers.get("origin") || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const callbackUrl = `${origin}/checkout/verify`;

    // 7. Amount in Kobo
    const amountInKobo = Math.round(Number(order.total) * 100);

    // 8. Initialize Paystack Transaction
    const paystackResponse = await initializePaystackTransaction({
      email: order.customerEmail || guestEmail || "guest@filayoruba.com",
      amountInKobo,
      reference,
      callbackUrl,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.customerPhone,
        itemCount: order.items.length,
        resumedPayment: true,
      },
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackResponse.authorization_url,
      accessCode: paystackResponse.access_code,
      reference,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.total,
    });
  } catch (error) {
    console.error("Paystack resume payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to resume payment";
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
