import "server-only";
import { db } from "@/server/db";
import { Order, OrderStatus, PaymentStatus, SalesChannel, FulfillmentType, RefundStatus } from "@/types/order";
import { CartItem } from "@/types/cart";
import { CustomerInfo, ShippingAddress } from "@/types/checkout";
import { Prisma } from "@prisma/client";
import { incrementProductStock } from "./product.service";
import { verifyPaystackTransaction, finalizeSuccessfulPayment } from "./payment.service";
import { createReservations, releaseReservation } from "./inventory.service";
import { normalizePhoneNumber } from "@/lib/phone";
import { shippingZones } from "@/data/shipping";
import { publishAdminNotification } from "./notification.service";
import { logAuditEvent } from "./audit.service";
import {
  sendOrderAddressUpdatedEmail,
  sendOrderConfirmationEmail,
  sendAdminNewOrderAlertEmail,
  sendOrderStatusUpdateEmail,
} from "./email.service";
import {
  queueOrderConfirmationEmail,
  queueOrderStatusUpdateEmail,
  queueAdminNewOrderAlertEmail,
} from "@/server/queue";

export const orderInclude = {
  items: {
    include: {
      product: true,
    },
  },
  customer: true,
  address: true,
  payments: {
    orderBy: { createdAt: "desc" as const },
  },
  reservations: {
    orderBy: { createdAt: "desc" as const },
  },
  transactions: true,
} as const;

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

export function mapPrismaOrderToDomain(record: OrderWithRelations): Order {
  const items: CartItem[] = record.items.map((item) => ({
    product: {
      id: item.productId || item.id,
      slug: item.productSlug || item.productId || "fila-cap",
      name: item.productName,
      description: item.product?.description || "Authentic handcrafted Yoruba Fila cap.",
      price: Number(item.unitPrice),
      images: item.productImage ? [item.productImage] : (item.product?.images || []),
      colors: item.product?.colors || [],
      sizes: item.product?.sizes || [item.size],
      stock: item.product?.stock ?? 5,
      featured: item.product?.featured ?? false,
      rating: item.product?.rating ?? 4.8,
      reviews: [],
      collection: {
        name: "Yoruba Heritage",
        slug: "heritage",
      },
    },
    quantity: item.quantity,
    selectedSize: item.size,
  }));

  const orderStatusMap: Record<string, OrderStatus> = {
    CONFIRMED: "confirmed",
    PENDING: "pending",
    CRAFTING: "crafting",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
    PAID: "confirmed",
    FAILED: "failed",
  };

  const paymentStatusMap: Record<string, PaymentStatus> = {
    UNPAID: "unpaid",
    PENDING: "pending",
    PAID: "paid",
    PARTIALLY_PAID: "partially_paid",
    FAILED: "failed",
    REFUNDED: "refunded",
  };

  const totalNum = Number(record.total);
  const amountPaidNum = Number(record.amountPaid || 0);

  return {
    id: record.id,
    orderNumber: record.orderNumber,
    salesChannel: (record.salesChannel as SalesChannel) || "ONLINE_STORE",
    status: orderStatusMap[record.status] || "pending",
    paymentStatus: paymentStatusMap[record.paymentStatus] || "unpaid",
    fulfillmentType: (record.fulfillmentType?.toLowerCase() as FulfillmentType) || "delivery",
    refundStatus: (record.refundStatus?.toLowerCase() as RefundStatus) || "not_refunded",
    items,
    subtotal: Number(record.subtotal),
    discount: Number(record.discount || 0),
    shipping: Number(record.shippingFee),
    total: totalNum,
    amountPaid: amountPaidNum,
    amountDue: Math.max(0, totalNum - amountPaidNum),
    amountRefunded: Number(record.amountRefunded || 0),
    customer: {
      id: record.customer?.id,
      firstName: record.customer?.firstName || record.customerName.split(" ")[0] || "Valued",
      lastName: record.customer?.lastName || record.customerName.split(" ").slice(1).join(" ") || "Customer",
      email: record.customerEmail || record.customer?.email || undefined,
      phone: record.customerPhone || record.customer?.phone || undefined,
      instagramHandle: record.customer?.instagramHandle || undefined,
      xHandle: record.customer?.xHandle || undefined,
    },
    address: {
      address: record.shippingAddress || record.address?.address || undefined,
      city: record.shippingCity || record.address?.city || undefined,
      state: record.shippingState || record.address?.state || undefined,
      country: record.address?.country || "Nigeria",
    },
    payments: (record.payments || []).map((p) => ({
      id: p.id,
      orderId: p.orderId,
      amount: Number(p.amount),
      currency: p.currency,
      method: p.method as any,
      provider: p.provider as any,
      status: paymentStatusMap[p.status] || "pending",
      reference: p.reference || undefined,
      paidAt: p.paidAt ? p.paidAt.toISOString() : undefined,
      verifiedBy: p.verifiedBy || undefined,
      verifiedAt: p.verifiedAt ? p.verifiedAt.toISOString() : undefined,
      notes: p.notes || undefined,
      createdAt: p.createdAt.toISOString(),
    })),
    paymentReference: record.paymentReference || undefined,
    paymentMethod: record.paymentMethod || undefined,
    createdAt: record.createdAt.toISOString(),
    paidAt: record.paidAt ? record.paidAt.toISOString() : undefined,
    clientRequestId: record.clientRequestId || undefined,
    createdById: record.createdById || undefined,
    internalNotes: record.internalNotes || undefined,
  };
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `FY-${year}-${random}`;
}

/**
 * Server-authoritative shipping fee computation based on destination zone or state
 * Defends against client-side shipping fee manipulation.
 */
export function calculateAuthoritativeShipping(
  address: ShippingAddress & { shippingZoneId?: string },
  requestedShipping?: number
): number {
  if (address.shippingZoneId) {
    const zone = shippingZones.find((z) => z.id === address.shippingZoneId);
    if (zone) return zone.price;
  }

  const stateLower = (address.state || "").toLowerCase().trim();
  if (stateLower.includes("lagos")) return 2000;
  if (["ogun", "oyo", "osun", "ondo", "ekiti"].some((s) => stateLower.includes(s))) return 3000;
  if (["enugu", "anambra", "imo", "abia", "ebonyi"].some((s) => stateLower.includes(s))) return 4000;
  if (["rivers", "delta", "edo", "akwa ibom", "cross river", "bayelsa"].some((s) => stateLower.includes(s))) return 4000;
  if (["abuja", "fct", "kogi", "kwara", "nasarawa", "niger", "plateau", "benue"].some((s) => stateLower.includes(s))) return 5000;
  if (["kano", "kaduna", "katsina", "kebbi", "sokoto", "zamfara", "jigawa"].some((s) => stateLower.includes(s))) return 6000;
  if (["borno", "yobe", "adamawa", "bauchi", "gombe", "taraba"].some((s) => stateLower.includes(s))) return 6000;

  return typeof requestedShipping === "number" && requestedShipping >= 2000 ? requestedShipping : 2000;
}

