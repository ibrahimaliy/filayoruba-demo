import "server-only";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client";
import { Order } from "@/types/order";
import {
  orderInclude,
  mapPrismaOrderToDomain,
  attachBulkCancellationDetails,
} from "./order.service";

export type PatronTier = "VIP Royal" | "High Value" | "Returning Patron" | "New Patron";

export interface CustomerDirectoryEntry {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  totalOrders: number;
  paidOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: string;
  firstOrderDate?: string;
  tier: PatronTier;
  preferredSizes: string[];
  favoriteCollections: string[];
  addresses: {
    id: string;
    address: string;
    city: string;
    state: string;
    country: string;
  }[];
  orders: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
    itemCount: number;
    itemsSummary: string;
  }[];
}

export interface CustomerBookMetrics {
  totalCustomers: number;
  vipCount: number;
  totalRevenue: number;
  averageLtv: number;
}

export interface ListCustomerDirectoryOptions {
  search?: string;
  tier?: string;
  page?: number;
  limit?: number;
}

/**
 * Compiles a full customer book directory with database-optimized querying and filtering
 */
export async function listCustomerDirectory(options: ListCustomerDirectoryOptions = {}): Promise<{
  customers: CustomerDirectoryEntry[];
  metrics: CustomerBookMetrics;
  total?: number;
  page?: number;
  totalPages?: number;
}> {
  try {
    const search = options.search?.trim();

    const customerWhere: Prisma.CustomerWhereInput = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const registeredCustomers = await db.customer.findMany({
      where: customerWhere,
      include: {
        addresses: true,
        orders: {
          where: { isArchived: false },
          include: { items: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const paidStatuses = ["CONFIRMED", "PAID", "CRAFTING", "SHIPPED", "DELIVERED"];

    let entries: CustomerDirectoryEntry[] = registeredCustomers.map((c) => {
      const orders = c.orders || [];
      const paidOrdersList = orders.filter((o) => {
        const statusUpper = (o.status || "").toUpperCase();
        const paymentStatusUpper = (o.paymentStatus || "").toUpperCase();
        if (statusUpper === "CANCELLED" || statusUpper === "FAILED") return false;
        return (
          paidStatuses.includes(statusUpper) ||
          paymentStatusUpper === "PAID" ||
          (Number(o.amountPaid) || 0) > 0
        );
      });
      const totalSpent = paidOrdersList.reduce(
        (sum, o) => sum + (Number(o.amountPaid) || Number(o.total) || 0),
        0
      );
      const paidOrders = paidOrdersList.length;
      const averageOrderValue = paidOrders > 0 ? Math.round(totalSpent / paidOrders) : 0;

      // Calculate preferred sizes
      const sizeCounts = new Map<string, number>();
      for (const o of orders) {
        for (const item of o.items || []) {
          if (item.size) {
            sizeCounts.set(item.size, (sizeCounts.get(item.size) || 0) + item.quantity);
          }
        }
      }
      const preferredSizes = Array.from(sizeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([size]) => size);

      // Determine Tier
      let tier: PatronTier = "New Patron";
      if (totalSpent >= 150000) {
        tier = "VIP Royal";
      } else if (totalSpent >= 75000) {
        tier = "High Value";
      } else if (orders.length >= 2) {
        tier = "Returning Patron";
      }

      const orderSummaries = orders.map((o) => {
        const itemCount = (o.items || []).reduce((sum, i) => sum + i.quantity, 0);
        const itemNames = (o.items || []).map((i) => `${i.quantity}x ${i.productName}`).join(", ");
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          total: Number(o.total),
          status: o.status.toLowerCase(),
          createdAt: o.createdAt.toISOString(),
          itemCount,
          itemsSummary: itemNames || "Handcrafted Yoruba Fila",
        };
      });

      const firstOrder = orders[orders.length - 1];
      const lastOrder = orders[0];

      return {
        id: c.id,
        email: c.email || (c.phone ? `${c.phone}@customer` : `customer-${c.id.slice(0, 8)}`),
        firstName: c.firstName,
        lastName: c.lastName,
        fullName: `${c.firstName} ${c.lastName}`.trim(),
        phone: c.phone || "—",
        totalOrders: orders.length,
        paidOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate: lastOrder ? lastOrder.createdAt.toISOString() : undefined,
        firstOrderDate: firstOrder ? firstOrder.createdAt.toISOString() : c.createdAt.toISOString(),
        tier,
        preferredSizes,
        favoriteCollections: [],
        addresses: (c.addresses || []).map((a) => ({
          id: a.id,
          address: a.address,
          city: a.city,
          state: a.state,
          country: a.country,
        })),
        orders: orderSummaries,
      };
    });

    // Tier filtering
    if (options.tier && options.tier !== "all") {
      const targetTier = options.tier.toLowerCase();
      entries = entries.filter((c) => c.tier.toLowerCase() === targetTier);
    }

    entries.sort((a, b) => b.totalSpent - a.totalSpent || b.totalOrders - a.totalOrders);

    const totalCustomers = entries.length;
    const vipCount = entries.filter((c) => c.tier === "VIP Royal" || c.tier === "High Value").length;
    const totalRevenue = entries.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageLtv = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;

    return {
      customers: entries,
      metrics: {
        totalCustomers,
        vipCount,
        totalRevenue,
        averageLtv,
      },
    };
  } catch (error) {
    console.error("Failed to list customer directory:", error);
    return {
      customers: [],
      metrics: {
        totalCustomers: 0,
        vipCount: 0,
        totalRevenue: 0,
        averageLtv: 0,
      },
    };
  }
}

/**
 * Retrieves a single customer profile with full order history
 */
export async function getCustomerProfile(idOrEmail: string): Promise<CustomerDirectoryEntry | null> {
  try {
    const customer = await db.customer.findFirst({
      where: {
        OR: [{ id: idOrEmail }, { email: { equals: idOrEmail, mode: "insensitive" } }],
      },
      include: {
        addresses: true,
        orders: {
          where: { isArchived: false },
          include: { items: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) return null;

    const res = await listCustomerDirectory({ search: customer.email || undefined });
    return res.customers[0] || null;
  } catch (error) {
    console.error("Failed to fetch customer profile:", error);
    return null;
  }
}

/**
 * Retrieves all orders associated with a customer
 */
export async function getCustomerOrders(customerId: string, email: string): Promise<Order[]> {
  try {
    const orders = await db.order.findMany({
      where: {
        OR: [
          { customerId },
          { customerEmail: { equals: email, mode: "insensitive" } },
        ],
        isArchived: false,
      },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });

    const domainOrders = orders.map(mapPrismaOrderToDomain);
    return await attachBulkCancellationDetails(domainOrders);
  } catch (error) {
    console.error("Failed to fetch customer orders:", error);
    return [];
  }
}

/**
 * Updates customer name and contact details
 */
export async function updateCustomerProfile(
  customerId: string,
  input: { firstName?: string; lastName?: string; phone?: string }
) {
  return db.customer.update({
    where: { id: customerId },
    data: {
      ...(input.firstName && { firstName: input.firstName.trim() }),
      ...(input.lastName && { lastName: input.lastName.trim() }),
      ...(input.phone !== undefined && { phone: input.phone.trim() || null }),
    },
  });
}

/**
 * Saves or updates a customer shipping address
 */
export async function saveCustomerAddress(
  customerId: string,
  input: { address: string; city: string; state: string; country?: string }
) {
  return db.address.create({
    data: {
      customerId,
      address: input.address.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      country: input.country?.trim() || "Nigeria",
    },
  });
}

/**
 * Updates an existing customer shipping address
 */
export async function updateCustomerAddress(
  customerId: string,
  addressId: string,
  input: { address: string; city: string; state: string; country?: string }
) {
  const existing = await db.address.findFirst({
    where: { id: addressId, customerId },
  });

  if (!existing) {
    throw new Error("Address not found or unauthorized");
  }

  return db.address.update({
    where: { id: addressId },
    data: {
      address: input.address.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      country: input.country?.trim() || existing.country || "Nigeria",
    },
  });
}

/**
 * Deletes a customer shipping address and unlinks referencing orders
 */
export async function deleteCustomerAddress(
  customerId: string,
  addressId: string
) {
  const existing = await db.address.findFirst({
    where: { id: addressId, customerId },
  });

  if (!existing) {
    throw new Error("Address not found or unauthorized");
  }

  // Safely unlink orders if any reference this address so no FK constraints fail
  await db.order.updateMany({
    where: { addressId },
    data: { addressId: null },
  });

  return db.address.delete({
    where: { id: addressId },
  });
}

