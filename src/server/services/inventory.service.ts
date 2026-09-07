import "server-only";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client";

export type PrismaTx = Prisma.TransactionClient;

/**
 * Calculates current real-time available stock for a product
 * Available Stock = Physical Stock - Active Unexpired Reservations
 */
export async function getAvailableStock(
  productId: string,
  tx?: PrismaTx
): Promise<{ physicalStock: number; reservedStock: number; availableStock: number }> {
  const client = tx || db;

  const product = await client.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  });

  if (!product) {
    return { physicalStock: 0, reservedStock: 0, availableStock: 0 };
  }

  const now = new Date();
  const aggregate = await client.inventoryReservation.aggregate({
    where: {
      productId,
      status: "ACTIVE",
      expiresAt: { gt: now },
    },
    _sum: {
      quantity: true,
    },
  });

  const physicalStock = Math.max(0, product.stock);
  const reservedStock = aggregate._sum.quantity || 0;
  const availableStock = Math.max(0, physicalStock - reservedStock);

  return { physicalStock, reservedStock, availableStock };
}

export interface ReservationItemInput {
  productId: string;
  quantity: number;
}

/**
 * Creates temporary inventory reservations atomically with deterministic row-level locks
 * to prevent deadlocks and overselling.
 */
export async function createReservations(
  items: ReservationItemInput[],
  orderId: string,
  expiresAt: Date,
  reservedBy: string,
  reason: string,
  tx: PrismaTx
): Promise<{ success: boolean; message?: string }> {
  if (!items.length) return { success: true };

  // 1. Sort product IDs deterministically to prevent PostgreSQL deadlocks across concurrent requests
  const uniqueProductIds = Array.from(new Set(items.map((i) => i.productId))).sort();

  // 2. Lock product rows in deterministic order
  for (const pid of uniqueProductIds) {
    await tx.$queryRaw`SELECT id, stock FROM products WHERE id = ${pid} FOR UPDATE`;
  }

  // 3. Aggregate requested quantities per product
  const requestedMap = new Map<string, number>();
  for (const item of items) {
    requestedMap.set(item.productId, (requestedMap.get(item.productId) || 0) + item.quantity);
  }

  // 4. Verify available stock for each product
  const now = new Date();
  for (const [pid, requestedQty] of requestedMap.entries()) {
    const product = await tx.product.findUnique({
      where: { id: pid },
      select: { name: true, stock: true },
    });

    if (!product) {
      throw new Error(`Product not found: ${pid}`);
    }

    const reservedAgg = await tx.inventoryReservation.aggregate({
      where: {
        productId: pid,
        status: "ACTIVE",
        expiresAt: { gt: now },
      },
      _sum: { quantity: true },
    });

    const activeReserved = reservedAgg._sum.quantity || 0;
    const available = Math.max(0, product.stock - activeReserved);

    if (available < requestedQty) {
      throw new Error(
        `Insufficient available inventory for "${product.name}". Only ${available} available (${product.stock} physical, ${activeReserved} reserved).`
      );
    }
  }

  // 5. Insert reservations (Reservations do NOT create physical StockMovement records)
  for (const item of items) {
    await tx.inventoryReservation.create({
      data: {
        productId: item.productId,
        orderId,
        quantity: item.quantity,
        status: "ACTIVE",
        expiresAt,
        reservedBy,
        reason,
      },
    });
  }

  return { success: true };
}

/**
 * Converts active reservations to confirmed sales, decrements physical stock, and creates SALE stock movements.
 * Enforces that reservations must be strictly ACTIVE and unexpired.
 */
export async function convertReservationToSale(
  orderId: string,
  orderNumber: string,
  operatorId: string,
  tx: PrismaTx
): Promise<{ success: boolean; expiredCount: number }> {
  // 1. Fetch all reservations for this order
  const reservations = await tx.inventoryReservation.findMany({
    where: { orderId },
  });

  if (!reservations.length) {
    return { success: true, expiredCount: 0 };
  }

  // 2. Sort unique product IDs to lock deterministically
  const productIds = Array.from(new Set(reservations.map((r) => r.productId))).sort();
  for (const pid of productIds) {
    await tx.$queryRaw`SELECT id, stock FROM products WHERE id = ${pid} FOR UPDATE`;
  }

  const now = new Date();
  let expiredCount = 0;

  for (const res of reservations) {
    // If already converted in a concurrent thread or retry, skip idempotently
    if (res.status === "CONVERTED") continue;

    // Check if reservation expired or was released
    if (res.status !== "ACTIVE" || res.expiresAt <= now) {
      expiredCount++;
      continue;
    }

    const product = await tx.product.findUnique({
      where: { id: res.productId },
      select: { id: true, name: true, stock: true },
    });

    if (!product) continue;

    // Invariant: Physical stock can never become negative
    if (product.stock < res.quantity) {
      throw new Error(
        `Physical stock invariant violation: Cannot decrement ${res.quantity} from ${product.name} (Current: ${product.stock}).`
      );
    }

    const previousStock = product.stock;
    const newStock = previousStock - res.quantity;

    // A. Decrement physical stock
    await tx.product.update({
      where: { id: res.productId },
      data: { stock: newStock },
    });

    // B. Mark reservation as CONVERTED
    await tx.inventoryReservation.update({
      where: { id: res.id },
      data: { status: "CONVERTED" },
    });

    // C. Record actual physical SALE movement in audit ledger
    await tx.stockMovement.create({
      data: {
        productId: res.productId,
        orderId,
        quantity: -res.quantity,
        type: "SALE",
        previousStock,
        newStock,
        reference: orderNumber,
        reason: `Sale confirmed for order ${orderNumber}`,
        createdBy: operatorId,
      },
    });
  }

  return { success: expiredCount === 0, expiredCount };
}

/**
 * Releases reservations back to the available pool without altering physical stock
 */
export async function releaseReservation(
  orderId: string,
  reason: string,
  tx: PrismaTx
): Promise<number> {
  const result = await tx.inventoryReservation.updateMany({
    where: {
      orderId,
      status: "ACTIVE",
    },
    data: {
      status: "RELEASED",
    },
  });

  return result.count;
}

/**
 * Idempotent expiration worker: marks active expired reservations as EXPIRED
 */
export async function expireStaleReservations(): Promise<number> {
  const result = await db.inventoryReservation.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: new Date() },
    },
    data: {
      status: "EXPIRED",
    },
  });

  return result.count;
}