export function createOrder(
  items: CartItem[],
  customer: CustomerInfo,
  address: ShippingAddress,
  shipping: number,
  paymentReference?: string
): Order {
  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const shippingFee = calculateAuthoritativeShipping(address, shipping);

  return {
    id: crypto.randomUUID(),
    orderNumber: generateOrderNumber(),
    items,
    subtotal,
    shipping: shippingFee,
    total: subtotal + shippingFee,
    customer,
    address,
    status: "pending",
    salesChannel: "ONLINE_STORE",
    paymentStatus: "unpaid",
    fulfillmentType: "delivery",
    discount: 0,
    amountPaid: 0,
    amountDue: subtotal + shippingFee,
    amountRefunded: 0,
    refundStatus: "not_refunded",
    payments: [],
    paymentReference,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Creates an order by validating all item prices and inventory directly from PostgreSQL
 * Defends against client-side price tampering.
 */
export async function createVerifiedOrder(
  rawItems: { product: { id: string; name?: string }; quantity: number; selectedSize: string }[],
  customer: CustomerInfo,
  address: ShippingAddress,
  shipping: number,
  paymentReference?: string
): Promise<Order> {
  if (!rawItems?.length) {
    throw new Error("Cart cannot be empty");
  }

  // 1. Fetch authoritative product data from PostgreSQL
  const productIds = rawItems.map((i) => i.product.id);
  const dbProducts = await db.product.findMany({
    where: { id: { in: productIds }, isArchived: false },
  });

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  // 2. Validate existence, stock availability, and compute authoritative subtotal
  const verifiedItems: CartItem[] = [];
  let subtotal = 0;

  for (const item of rawItems) {
    const dbProduct = productMap.get(item.product.id);
    if (!dbProduct) {
      throw new Error(`Product is unavailable or no longer exists in catalog.`);
    }

    if (dbProduct.stock < item.quantity) {
      throw new Error(`Insufficient inventory for "${dbProduct.name}". Only ${dbProduct.stock} available.`);
    }

    const verifiedPrice = Number(dbProduct.price);
    subtotal += verifiedPrice * item.quantity;

    verifiedItems.push({
      product: {
        id: dbProduct.id,
        slug: dbProduct.slug,
        name: dbProduct.name,
        description: dbProduct.description || "Authentic handcrafted Yoruba Fila cap.",
        price: verifiedPrice,
        images: dbProduct.images,
        colors: dbProduct.colors,
        sizes: dbProduct.sizes,
        stock: dbProduct.stock,
        featured: dbProduct.featured,
        rating: dbProduct.rating,
        reviews: [],
        collection: { name: "Yoruba Heritage", slug: "heritage" },
      },
      quantity: item.quantity,
      selectedSize: item.selectedSize,
    });
  }

  const shippingFee = calculateAuthoritativeShipping(address, shipping);
  const total = subtotal + shippingFee;

  return {
    id: crypto.randomUUID(),
    orderNumber: generateOrderNumber(),
    items: verifiedItems,
    subtotal,
    shipping: shippingFee,
    total,
    customer,
    address,
    status: "pending",
    salesChannel: "ONLINE_STORE",
    paymentStatus: "unpaid",
    fulfillmentType: "delivery",
    discount: 0,
    amountPaid: 0,
    amountDue: total,
    amountRefunded: 0,
    refundStatus: "not_refunded",
    payments: [],
    paymentReference,
    createdAt: new Date().toISOString(),
  };
}

export async function saveOrder(
  order: Order,
  options?: { isRetry?: boolean }
): Promise<Order> {
  const customer = await db.customer.upsert({
    where: { email: order.customer.email },
    update: {
      firstName: order.customer.firstName,
      lastName: order.customer.lastName,
      phone: order.customer.phone || undefined,
    },
    create: {
      email: order.customer.email,
      firstName: order.customer.firstName,
      lastName: order.customer.lastName,
      phone: order.customer.phone || undefined,
    },
  });

  const address = order.address
    ? await db.address.create({
        data: {
          customerId: customer.id,
          address: order.address.address || "",
          city: order.address.city || "",
          state: order.address.state || "",
          country: order.address.country || "Nigeria",
        },
      })
    : null;

  const orderNumber = order.orderNumber || generateOrderNumber();

  const savedOrder = await db.order.upsert({
    where: { id: order.id },
    update: {
      orderNumber,
      status: "PENDING",
      subtotal: order.subtotal,
      shippingFee: order.shipping,
      total: order.total,
      customerEmail: order.customer.email,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      customerPhone: order.customer.phone,
      shippingAddress: order.address?.address || "Showroom Pickup",
      shippingCity: order.address?.city || "Lagos",
      shippingState: order.address?.state || "Lagos",
      paymentReference: order.paymentReference,
      paymentMethod: order.paymentMethod,
      isArchived: false,
      items: {
        deleteMany: {},
        create: order.items.map((item) => ({
          productId: item.product.id.length > 5 ? item.product.id : undefined,
          productName: item.product.name,
          productSlug: item.product.slug,
          productImage: item.product.images?.[0] || "",
          size: item.selectedSize,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: item.product.price * item.quantity,
        })),
      },
    },
    create: {
      id: order.id,
      orderNumber,
      salesChannel: "ONLINE_STORE",
      status: "PENDING",
      paymentStatus: "PENDING",
      fulfillmentType: "DELIVERY",
      refundStatus: "NOT_REFUNDED",
      subtotal: order.subtotal,
      discount: 0,
      shippingFee: order.shipping,
      total: order.total,
      amountPaid: 0,
      customerId: customer.id,
      customerEmail: order.customer.email,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      customerPhone: order.customer.phone,
      addressId: address?.id,
      shippingAddress: order.address?.address || "Showroom Pickup",
      shippingCity: order.address?.city || "Lagos",
      shippingState: order.address?.state || "Lagos",
      paymentReference: order.paymentReference,
      paymentMethod: order.paymentMethod,
      isArchived: false,
      items: {
        create: order.items.map((item) => ({
          productId: item.product.id.length > 5 ? item.product.id : undefined,
          productName: item.product.name,
          productSlug: item.product.slug,
          productImage: item.product.images?.[0] || "",
          size: item.selectedSize,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: item.product.price * item.quantity,
        })),
      },
    },
    include: orderInclude,
  });

  if (order.paymentReference) {
    await db.paymentTransaction.upsert({
      where: { reference: order.paymentReference },
      update: {
        amount: order.total,
        status: "PENDING",
      },
      create: {
        orderId: savedOrder.id,
        reference: order.paymentReference,
        gateway: "PAYSTACK",
        status: "PENDING",
        amount: order.total,
        currency: "NGN",
      },
    });
  }

  const domainOrder = mapPrismaOrderToDomain(savedOrder);

  // Publish real-time notification only for brand new order initializations (skip on retries)
  if (!options?.isRetry) {
    publishAdminNotification({
      type: "ORDER_CREATED",
      priority: "low",
      title: `New Order Initialized: #${domainOrder.orderNumber}`,
      message: `${domainOrder.customer.firstName} ${domainOrder.customer.lastName} placed an order for ₦${domainOrder.total.toLocaleString()} (${domainOrder.items.length} items).`,
      link: `/admin/orders?search=${encodeURIComponent(domainOrder.orderNumber || "")}`,
      entityId: domainOrder.id,
      entityType: "Order",
      metadata: {
        orderNumber: domainOrder.orderNumber,
        total: domainOrder.total,
        customerName: `${domainOrder.customer.firstName} ${domainOrder.customer.lastName}`,
      },
    }).catch(() => {});
  }

  return domainOrder;
}

export interface CreateManualOrderItem {
  productId: string;
  size?: string;
  selectedSize?: string;
  quantity: number;
}

export interface CreateManualOrderInput {
  clientRequestId?: string;
  salesChannel?: "WHATSAPP" | "INSTAGRAM" | "X" | "WALK_IN";
  channel?: "WHATSAPP" | "INSTAGRAM" | "X" | "WALK_IN";
  fulfillmentType?: "delivery" | "pickup" | "DELIVERY" | "PICKUP";
  customer: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    instagramHandle?: string;
    xHandle?: string;
  };
  address?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  items: CreateManualOrderItem[];
  discount?: number;
  shippingFee?: number;
  paymentStatus?: "UNPAID" | "PENDING" | "PAID";
  paymentMethod?: "PAYSTACK" | "BANK_TRANSFER" | "CASH" | "POS";
  paymentReference?: string;
  paymentTiming?: string;
  reservationHours?: number; // e.g. 4, 24, 48
  reservationMinutes?: number;
  internalNotes?: string;
  createdById?: string;
  adminUserId?: string;
  adminEmail?: string;
}

/**
 * Creates manual orders across Social (WhatsApp, Instagram, X) and In-Store (Walk-in) channels.
 * Features:
 *  - Deterministic multi-product row locking to prevent deadlocks
 *  - E.164 phone normalization and identity conflict detection
 *  - Authoritative server pricing and discount validation
 *  - Idempotent execution via clientRequestId
 *  - Atomic centralized payment finalization for immediate payments
 *  - Non-stock-altering inventory reservation holds for pending orders
 */
export async function createManualOrder(input: CreateManualOrderInput): Promise<Order> {
  if (!input.items || input.items.length === 0) {
    throw new Error("Cannot create an order with zero items.");
  }

  // 1. Primary Idempotency Check on clientRequestId
  if (input.clientRequestId) {
    const existing = await db.order.findUnique({
      where: { clientRequestId: input.clientRequestId },
      include: orderInclude,
    });
    if (existing) {
      return mapPrismaOrderToDomain(existing);
    }
  }

  // 2. Normalize and check for customer identity conflict
  const rawPhone = input.customer.phone ? input.customer.phone.trim() : "";
  const normalizedPhone = rawPhone ? normalizePhoneNumber(rawPhone) : undefined;
  const normalizedEmail = input.customer.email ? input.customer.email.trim().toLowerCase() : undefined;

  if (normalizedPhone && normalizedEmail) {
    const [byPhone, byEmail] = await Promise.all([
      db.customer.findFirst({ where: { phone: normalizedPhone } }),
      db.customer.findUnique({ where: { email: normalizedEmail } }),
    ]);

    if (byPhone && byEmail && byPhone.id !== byEmail.id) {
      throw new Error(
        `Identity Conflict: The phone number (${normalizedPhone}) is registered to ${byPhone.firstName} ${byPhone.lastName}, but the email (${normalizedEmail}) belongs to ${byEmail.firstName} ${byEmail.lastName}. Please verify customer details before proceeding.`
      );
    }
  }

  return await db.$transaction(
    async (tx) => {
      // Secondary idempotency check inside transaction
      if (input.clientRequestId) {
        const existing = await tx.order.findUnique({
          where: { clientRequestId: input.clientRequestId },
          include: orderInclude,
        });
        if (existing) {
          return mapPrismaOrderToDomain(existing);
        }
      }

      // 3. Customer Lookup or Upsert
      let customerId: string | undefined;
      if (normalizedEmail) {
        const cust = await tx.customer.upsert({
          where: { email: normalizedEmail },
          update: {
            firstName: input.customer.firstName,
            lastName: input.customer.lastName,
            phone: normalizedPhone || undefined,
            instagramHandle: input.customer.instagramHandle || undefined,
            xHandle: input.customer.xHandle || undefined,
          },
          create: {
            email: normalizedEmail,
            firstName: input.customer.firstName,
            lastName: input.customer.lastName,
            phone: normalizedPhone || undefined,
            instagramHandle: input.customer.instagramHandle || undefined,
            xHandle: input.customer.xHandle || undefined,
          },
        });
        customerId = cust.id;
      } else if (normalizedPhone) {
        // Deterministic transaction lock on normalized phone hash prevents concurrent duplicate customer creation
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${normalizedPhone}))`;

        let cust = await tx.customer.findFirst({ where: { phone: normalizedPhone } });
        if (!cust) {
          cust = await tx.customer.create({
            data: {
              phone: normalizedPhone,
              firstName: input.customer.firstName,
              lastName: input.customer.lastName,
              instagramHandle: input.customer.instagramHandle || undefined,
              xHandle: input.customer.xHandle || undefined,
            },
          });
        } else {
          cust = await tx.customer.update({
            where: { id: cust.id },
            data: {
              firstName: input.customer.firstName,
              lastName: input.customer.lastName,
              instagramHandle: input.customer.instagramHandle || cust.instagramHandle,
              xHandle: input.customer.xHandle || cust.xHandle,
            },
          });
        }
        customerId = cust.id;
      }

      // 4. Address
      let addressId: string | undefined;
      if (input.fulfillmentType === "delivery" && input.address?.address) {
        const addr = await tx.address.create({
          data: {
            customerId,
            address: input.address.address,
            city: input.address.city || "Lagos",
            state: input.address.state || "Lagos",
            country: input.address.country || "Nigeria",
          },
        });
        addressId = addr.id;
      }

      // 5. Deterministic Row Locking & Authoritative Pricing
      // Sort product IDs deterministically to prevent PostgreSQL deadlocks across concurrent orders
      const uniqueProductIds = Array.from(new Set(input.items.map((i) => i.productId))).sort();
      for (const pid of uniqueProductIds) {
        await tx.$queryRaw`SELECT id, price, stock, name FROM products WHERE id = ${pid} FOR UPDATE`;
      }

      let subtotal = 0;
      const orderItemsData: Array<{
        productId: string;
        productName: string;
        productSlug: string;
        productImage: string;
        size: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }> = [];

      for (const item of input.items) {
        const dbProd = await tx.product.findUnique({ where: { id: item.productId } });
        if (!dbProd) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        const unitPrice = Number(dbProd.price);
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;
        orderItemsData.push({
          productId: dbProd.id,
          productName: dbProd.name,
          productSlug: dbProd.slug,
          productImage: dbProd.images?.[0] || "",
          size: item.size || item.selectedSize || "Standard",
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        });
      }

      const isPickup = String(input.fulfillmentType || "").toLowerCase() === "pickup";
      const channel = input.salesChannel || input.channel || "WHATSAPP";
      const paymentStatus = input.paymentStatus || (input.paymentTiming === "IMMEDIATE" ? "PAID" : "PENDING");
      const isPaidImmediately = paymentStatus === "PAID";
      const paymentMethod = input.paymentMethod || "BANK_TRANSFER";

      const discount = Math.max(0, input.discount || 0);
      const shippingFee = isPickup ? 0 : Math.max(0, input.shippingFee || 0);
      const total = Math.max(0, subtotal - discount + shippingFee);

      const orderNumber = generateOrderNumber();

      // Safely validate createdById foreign key against adminUser table
      let validCreatedById: string | undefined = undefined;
      const rawAdminId = input.createdById || input.adminUserId;
      if (rawAdminId) {
        const adminUser = await tx.adminUser.findUnique({ where: { id: rawAdminId } });
        if (adminUser) {
          validCreatedById = adminUser.id;
        }
      }

      // 6. Create Order record
      const created = await tx.order.create({
        data: {
          orderNumber,
          salesChannel: channel,
          status: isPaidImmediately ? "CONFIRMED" : "PENDING",
          paymentStatus: isPaidImmediately ? "PAID" : paymentStatus,
          fulfillmentType: isPickup ? "PICKUP" : "DELIVERY",
          refundStatus: "NOT_REFUNDED",
          subtotal,
          discount,
          shippingFee,
          total,
          amountPaid: 0, // Will be updated atomically by payment finalizer if paid
          customerId,
          customerEmail: normalizedEmail,
          customerName: `${input.customer.firstName} ${input.customer.lastName}`,
          customerPhone: normalizedPhone,
          addressId,
          shippingAddress: isPickup ? "In-Store Pickup" : input.address?.address,
          shippingCity: isPickup ? "Storefront" : input.address?.city,
          shippingState: isPickup ? "Lagos" : input.address?.state,
          paymentMethod: paymentMethod,
          paymentReference: input.paymentReference,
          clientRequestId: input.clientRequestId,
          createdById: validCreatedById,
          internalNotes: input.internalNotes,
          items: {
            create: orderItemsData,
          },
        },
        include: orderInclude,
      });

      // 7. Payment or Reservation Hold
      if (isPaidImmediately) {
        const ref =
          input.paymentReference ||
          `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await finalizeSuccessfulPayment(
          {
            orderId: created.id,
            amount: total,
            reference: ref,
            method: paymentMethod,
            provider: paymentMethod === "PAYSTACK" ? "PAYSTACK" : "INTERNAL",
            verifiedBy: input.createdById || input.adminUserId || "ADMIN",
            notes: `Immediate payment recorded for ${channel} order`,
          },
          tx
        );
      } else {
        const minutes = input.reservationMinutes || (input.reservationHours ? input.reservationHours * 60 : 4 * 60);
        const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
        await createReservations(
          input.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          created.id,
          expiresAt,
          input.createdById || input.adminUserId || "ADMIN",
          `Reservation hold for ${channel} order #${orderNumber}`,
          tx
        );
      }

      // Reload fresh state with payments / reservations
      const finalOrder = await tx.order.findUniqueOrThrow({
        where: { id: created.id },
        include: orderInclude,
      });

      return mapPrismaOrderToDomain(finalOrder);
    },
    { maxWait: 20000, timeout: 60000 }
  );
}

