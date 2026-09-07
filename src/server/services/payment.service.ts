import "server-only";
import crypto from "node:crypto";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client";
import { logAuditEvent } from "./audit.service";
import { publishAdminNotification } from "./notification.service";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    console.error(
      "[Paystack Error] Missing PAYSTACK_SECRET_KEY in server environment. " +
      "If running locally, set PAYSTACK_SECRET_KEY in .env.local. " +
      "If deployed to Vercel, add PAYSTACK_SECRET_KEY in Vercel Project Settings > Environment Variables."
    );
    throw new Error(
      process.env.NODE_ENV === "production"
        ? "Payment service is temporarily unavailable. Please contact the administrator or try again shortly."
        : "PAYSTACK_SECRET_KEY is not defined in environment variables. Please check .env.local"
    );
  }
  return key;
}

export interface InitializePaystackParams {
  email: string;
  amountInKobo: number; // e.g. 39000 * 100
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface InitializePaystackResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface VerifyPaystackResponse {
  status: string;
  reference: string;
  amount: number; // in kobo
  currency: string;
  gateway_response: string;
  paid_at?: string;
  channel?: string;
  customer?: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  metadata?: {
    orderId?: string;
    orderNumber?: string;
    [key: string]: unknown;
  };
}

/**
 * Initialize a transaction on Paystack
 */
export async function initializePaystackTransaction(
  params: InitializePaystackParams
): Promise<InitializePaystackResponse> {
  const secretKey = getSecretKey();

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountInKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(
      data.message || `Paystack initialization failed with status ${response.status}`
    );
  }

  return data.data as InitializePaystackResponse;
}

/**
 * Verify a transaction on Paystack
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<VerifyPaystackResponse> {
  const secretKey = getSecretKey();

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(
      data.message || `Paystack verification failed with status ${response.status}`
    );
  }

  return data.data as VerifyPaystackResponse;
}

/**
 * Validates the Paystack webhook signature using HMAC SHA512 (constant-time comparison)
 */
export function validatePaystackSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false;

  try {
    const secretKey = getSecretKey();
    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");

    const hashBuffer = Buffer.from(hash, "utf-8");
    const signatureBuffer = Buffer.from(signature, "utf-8");

    if (hashBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(hashBuffer, signatureBuffer);
  } catch {
    return false;
  }
}

export interface FinalizePaymentParams {
  orderId: string;
  amount: number; // in Naira (NGN)
  reference: string;
  method: "PAYSTACK" | "BANK_TRANSFER" | "CASH" | "POS";
  provider: "PAYSTACK" | "INTERNAL";
  verifiedBy: string; // admin user ID, email, or "SYSTEM_PAYSTACK"
  channel?: string;
  notes?: string;
  rawResponse?: Record<string, unknown>;
}

/**
 * Centralized, Authoritative Payment Finalizer
 * 
 * Used by:
 * 1. Online Paystack Webhook (charge.success)
 * 2. Storefront Paystack Callback (/checkout/verify)
 * 3. Social Media Paystack Payments
 * 4. Manual Cash / Bank Transfer / POS Payment Confirmations
 * 
 * Guarantees atomic reservation conversion, physical stock deduction,
 * stock movement logging, and order payment state transitions.
 */
