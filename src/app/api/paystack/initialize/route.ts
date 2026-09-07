import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { createVerifiedOrder, saveOrder } from "@/server/services/order.service";
import { initializePaystackTransaction } from "@/server/services/payment.service";
import { CartItem } from "@/types/cart";
import { CustomerInfo, ShippingAddress } from "@/types/checkout";
import { checkRateLimit, getClientIp } from "@/server/rate-limit";

interface InitializeRequestBody {
  items: CartItem[];
  customer: CustomerInfo;
  address: ShippingAddress;
  shipping: number;
  orderId?: string;
}

export async function POST(req: Request) {
  try {
    // 1. Rate limit checkout initialization (10 attempts per 5 mins per IP)
    const ip = getClientIp(req);
    const limit = checkRateLimit(`paystack_init:${ip}`, 10, 5 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { message: `Too many payment initializations. Please wait ${limit.resetSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body: InitializeRequestBody = await req.json();

    if (!body.items?.length) {
      return NextResponse.json(
        { message: "Cart cannot be empty" },
        { status: 400 }
      );
    }

    if (!body.customer?.email) {
      return NextResponse.json(
        { message: "Customer email is required" },
        { status: 400 }
      );
    }

    const customerEmailNormalized = body.customer.email.trim().toLowerCase();

    // 2. Check if client provided an active pending order ID to reuse (idempotent retries)
    let existingOrder: { id: string; orderNumber: string } | null = null;
    if (body.orderId) {
      const found = await db.order.findUnique({
        where: { id: body.orderId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          customerEmail: true,
        },
      });

      if (
        found &&
        found.status === "PENDING" &&
        found.paymentStatus === "PENDING" &&
        (found.customerEmail || "").trim().toLowerCase() === customerEmailNormalized
      ) {
        existingOrder = { id: found.id, orderNumber: found.orderNumber };
      }
    }

    // 3. Generate unique payment reference for this gateway session
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const reference = `trad_${timestamp}_${randomSuffix}`;

    // 4. Verify catalog prices, stock availability, and compute authoritative totals
    const verifiedOrder = await createVerifiedOrder(
      body.items,
      body.customer,
      body.address,
      body.shipping || 0,
      reference
    );

    // If updating an active pending order for this customer, preserve order ID and number
    if (existingOrder) {
      verifiedOrder.id = existingOrder.id;
      verifiedOrder.orderNumber = existingOrder.orderNumber;
    }

    // 5. Determine callback URL & amount in Kobo (1 NGN = 100 Kobo)
    const origin =
      req.headers.get("origin") ||
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const callbackUrl = `${origin}/checkout/verify`;
    const amountInKobo = Math.round(verifiedOrder.total * 100);

    // 6. INITIALIZE PAYSTACK TRANSACTION FIRST
    // Crucial: If Paystack fails (e.g. missing API keys or network error), execution halts here.
    // No order is written to PostgreSQL and no admin notification is dispatched.
    const paystackResponse = await initializePaystackTransaction({
      email: body.customer.email,
      amountInKobo,
      reference,
      callbackUrl,
      metadata: {
        orderId: verifiedOrder.id,
        orderNumber: verifiedOrder.orderNumber,
        customerName: `${body.customer.firstName} ${body.customer.lastName}`,
        phone: body.customer.phone,
        itemCount: body.items.length,
      },
    });

    // 7. Persist or update the order ONLY once Paystack initialization succeeds
    const savedOrder = await saveOrder(verifiedOrder, {
      isRetry: Boolean(existingOrder),
    });

    return NextResponse.json({
      authorizationUrl: paystackResponse.authorization_url,
      accessCode: paystackResponse.access_code,
      reference,
      orderId: savedOrder.id,
      orderNumber: savedOrder.orderNumber,
      amount: savedOrder.total,
    });
  } catch (error) {
    console.error("Paystack initialization error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to initialize payment";
    return NextResponse.json(
      { message: errorMessage },
      { status: 400 }
    );
  }
}