export async function recordOrderPayment(params: {
  orderId: string;
  amount: number;
  method: "PAYSTACK" | "BANK_TRANSFER" | "CASH" | "POS";
  reference?: string;
  verifiedBy: string;
  notes?: string;
}) {
  const ref =
    params.reference ||
    `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const finalResult = await finalizeSuccessfulPayment({
    orderId: params.orderId,
    amount: params.amount,
    reference: ref,
    method: params.method,
    provider: params.method === "PAYSTACK" ? "PAYSTACK" : "INTERNAL",
    verifiedBy: params.verifiedBy,
    notes: params.notes,
  });

  if (finalResult.success && !finalResult.alreadyProcessed && finalResult.newPaymentStatus === "PAID") {
    await notifyOrderPaid(params.orderId);
  }

  return finalResult;
}

/**
 * Records a partial or full refund for an order while keeping PaymentStatus independent.
 * A paid order that is partially refunded maintains paymentStatus = PAID with refundStatus = PARTIALLY_REFUNDED.
 */
export async function recordOrderRefund(params: {
  orderId: string;
  amount: number;
  reason?: string;
  refundedBy: string;
}): Promise<Order> {
  return await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id, "amountPaid", "amountRefunded", "paymentStatus" FROM orders WHERE id = ${params.orderId} FOR UPDATE`;

    const order = await tx.order.findUniqueOrThrow({
      where: { id: params.orderId },
      include: orderInclude,
    });

    const currentPaid = Number(order.amountPaid);
    const currentRefunded = Number(order.amountRefunded);
    const newRefunded = currentRefunded + params.amount;

    if (params.amount <= 0) {
      throw new Error("Refund amount must be greater than zero.");
    }

    if (newRefunded > currentPaid) {
      throw new Error(
        `Cannot refund ₦${params.amount.toLocaleString()}. Total refunds (₦${newRefunded.toLocaleString()}) would exceed total paid (₦${currentPaid.toLocaleString()}).`
      );
    }

    const newRefundStatus: "PARTIALLY_REFUNDED" | "REFUNDED" =
      newRefunded >= currentPaid ? "REFUNDED" : "PARTIALLY_REFUNDED";

    // Keep paymentStatus as PAID if order was paid; refund status explicitly tracks refunds independently
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        amountRefunded: newRefunded,
        refundStatus: newRefundStatus,
      },
      include: orderInclude,
    });

    await logAuditEvent({
      action: "ORDER_REFUNDED",
      entity: "Order",
      entityId: order.id,
      userId: params.refundedBy,
      details: {
        amount: params.amount,
        totalRefunded: newRefunded,
        totalPaid: currentPaid,
        refundStatus: newRefundStatus,
        paymentStatus: order.paymentStatus,
        reason: params.reason,
      },
    });

    return mapPrismaOrderToDomain(updated);
  }, { maxWait: 15000, timeout: 30000 });
}