export async function finalizeSuccessfulPayment(
  params: FinalizePaymentParams,
  externalTx?: Prisma.TransactionClient
) {
  const executeFinalization = async (tx: Prisma.TransactionClient) => {
    // 1. Lock the order row
    await tx.$queryRaw`SELECT id FROM orders WHERE id = ${params.orderId} FOR UPDATE`;

    const order = await tx.order.findUnique({
      where: { id: params.orderId },
      include: {
        payments: true,
        items: true,
        reservations: true,
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${params.orderId}`);
    }

    // 2. Idempotency Check on Payment Reference
    const existingPayment = await tx.payment.findUnique({
      where: { reference: params.reference },
    });

    if (existingPayment && existingPayment.status === "PAID") {
      return {
        success: true,
        alreadyProcessed: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.paymentStatus,
      };
    }

    // 3. Upsert Payment Record
    const paidAtDate = new Date();
    await tx.payment.upsert({
      where: { reference: params.reference },
      update: {
        amount: params.amount,
        status: "PAID",
        paidAt: paidAtDate,
        verifiedBy: params.verifiedBy,
        verifiedAt: paidAtDate,
        notes: params.notes,
        rawResponse: params.rawResponse as Prisma.InputJsonValue,
      },
      create: {
        orderId: order.id,
        amount: params.amount,
        currency: "NGN",
        method: ["PAYSTACK", "BANK_TRANSFER", "CASH", "POS"].includes(params.method) ? params.method : "BANK_TRANSFER",
        provider: params.provider === "PAYSTACK" ? "PAYSTACK" : "INTERNAL",
        status: "PAID",
        reference: params.reference,
        paidAt: paidAtDate,
        verifiedBy: params.verifiedBy,
        verifiedAt: paidAtDate,
        notes: params.notes,
        rawResponse: params.rawResponse as Prisma.InputJsonValue,
      },
    });

    // 4. Calculate Authoritative Cumulative Paid Amount
    const previousPaidSum = order.payments
      .filter((p) => p.status === "PAID" && p.reference !== params.reference)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const newAmountPaid = previousPaidSum + params.amount;
    const orderTotal = Number(order.total);
    const isFullyPaid = newAmountPaid >= orderTotal;
    const newPaymentStatus = isFullyPaid ? "PAID" : "PARTIALLY_PAID";

    let hasExpiredReservation = false;

    // 5. Inventory Resolution (Active Reservation Conversion vs Direct Stock Deduction)
    if (isFullyPaid && !order.stockDeducted) {
      const activeReservations = order.reservations.filter((r) => r.status === "ACTIVE");

      if (activeReservations.length > 0) {
        const now = new Date();
        // Sort product IDs deterministically to eliminate deadlock risks
        const productIds = Array.from(new Set(activeReservations.map((r) => r.productId))).sort();
        for (const pid of productIds) {
          await tx.$queryRaw`SELECT id, stock FROM products WHERE id = ${pid} FOR UPDATE`;
        }

        for (const res of activeReservations) {
          if (res.expiresAt <= now) {
            hasExpiredReservation = true;
            // Do not silently deduct stock for expired reservation
            continue;
          }

          const product = await tx.product.findUnique({
            where: { id: res.productId },
            select: { id: true, name: true, stock: true },
          });

          if (!product || product.stock < res.quantity) {
            throw new Error(
              `Insufficient physical stock to finalize payment for "${product?.name || res.productId}". Physical stock: ${product?.stock || 0}, Required: ${res.quantity}.`
            );
          }

          const previousStock = product.stock;
          const newStock = previousStock - res.quantity;

          // A. Decrement physical stock
          await tx.product.update({
            where: { id: res.productId },
            data: { stock: newStock },
          });

          // B. Convert reservation
          await tx.inventoryReservation.update({
            where: { id: res.id },
            data: { status: "CONVERTED" },
          });

          // C. Record SALE stock movement in ledger
          await tx.stockMovement.create({
            data: {
              productId: res.productId,
              orderId: order.id,
              quantity: -res.quantity,
              type: "SALE",
              previousStock,
              newStock,
              reference: order.orderNumber,
              reason: `Sale finalized via ${params.method}`,
              createdBy: params.verifiedBy,
            },
          });
        }
      } else {
        // Direct physical stock deduction for orders created without prior reservations (e.g. online checkout or walk-in)
        const uniqueProductIds = Array.from(
          new Set(order.items.map((i) => i.productId).filter((id): id is string => Boolean(id)))
        ).sort();

        for (const pid of uniqueProductIds) {
          await tx.$queryRaw`SELECT id, stock FROM products WHERE id = ${pid} FOR UPDATE`;
        }

        for (const item of order.items) {
          if (!item.productId) continue;

          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { id: true, name: true, stock: true },
          });

          if (!product || product.stock < item.quantity) {
            throw new Error(
              `Insufficient physical stock to finalize payment for "${item.productName}". Available: ${product?.stock || 0}, Required: ${item.quantity}.`
            );
          }

          const previousStock = product.stock;
          const newStock = previousStock - item.quantity;

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: newStock },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              orderId: order.id,
              quantity: -item.quantity,
              type: "SALE",
              previousStock,
              newStock,
              reference: order.orderNumber,
              reason: `Sale finalized via ${params.method}`,
              createdBy: params.verifiedBy,
            },
          });
        }
      }
    }

    // 6. Update Order Aggregate State
    const updatedNotes = hasExpiredReservation
      ? `${order.internalNotes ? order.internalNotes + " | " : ""}⚠️ [ALERT: Payment finalized but one or more inventory reservations had expired. Verify physical stock.]`
      : order.internalNotes;

    const newOrderStatus =
      isFullyPaid && (order.status === "PENDING" || (order.status as string) === "PAID")
        ? "CONFIRMED"
        : order.status;

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: newPaymentStatus,
        status: newOrderStatus,
        amountPaid: newAmountPaid,
        paidAt: isFullyPaid ? (order.paidAt || paidAtDate) : order.paidAt,
        paymentMethod: params.method,
        paymentReference: params.reference,
        stockDeducted: isFullyPaid && !hasExpiredReservation ? true : order.stockDeducted,
        internalNotes: updatedNotes,
      },
      include: {
        items: true,
        payments: true,
        customer: true,
      },
    });

    // 7. Log Audit Event
    await logAuditEvent({
      action: "PAYMENT_FINALIZED",
      entity: "Order",
      entityId: order.id,
      userId: params.verifiedBy,
      details: {
        amount: params.amount,
        method: params.method,
        provider: params.provider,
        reference: params.reference,
        newPaymentStatus,
        orderStatus: newOrderStatus,
        isFullyPaid,
        hasExpiredReservation,
      },
    });

    if (hasExpiredReservation) {
      publishAdminNotification({
        type: "SECURITY_ALERT",
        priority: "urgent",
        title: `🚨 Payment Received with Expired Hold: #${order.orderNumber}`,
        message: `Payment of ₦${params.amount.toLocaleString()} was verified, but inventory reservation expired. Staff resolution required for inventory allocation on order #${order.orderNumber}.`,
        link: `/admin/orders?search=${encodeURIComponent(order.orderNumber || "")}`,
        entityId: order.id,
        entityType: "Order",
        metadata: {
          orderNumber: order.orderNumber,
          amount: params.amount,
          reference: params.reference,
          reason: "EXPIRED_RESERVATION_PAYMENT",
        },
      }).catch(() => {});
    }

    return {
      success: true,
      alreadyProcessed: false,
      hasExpiredReservation,
      order: updatedOrder,
      newPaymentStatus,
      newOrderStatus,
    };
  };

  if (externalTx) {
    return await executeFinalization(externalTx);
  } else {
    return await db.$transaction(executeFinalization, { maxWait: 20000, timeout: 60000 });
  }
}