export async function attachCancellationDetails(domainOrder: Order, orderId: string): Promise<Order> {
  if (domainOrder.status !== "cancelled") return domainOrder;
  try {
    const audit = await db.auditLog.findFirst({
      where: {
        entity: "Order",
        entityId: orderId,
        action: { in: ["ORDER_CANCELLED_BY_CUSTOMER", "ORDER_CANCELLED_BY_ADMIN", "ORDER_STATUS_UPDATE"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (audit?.details && typeof audit.details === "object") {
      const d = audit.details as Record<string, any>;
      domainOrder.cancelledAt = audit.createdAt.toISOString();
      domainOrder.cancelledBy =
        d.cancelledBy?.toLowerCase() === "customer" || audit.action === "ORDER_CANCELLED_BY_CUSTOMER"
          ? "customer"
          : "admin";
      domainOrder.cancelReason = d.reason || d.cancelReason || "Cancelled by request";
      domainOrder.stockRestored = d.stockRestored ?? true;
    }
  } catch {
    // Non-blocking
  }
  return domainOrder;
}

export async function attachBulkCancellationDetails(domainOrders: Order[]): Promise<Order[]> {
  const cancelledOrders = domainOrders.filter((o) => o.status === "cancelled");
  if (cancelledOrders.length === 0) return domainOrders;

  const cancelledIds = cancelledOrders.map((o) => o.id);
  try {
    const auditLogs = await db.auditLog.findMany({
      where: {
        entity: "Order",
        entityId: { in: cancelledIds },
        action: { in: ["ORDER_CANCELLED_BY_CUSTOMER", "ORDER_CANCELLED_BY_ADMIN", "ORDER_STATUS_UPDATE"] },
      },
      orderBy: { createdAt: "desc" },
    });

    const auditMap = new Map<string, any>();
    for (const log of auditLogs) {
      if (log.entityId && !auditMap.has(log.entityId)) {
        auditMap.set(log.entityId, log);
      }
    }

    for (const order of cancelledOrders) {
      const audit = auditMap.get(order.id);
      if (audit?.details && typeof audit.details === "object") {
        const d = audit.details as Record<string, any>;
        order.cancelledAt = audit.createdAt.toISOString();
        order.cancelledBy =
          d.cancelledBy?.toLowerCase() === "customer" || audit.action === "ORDER_CANCELLED_BY_CUSTOMER"
            ? "customer"
            : "admin";
        order.cancelReason = d.reason || d.cancelReason || "Cancelled by request";
        order.stockRestored = d.stockRestored ?? true;
      }
    }
  } catch {
    // Non-blocking
  }

  return domainOrders;
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const record = await db.order.findFirst({
    where: {
      OR: [{ id }, { orderNumber: id }, { paymentReference: id }],
    },
    include: orderInclude,
  });

  if (record) {
    const domainOrder = mapPrismaOrderToDomain(record);
    return await attachCancellationDetails(domainOrder, record.id);
  }
  return undefined;
}

export async function getOrderByReference(reference: string): Promise<Order | undefined> {
  const record = await db.order.findFirst({
    where: {
      OR: [
        { paymentReference: reference },
        { orderNumber: reference },
        { id: reference },
        { payments: { some: { reference } } },
      ],
    },
    include: orderInclude,
  });

  if (record) {
    const domainOrder = mapPrismaOrderToDomain(record);
    return await attachCancellationDetails(domainOrder, record.id);
  }
  return undefined;
}

/**
 * Authoritative dispatcher for confirmed/paid orders:
 * 1. Emits real-time in-app admin alert
 * 2. Dispatches customer receipt email
 * 3. Dispatches store admin notification email
 * 4. Resiliently logs errors without breaking order completion
 */
export async function notifyOrderPaid(orderOrId: Order | string): Promise<void> {
  try {
    const domainOrder = typeof orderOrId === "string" 
      ? (await getOrder(orderOrId) || await getOrderByReference(orderOrId))
      : orderOrId;

    if (!domainOrder) {
      console.warn(`[notifyOrderPaid] Order not found for notification dispatch:`, orderOrId);
      return;
    }

    // 1. In-app admin notification
    publishAdminNotification({
      type: "ORDER_PAID",
      priority: "urgent",
      title: `🎉 New Confirmed Order: #${domainOrder.orderNumber}`,
      message: `₦${domainOrder.total.toLocaleString()} confirmed from ${domainOrder.customer.firstName} ${domainOrder.customer.lastName}.`,
      link: `/admin/orders?search=${encodeURIComponent(domainOrder.orderNumber || "")}`,
      entityId: domainOrder.id,
      entityType: "Order",
      metadata: {
        orderNumber: domainOrder.orderNumber,
        total: domainOrder.total,
        customerName: `${domainOrder.customer.firstName} ${domainOrder.customer.lastName}`,
        paymentMethod: domainOrder.paymentMethod,
        itemsCount: domainOrder.items.length,
      },
    }).catch((err) => console.error("[notifyOrderPaid] Admin bell notification failed:", err));

    // 2. Direct transactional emails (Customer confirmation receipt & Admin alert)
    const [customerResult, adminResult] = await Promise.allSettled([
      sendOrderConfirmationEmail(domainOrder),
      sendAdminNewOrderAlertEmail(domainOrder),
    ]);

    if (customerResult.status === "fulfilled" && !customerResult.value.success) {
      console.warn(`⚠️ [notifyOrderPaid] Customer email not delivered:`, customerResult.value.error);
    }
    if (adminResult.status === "fulfilled" && !adminResult.value.success) {
      console.warn(`⚠️ [notifyOrderPaid] Admin email not delivered:`, adminResult.value.error);
    }
  } catch (error) {
    console.error(`❌ [notifyOrderPaid] Error dispatching notifications:`, error);
  }
}

export async function updateOrderStatus(
  idOrReference: string,
  status: OrderStatus,
  paymentReference?: string,
  paymentMethod?: string,
  channel?: string
): Promise<Order | undefined> {
  const prismaStatusMap: Record<OrderStatus, "PENDING" | "CONFIRMED" | "PAID" | "CRAFTING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "FAILED"> = {
    pending: "PENDING",
    confirmed: "CONFIRMED",
    paid: "PAID",
    crafting: "CRAFTING",
    shipped: "SHIPPED",
    delivered: "DELIVERED",
    cancelled: "CANCELLED",
    failed: "FAILED",
  };

  // 1. Resolve order primary ID and check status
  const initial = await db.order.findFirst({
    where: {
      OR: [
        { id: idOrReference },
        { paymentReference: idOrReference },
        { orderNumber: idOrReference },
      ],
    },
    include: orderInclude,
  });

  if (!initial) {
    return undefined;
  }

  // If marking as PAID, route through centralized payment finalizer for atomic reservation conversion and stock movement
  if (status === "paid") {
    const finalMethod = (paymentMethod || initial.paymentMethod || "BANK_TRANSFER") as any;
    const finalProvider = finalMethod === "PAYSTACK" ? "PAYSTACK" : "INTERNAL";
    const ref =
      paymentReference ||
      initial.paymentReference ||
      `admin_pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const finalResult = await finalizeSuccessfulPayment({
      orderId: initial.id,
      amount: Number(initial.total),
      reference: ref,
      method: finalMethod,
      provider: finalProvider,
      verifiedBy: "ADMIN",
      channel,
      notes: "Order status transitioned to PAID via admin",
    });

    const finalOrder = await getOrder(initial.id);
    if (finalOrder && finalResult.success && !finalResult.alreadyProcessed) {
      await notifyOrderPaid(finalOrder);
    }
    return finalOrder;
  }

  // 2. Execute atomic transition within an interactive transaction guarded by row-level lock (FOR UPDATE)
  const txResult = await db.$transaction(
    async (tx) => {
      // Acquire exclusive row-level lock on the target order
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${initial.id} FOR UPDATE`;

      const existing = await tx.order.findUnique({
        where: { id: initial.id },
        include: orderInclude,
      });

      if (!existing) {
        return null;
      }

      const previousStatus = existing.status.toLowerCase() as OrderStatus;

      // Automatically release reservations or restore stock if transitioning to CANCELLED
      if (status === "cancelled") {
        await releaseReservation(existing.id, "Order cancelled via admin", tx);
      }

      let shouldRestoreStock = false;
      if (status === "cancelled" && existing.stockDeducted) {
        const saleCount = await tx.stockMovement.count({
          where: { orderId: existing.id, type: "SALE" },
        });
        shouldRestoreStock = saleCount > 0;
      }

      if (shouldRestoreStock) {
        for (const item of existing.items) {
          await incrementProductStock(
            {
              productId: item.productId,
              productSlug: item.productSlug,
              productName: item.productName,
            },
            item.quantity,
            tx,
            {
              orderId: existing.id,
              reference: existing.orderNumber,
              reason: "Stock restored on order cancellation",
              createdBy: "ADMIN",
              type: "CANCELLATION",
            }
          );
        }
      }

      const updated = await tx.order.update({
        where: { id: existing.id },
        data: {
          status: status === "failed" ? "PENDING" : (prismaStatusMap[status] || "PENDING"),
          paymentStatus: status === "failed" ? "FAILED" : undefined,
          stockDeducted: shouldRestoreStock ? false : existing.stockDeducted,
          refundStatus:
            status === "cancelled"
              ? (Number(existing.amountPaid) > 0 ? "PENDING" : "NOT_REFUNDED")
              : existing.refundStatus,
        },
        include: orderInclude,
      });

      return {
        domainOrder: mapPrismaOrderToDomain(updated),
        previousStatus,
        statusChanged: previousStatus !== status,
      };
    },
    {
      maxWait: 15000,
      timeout: 30000,
    }
  );

  if (!txResult) {
    return undefined;
  }

  const { domainOrder, previousStatus, statusChanged } = txResult;
  const shouldNotifyPaid = status === "confirmed" && previousStatus !== "confirmed";

  // 3. Dispatch notifications and background emails strictly once outside the transaction
  if (shouldNotifyPaid) {
    await notifyOrderPaid(domainOrder);
  } else if (statusChanged && status !== "confirmed") {
    publishAdminNotification({
      type: "ORDER_STATUS",
      priority: status === "cancelled" || status === "failed" ? "high" : "medium",
      title: `Order #${domainOrder.orderNumber} is now ${status.toUpperCase()}`,
      message: `Status transitioned from ${previousStatus} to ${status} (${domainOrder.customer.firstName} ${domainOrder.customer.lastName}).`,
      link: `/admin/orders?search=${encodeURIComponent(domainOrder.orderNumber || "")}`,
      entityId: domainOrder.id,
      entityType: "Order",
      metadata: {
        orderNumber: domainOrder.orderNumber,
        fromStatus: previousStatus,
        toStatus: status,
      },
    }).catch(() => {});

    if (["crafting", "shipped", "delivered", "cancelled"].includes(status)) {
      await sendOrderStatusUpdateEmail(domainOrder, status).catch((err) =>
        console.error(`[updateOrderStatus] Failed to send ${status} status update email:`, err)
      );
    }
  }

  return domainOrder;
}

export interface ListOrdersOptions {
  includeArchived?: boolean;
  status?: string;
  paymentStatus?: string;
  channel?: string;
  fulfillmentType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedOrdersResult {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

function buildOrderWhereClause(opts: ListOrdersOptions): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {
    isArchived: opts.includeArchived ? undefined : false,
  };

  if (opts.status && opts.status !== "all" && opts.status !== "trash") {
    const uppercaseStatus = opts.status.toUpperCase() as Prisma.EnumOrderStatusFilter["equals"];
    if (uppercaseStatus) {
      where.status = uppercaseStatus;
    }
  }

  if (opts.paymentStatus && opts.paymentStatus !== "all") {
    const ps = opts.paymentStatus.toUpperCase();
    if (["UNPAID", "PENDING", "PAID", "PARTIALLY_PAID", "FAILED", "REFUNDED"].includes(ps)) {
      where.paymentStatus = ps as any;
    }
  }

  if (opts.channel && opts.channel !== "all") {
    const ch = opts.channel.toUpperCase();
    if (["ONLINE_STORE", "WHATSAPP", "INSTAGRAM", "X", "WALK_IN"].includes(ch)) {
      where.salesChannel = ch as any;
    }
  }

  if (opts.fulfillmentType && opts.fulfillmentType !== "all") {
    const ft = opts.fulfillmentType.toUpperCase();
    if (["DELIVERY", "PICKUP"].includes(ft)) {
      where.fulfillmentType = ft as any;
    }
  }

  if (opts.startDate || opts.endDate) {
    where.createdAt = {
      ...(opts.startDate && { gte: new Date(opts.startDate) }),
      ...(opts.endDate && { lte: new Date(opts.endDate) }),
    };
  }

  if (opts.search) {
    const s = opts.search.trim();
    where.OR = [
      { orderNumber: { contains: s, mode: "insensitive" } },
      { paymentReference: { contains: s, mode: "insensitive" } },
      { customerName: { contains: s, mode: "insensitive" } },
      { customerEmail: { contains: s, mode: "insensitive" } },
      { customerPhone: { contains: s, mode: "insensitive" } },
      { shippingAddress: { contains: s, mode: "insensitive" } },
    ];
  }

  return where;
}

/**
 * List active orders with optional SQL filtering and pagination
 */
export async function listAllOrders(options: boolean | ListOrdersOptions = false): Promise<Order[]> {
  const opts: ListOrdersOptions = typeof options === "boolean" ? { includeArchived: options } : options;
  const where = buildOrderWhereClause(opts);

  const records = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: orderInclude,
    ...(opts.limit && { take: Math.max(1, opts.limit) }),
    ...(opts.page && opts.limit && { skip: (Math.max(1, opts.page) - 1) * opts.limit }),
  });

  const domainOrders = records.map(mapPrismaOrderToDomain);
  return await attachBulkCancellationDetails(domainOrders);
}

/**
 * List orders returning paginated metadata
 */
export async function listOrdersPaginated(options: ListOrdersOptions = {}): Promise<PaginatedOrdersResult> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 20));
  const skip = (page - 1) * limit;
  const where = buildOrderWhereClause(options);

  const [total, records] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: orderInclude,
      take: limit,
      skip,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const domainOrders = records.map(mapPrismaOrderToDomain);
  const hydratedOrders = await attachBulkCancellationDetails(domainOrders);
  return {
    orders: hydratedOrders,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * List trashed orders
 */
export async function listTrashedOrders(search?: string): Promise<Order[]> {
  const where: Prisma.OrderWhereInput = {
    isArchived: true,
    ...(search && {
      OR: [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const records = await db.order.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: orderInclude,
  });

  const domainOrders = records.map(mapPrismaOrderToDomain);
  return await attachBulkCancellationDetails(domainOrders);
}

/**
 * Soft delete (move order to trash)
 */
export async function trashOrder(id: string): Promise<boolean> {
  const res = await db.order.updateMany({
    where: {
      OR: [{ id }, { orderNumber: id }],
    },
    data: {
      isArchived: true,
      deletedAt: new Date(),
    },
  });
  return res.count > 0;
}

/**
 * Restore order from trash
 */
export async function restoreOrder(id: string): Promise<boolean> {
  const res = await db.order.updateMany({
    where: {
      OR: [{ id }, { orderNumber: id }],
    },
    data: {
      isArchived: false,
      deletedAt: null,
    },
  });
  return res.count > 0;
}

/**
 * Hard delete order
 */
export async function permanentDeleteOrder(id: string): Promise<boolean> {
  const res = await db.order.deleteMany({
    where: {
      OR: [{ id }, { orderNumber: id }],
    },
  });
  return res.count > 0;
}

/**
 * Bulk trash orders
 */
export async function bulkTrashOrders(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;

  const res = await db.order.updateMany({
    where: {
      OR: [{ id: { in: ids } }, { orderNumber: { in: ids } }],
    },
    data: {
      isArchived: true,
      deletedAt: new Date(),
    },
  });
  return res.count;
}

/**
 * Bulk restore orders
 */
export async function bulkRestoreOrders(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;

  const res = await db.order.updateMany({
    where: {
      OR: [{ id: { in: ids } }, { orderNumber: { in: ids } }],
    },
    data: {
      isArchived: false,
      deletedAt: null,
    },
  });
  return res.count;
}

/**
 * Bulk permanent delete orders
 */
export async function bulkPermanentDeleteOrders(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;

  const res = await db.order.deleteMany({
    where: {
      OR: [{ id: { in: ids } }, { orderNumber: { in: ids } }],
    },
  });
  return res.count;
}

/**
 * Verify order payment status directly with Paystack API and synchronize order state
 */
export async function verifyAndSyncOrderWithPaystack(idOrReference: string): Promise<{
  success: boolean;
  status: "paid" | "failed" | "pending";
  order?: Order;
  message: string;
}> {
  const order = await getOrderByReference(idOrReference) ?? await getOrder(idOrReference);
  if (!order) {
    return { success: false, status: "pending", message: "Order not found" };
  }

  // Idempotency fast-path: If order is already paid/processing, return immediately
  if (["paid", "crafting", "shipped", "delivered"].includes(order.status)) {
    return {
      success: true,
      status: "paid",
      order,
      message: "Order has already been verified and paid.",
    };
  }

  const ref = order.paymentReference || order.orderNumber;
  if (!ref) {
    return { success: false, status: "pending", message: "No Paystack payment reference found for this order" };
  }

  try {
    const verification = await verifyPaystackTransaction(ref);
    if (verification.status === "success") {
      const channelLabel = verification.channel ? `Paystack (${verification.channel.toUpperCase()})` : "Paystack";
      const updated = await updateOrderStatus(
        ref,
        "paid",
        ref,
        channelLabel,
        verification.channel
      );
      return {
        success: true,
        status: "paid",
        order: updated,
        message: "Payment successfully verified on Paystack.",
      };
    } else {
      await updateOrderStatus(ref, "failed", ref, "Paystack", verification.channel);
      return {
        success: false,
        status: "failed",
        message: verification.gateway_response || "Payment not completed or failed on Paystack.",
      };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Paystack verification error";
    return {
      success: false,
      status: "pending",
      message: msg,
    };
  }
}

/**
 * Bulk verify pending orders with Paystack API
 */
export async function bulkVerifyAndSyncOrdersWithPaystack(ids: string[]): Promise<{
  verifiedCount: number;
  totalChecked: number;
}> {
  if (ids.length === 0) return { verifiedCount: 0, totalChecked: 0 };
  let verifiedCount = 0;
  for (const id of ids) {
    const result = await verifyAndSyncOrderWithPaystack(id);
    if (result.success && result.status === "paid") {
      verifiedCount++;
    }
  }
  return { verifiedCount, totalChecked: ids.length };
}

/**
 * Bulk update status (Guards fulfillment stages from unpaid orders)
 */
export async function bulkUpdateOrderStatus(
  ids: string[],
  status: OrderStatus
): Promise<number> {
  if (ids.length === 0) return 0;

  const isFulfillmentStage = ["crafting", "shipped", "delivered"].includes(status);

  const prismaStatusMap: Record<OrderStatus, "PENDING" | "CONFIRMED" | "PAID" | "CRAFTING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "FAILED"> = {
    pending: "PENDING",
    confirmed: "CONFIRMED",
    paid: "PAID",
    crafting: "CRAFTING",
    shipped: "SHIPPED",
    delivered: "DELIVERED",
    cancelled: "CANCELLED",
    failed: "FAILED",
  };

  const whereClause: Prisma.OrderWhereInput = {
    OR: [{ id: { in: ids } }, { orderNumber: { in: ids } }],
    ...(isFulfillmentStage ? { status: { notIn: ["PENDING", "FAILED"] } } : {}),
  };

  if (status === "cancelled") {
    const ordersToCancel = await db.order.findMany({
      where: whereClause,
      include: {
        items: true,
      },
    });

    let count = 0;
    for (const ord of ordersToCancel) {
      if (ord.status === "CANCELLED") continue;

      await db.$transaction(async (tx) => {
        const saleCount = ord.stockDeducted
          ? await tx.stockMovement.count({
              where: { orderId: ord.id, type: "SALE" },
            })
          : 0;

        if (ord.stockDeducted && saleCount > 0) {
          for (const item of ord.items) {
            await incrementProductStock(
              {
                productId: item.productId,
                productSlug: item.productSlug,
                productName: item.productName,
              },
              item.quantity,
              tx,
              {
                orderId: ord.id,
                reference: ord.orderNumber,
                reason: "Bulk cancellation stock restore",
                type: "CANCELLATION",
              }
            );
          }
        }

        await tx.order.update({
          where: { id: ord.id },
          data: {
            status: "CANCELLED",
            stockDeducted: false,
          },
        });
      }, { maxWait: 15000, timeout: 30000 });

      await logAuditEvent({
        action: "BULK_ORDERS_CANCEL",
        entity: "Order",
        entityId: ord.id,
        details: {
          orderNumber: ord.orderNumber,
          cancelledBy: "ADMIN",
          stockRestored: ord.stockDeducted,
          timestamp: new Date().toISOString(),
        },
      });

      const domainOrder = await getOrder(ord.id);
      if (domainOrder) {
        queueOrderStatusUpdateEmail(domainOrder, "cancelled");
      }
      count++;
    }

    publishAdminNotification({
      type: "ORDER_STATUS",
      priority: "medium",
      title: `Bulk Orders Cancelled: ${count} Order(s)`,
      message: `${count} order(s) set to CANCELLED in bulk. Stock quantities were automatically restored.`,
      link: `/admin/orders?status=cancelled`,
      metadata: { count, status: "cancelled" },
    }).catch(() => {});

    return count;
  }

  const res = await db.order.updateMany({
    where: whereClause,
    data: {
      status: prismaStatusMap[status],
    },
  });

  for (const id of ids) {
    const order = await getOrder(id) ?? await getOrderByReference(id);
    if (order) {
      // Send milestone status update notification email via durable queue
      if (["crafting", "shipped", "delivered"].includes(status)) {
        queueOrderStatusUpdateEmail(order, status);
      }
    }
  }

  return res.count;
}

export interface CancelOrderParams {
  orderIdOrNumber: string;
  reason: string;
  notes?: string;
  customerEmail?: string;
  cancelledBy: "customer" | "admin";
  adminUserId?: string;
  adminEmail?: string;
  ipAddress?: string;
}

/**
 * Authoritative order cancellation with Terms & Conditions enforcement,
 * automatic stock restoration, audit logging, admin notification, and email alerts.
 */
export async function cancelCustomerOrder(params: CancelOrderParams): Promise<{
  success: boolean;
  order?: Order;
  message: string;
}> {
  const query = params.orderIdOrNumber.trim();
  const existingPrisma = await db.order.findFirst({
    where: {
      OR: [{ id: query }, { orderNumber: query }, { paymentReference: query }],
    },
    include: {
      items: true,
      customer: true,
      address: true,
      transactions: true,
    },
  });

  if (!existingPrisma) {
    return { success: false, message: "Order not found." };
  }

  // 1. Authorization checks for customer cancellations
  if (params.cancelledBy === "customer") {
    const providedEmail = (params.customerEmail || "").trim().toLowerCase();
    const orderEmail = (existingPrisma.customerEmail || "").trim().toLowerCase();
    if (!providedEmail || providedEmail !== orderEmail) {
      return {
        success: false,
        message: "Unauthorized. The provided email address does not match this order.",
      };
    }
  }

  // 2. Terms & Conditions Policy Validations
  if (existingPrisma.status === "CANCELLED") {
    return { success: false, message: "This order has already been cancelled." };
  }

  if (existingPrisma.status === "SHIPPED" || existingPrisma.status === "DELIVERED") {
    return {
      success: false,
      message:
        "Orders that have already been dispatched or delivered cannot be cancelled. Please refer to our 14-day Return Policy upon receiving your package.",
    };
  }

  // Artisan Crafting Policy:
  // Fìlà Yorùbá caps are bespoke handcrafted pieces. Once crafting commences, customer self-cancellation is restricted.
  if (existingPrisma.status === "CRAFTING" && params.cancelledBy === "customer") {
    return {
      success: false,
      message:
        "Artisan handcrafting has already commenced on your bespoke cap. Pieces currently on the loom cannot be self-cancelled. Please contact Customer Support at filaomoyoruba@gmail.com for assistance.",
    };
  }

  // 3. Atomic Cancellation and Stock Restoration in interactive transaction
  const restoredStock = existingPrisma.stockDeducted;
  const previousStatus = existingPrisma.status.toLowerCase() as OrderStatus;

  await db.$transaction(
    async (tx) => {
      // Row-level lock
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${existingPrisma.id} FOR UPDATE`;

      // 1. Release active inventory reservations (holds)
      await releaseReservation(existingPrisma.id, "Order cancelled", tx);

      // 2. Restore physical stock ONLY if physically deducted AND an actual SALE stock movement exists
      const saleCount = restoredStock
        ? await tx.stockMovement.count({
            where: { orderId: existingPrisma.id, type: "SALE" },
          })
        : 0;

      if (restoredStock && saleCount > 0) {
        for (const item of existingPrisma.items) {
          await incrementProductStock(
            {
              productId: item.productId,
              productSlug: item.productSlug,
              productName: item.productName,
            },
            item.quantity,
            tx,
            {
              orderId: existingPrisma.id,
              reference: existingPrisma.orderNumber,
              reason: `Stock restored on cancellation by ${params.cancelledBy}`,
              createdBy: params.adminUserId || "SYSTEM",
              type: "CANCELLATION",
            }
          );
        }
      }

      const isPaidOrPartial = Number(existingPrisma.amountPaid) > 0;

      await tx.order.update({
        where: { id: existingPrisma.id },
        data: {
          status: "CANCELLED",
          stockDeducted: false,
          refundStatus: isPaidOrPartial ? "PENDING" : "NOT_REFUNDED",
        },
      });
    },
    { maxWait: 15000, timeout: 30000 }
  );

  // 4. Log Structured Audit Event
  await logAuditEvent({
    action: params.cancelledBy === "customer" ? "ORDER_CANCELLED_BY_CUSTOMER" : "ORDER_CANCELLED_BY_ADMIN",
    entity: "Order",
    entityId: existingPrisma.id,
    userId: params.adminUserId,
    userEmail: params.adminEmail || params.customerEmail || existingPrisma.customerEmail || undefined,
    ipAddress: params.ipAddress,
    details: {
      orderNumber: existingPrisma.orderNumber,
      cancelledBy: params.cancelledBy.toUpperCase(),
      reason: params.reason,
      notes: params.notes || "",
      previousStatus,
      stockRestored: restoredStock,
      refundEligibility: previousStatus === "paid" ? "FULL_REFUND_SCHEDULED_3_5_DAYS" : "NO_PAYMENT_COLLECTED",
      timestamp: new Date().toISOString(),
    },
  });

  // 5. Fetch updated domain order
  const updatedDomain = await getOrder(existingPrisma.id);
  if (updatedDomain) {
    updatedDomain.cancelledAt = new Date().toISOString();
    updatedDomain.cancelledBy = params.cancelledBy;
    updatedDomain.cancelReason = params.reason;
    updatedDomain.stockRestored = restoredStock;
  }

  // 6. Real-Time Admin Notification
  publishAdminNotification({
    type: "ORDER_STATUS",
    priority: "high",
    title: `⚠️ Order #${existingPrisma.orderNumber} Cancelled by ${params.cancelledBy === "customer" ? "Customer" : "Admin"}`,
    message: `${existingPrisma.customerName} cancelled order #${existingPrisma.orderNumber}. Reason: "${params.reason}". ${
      restoredStock ? "Catalog stock has been automatically restored." : ""
    }`,
    link: `/admin/orders?search=${encodeURIComponent(existingPrisma.orderNumber || "")}`,
    entityId: existingPrisma.id,
    entityType: "Order",
    metadata: {
      orderNumber: existingPrisma.orderNumber,
      customerName: existingPrisma.customerName,
      customerEmail: existingPrisma.customerEmail,
      fromStatus: previousStatus,
      toStatus: "cancelled",
      cancelledBy: params.cancelledBy,
      reason: params.reason,
      stockRestored: restoredStock,
    },
  }).catch(() => {});

  // 7. Queue customer cancellation confirmation email
  if (updatedDomain) {
    queueOrderStatusUpdateEmail(updatedDomain, "cancelled");
  }

  return {
    success: true,
    order: updatedDomain,
    message: `Order #${existingPrisma.orderNumber} has been successfully cancelled.${
      previousStatus === "paid"
        ? " A full refund will be processed to your original payment method within 3–5 business days."
        : ""
    }`,
  };
}

export interface UpdateOrderAddressParams {
  orderIdOrNumber: string;
  customerEmail?: string;
  authenticatedCustomerId?: string;
  address: {
    address: string;
    city: string;
    state: string;
    country?: string;
  };
  customerPhone?: string;
  saveToAddressBook?: boolean;
  ipAddress?: string;
}

export interface UpdateOrderAddressResult {
  success: boolean;
  message: string;
  order?: Order;
}

/**
 * Updates an order's delivery address before it changes to dispatched (SHIPPED).
 */
export async function updateOrderDeliveryAddress(
  params: UpdateOrderAddressParams
): Promise<UpdateOrderAddressResult> {
  const target = params.orderIdOrNumber?.trim();
  if (!target) {
    return { success: false, message: "Order ID or order number is required." };
  }

  // 1. Locate Order
  const existingPrisma = await db.order.findFirst({
    where: {
      OR: [{ id: target }, { orderNumber: target }],
      isArchived: false,
    },
    include: {
      items: {
        include: { product: true },
      },
      customer: true,
      address: true,
      transactions: true,
    },
  });

  if (!existingPrisma) {
    return { success: false, message: "Order not found or has been archived." };
  }

  // 2. Authorization Check
  const orderEmail = (existingPrisma.customerEmail || "").trim().toLowerCase();
  const providedEmail = params.customerEmail ? params.customerEmail.trim().toLowerCase() : undefined;
  const isAuthorized = Boolean(
    (params.authenticatedCustomerId && existingPrisma.customerId === params.authenticatedCustomerId) ||
    (providedEmail && providedEmail === orderEmail)
  );

  if (!isAuthorized) {
    return {
      success: false,
      message: "Unauthorized. You do not have permission to modify this order's delivery address.",
    };
  }

  // 3. Status Cut-off Validation (Must be before dispatched / SHIPPED)
  if (existingPrisma.status === "SHIPPED" || existingPrisma.status === "DELIVERED") {
    return {
      success: false,
      message:
        "Delivery address cannot be modified once the order has been dispatched or delivered. Your package is currently with the courier.",
    };
  }

  if (existingPrisma.status === "CANCELLED") {
    return {
      success: false,
      message: "Delivery address cannot be modified for a cancelled order.",
    };
  }

  if (existingPrisma.status === "FAILED") {
    return {
      success: false,
      message: "Delivery address cannot be modified for a failed order.",
    };
  }

  if (!["PENDING", "PAID", "CRAFTING"].includes(existingPrisma.status)) {
    return {
      success: false,
      message: "Delivery address cannot be modified at this stage of the order lifecycle.",
    };
  }

  // 4. Validate Address Fields
  const newStreet = params.address.address?.trim();
  const newCity = params.address.city?.trim();
  const newState = params.address.state?.trim();
  const newCountry = params.address.country?.trim() || "Nigeria";
  const newPhone = params.customerPhone?.trim() || undefined;

  if (!newStreet || newStreet.length < 3) {
    return { success: false, message: "Please provide a valid street address (minimum 3 characters)." };
  }
  if (!newCity || newCity.length < 2) {
    return { success: false, message: "Please provide a valid city or town." };
  }
  if (!newState || newState.length < 2) {
    return { success: false, message: "Please provide a valid state." };
  }

  // 5. Optional Address Book Linking / Persistence
  let linkedAddressId = existingPrisma.addressId;
  const effectiveCustomerId = existingPrisma.customerId || params.authenticatedCustomerId;

  if (params.saveToAddressBook && effectiveCustomerId) {
    try {
      const existingAddr = await db.address.findFirst({
        where: {
          customerId: effectiveCustomerId,
          address: { equals: newStreet, mode: "insensitive" },
          city: { equals: newCity, mode: "insensitive" },
          state: { equals: newState, mode: "insensitive" },
        },
      });

      if (existingAddr) {
        linkedAddressId = existingAddr.id;
      } else {
        const createdAddr = await db.address.create({
          data: {
            customerId: effectiveCustomerId,
            address: newStreet,
            city: newCity,
            state: newState,
            country: newCountry,
          },
        });
        linkedAddressId = createdAddr.id;
      }
    } catch (addrErr) {
      console.error("Failed to save address to customer address book:", addrErr);
      // Non-fatal, continue with order address update
    }
  }

  // 6. Recalculate Shipping Fee if status is still PENDING
  let updatedShippingFee = Number(existingPrisma.shippingFee);
  let updatedTotal = Number(existingPrisma.total);
  if (existingPrisma.status === "PENDING") {
    updatedShippingFee = calculateAuthoritativeShipping(
      { address: newStreet, city: newCity, state: newState },
      Number(existingPrisma.shippingFee)
    );
    updatedTotal = Number(existingPrisma.subtotal) + updatedShippingFee;
  }

  // 7. Capture Old Address for Audit Log
  const previousAddress = {
    address: existingPrisma.shippingAddress || existingPrisma.address?.address || "",
    city: existingPrisma.shippingCity || existingPrisma.address?.city || "",
    state: existingPrisma.shippingState || existingPrisma.address?.state || "",
    country: existingPrisma.address?.country || "Nigeria",
  };

  // 8. Update Order in DB
  const updatedPrisma = await db.order.update({
    where: { id: existingPrisma.id },
    data: {
      shippingAddress: newStreet,
      shippingCity: newCity,
      shippingState: newState,
      addressId: linkedAddressId,
      customerPhone: newPhone || existingPrisma.customerPhone,
      shippingFee: updatedShippingFee,
      total: updatedTotal,
    },
    include: orderInclude,
  });

  // 9. Structured Audit Log
  await logAuditEvent({
    action: "ORDER_ADDRESS_UPDATED",
    entity: "Order",
    entityId: existingPrisma.id,
    userId: params.authenticatedCustomerId,
    userEmail: providedEmail || existingPrisma.customerEmail || undefined,
    ipAddress: params.ipAddress,
    details: {
      orderNumber: existingPrisma.orderNumber,
      previousAddress,
      newAddress: {
        address: newStreet,
        city: newCity,
        state: newState,
        country: newCountry,
      },
      customerPhone: newPhone || existingPrisma.customerPhone,
      orderStatus: existingPrisma.status,
      timestamp: new Date().toISOString(),
    },
  });

  // 10. Real-time Admin Notification
  publishAdminNotification({
    type: "ORDER_STATUS",
    priority: "low",
    title: `📍 Delivery Address Updated: #${existingPrisma.orderNumber}`,
    message: `${existingPrisma.customerName} updated delivery destination to ${newCity}, ${newState}.`,
    link: `/admin/orders?search=${encodeURIComponent(existingPrisma.orderNumber || "")}`,
    entityId: existingPrisma.id,
    entityType: "Order",
    metadata: {
      orderNumber: existingPrisma.orderNumber,
      previousAddress,
      newAddress: { address: newStreet, city: newCity, state: newState, country: newCountry },
    },
  }).catch(() => {});

  const domainOrder = mapPrismaOrderToDomain(updatedPrisma);

  // 11. Send Confirmation Email (asynchronously)
  sendOrderAddressUpdatedEmail(domainOrder, {
    address: newStreet,
    city: newCity,
    state: newState,
    country: newCountry,
  }).catch((err) => {
    console.error("Failed to send order address updated email:", err);
  });

  return {
    success: true,
    order: domainOrder,
    message: "Delivery address updated successfully. Your package will be delivered to the new destination.",
  };
}

/**
 * Empty order trash
 */
export async function emptyOrderTrash(): Promise<number> {
  const res = await db.order.deleteMany({
    where: { isArchived: true },
  });
  return res.count;
}

// Backward compatibility alias
export const deleteOrder = trashOrder;

export interface ChannelBreakdown {
  channel: string;
  revenue: number;
  orderCount: number;
  percentage: number;
}

export interface OrderMetrics {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  confirmedOrders?: number;
  pendingOrders: number;
  craftingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  averageOrderValue: number;
  salesByChannel: ChannelBreakdown[];
}

export async function getOrderMetrics(): Promise<OrderMetrics> {
  const orders = await listAllOrders();

  const paidStatuses: OrderStatus[] = ["confirmed", "paid", "crafting", "shipped", "delivered"];
  const revenueGenerating = orders.filter((o) => {
    const status = (o.status || "").toLowerCase();
    if (status === "cancelled" || status === "failed") return false;
    return (
      paidStatuses.includes(o.status) ||
      o.paymentStatus === "paid" ||
      (Number(o.amountPaid) || 0) > 0
    );
  });

  const totalRevenue = revenueGenerating.reduce(
    (sum, o) => sum + (Number(o.amountPaid) || Number(o.total) || 0),
    0
  );

  const paidOrders = revenueGenerating.length;
  const pendingOrders = orders.filter(
    (o) =>
      (o.status === "pending" || o.paymentStatus === "unpaid" || o.paymentStatus === "pending") &&
      o.status !== "cancelled" &&
      o.status !== "failed" &&
      o.paymentStatus !== "paid" &&
      !revenueGenerating.includes(o)
  ).length;
  const craftingOrders = orders.filter((o) => (o.status || "").toLowerCase() === "crafting").length;
  const shippedOrders = orders.filter((o) => (o.status || "").toLowerCase() === "shipped").length;
  const deliveredOrders = orders.filter((o) => (o.status || "").toLowerCase() === "delivered").length;

  const channels = ["ONLINE_STORE", "WHATSAPP", "INSTAGRAM", "X", "WALK_IN"];
  const salesByChannel: ChannelBreakdown[] = channels.map((ch) => {
    const channelOrders = revenueGenerating.filter(
      (o) => (o.salesChannel || "ONLINE_STORE") === ch
    );
    const revenue = channelOrders.reduce(
      (sum, o) => sum + (Number(o.amountPaid) || o.total),
      0
    );
    const percentage = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0;
    return {
      channel: ch,
      revenue,
      orderCount: channelOrders.length,
      percentage,
    };
  });

  return {
    totalRevenue,
    totalOrders: orders.length,
    paidOrders,
    pendingOrders,
    craftingOrders,
    shippedOrders,
    deliveredOrders,
    averageOrderValue:
      revenueGenerating.length > 0 ? Math.round(totalRevenue / revenueGenerating.length) : 0,
    salesByChannel,
  };
}
