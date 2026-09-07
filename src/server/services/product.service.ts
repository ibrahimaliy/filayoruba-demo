import { products as fallbackProducts } from '@/data/products';
import "server-only";
import { db } from "@/server/db";
import { Product } from "@/types/product";
import { Prisma } from "@prisma/client";
import { publishAdminNotification } from "./notification.service";
import { revalidateTag } from "next/cache";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    collection: true;
    reviews: true;
  };
}>;

function mapPrismaProductToDomain(p: ProductWithRelations): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description || "",
    price: Number(p.price),
    images:
      p.images.length > 0
        ? p.images
        : [
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
          ],
    colors: p.colors.length > 0 ? p.colors : ["Standard"],
    sizes: p.sizes.length > 0 ? p.sizes : ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    featured: p.featured,
    stock: p.stock,
    rating: p.rating,
    collection: {
      name: p.collection?.name || "Yoruba Heritage",
      slug: p.collection?.slug || "heritage",
    },
    reviews: p.reviews.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email || undefined,
      rating: r.rating,
      title: r.title || undefined,
      comment: r.comment,
      isVerifiedBuyer: r.isVerifiedBuyer,
      helpfulCount: r.helpfulCount,
      date: r.date || r.createdAt.toISOString().split("T")[0],
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export interface ListProductsOptions {
  includeArchived?: boolean;
  collectionSlug?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedProductsResult {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  collectionSlug?: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  stock: number;
  featured?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  collectionSlug?: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  stock?: number;
  featured?: boolean;
}

export interface ProductItemIdentifier {
  productId?: string | null;
  productSlug?: string | null;
  productName?: string | null;
}

function safeRevalidateProducts() {
  try {
    revalidateTag("products", "max-age=0");
    revalidateTag("collections", "max-age=0");
  } catch {
    // Non-fatal if executed in non-Next runtime
  }
}

/**
 * List products with optional SQL-level filtering & pagination
 */
export async function listProducts(options?: boolean | ListProductsOptions): Promise<Product[]> {
  try {
    if (!db?.product || typeof db.product.findMany !== "function") {
      return [];
    }

    const isBoolean = typeof options === "boolean";
    const opts: ListProductsOptions = isBoolean ? { includeArchived: options } : options || {};

    const where: Prisma.ProductWhereInput = {
      isArchived: opts.includeArchived ? undefined : false,
      ...(opts.featured !== undefined && { featured: opts.featured }),
      ...(opts.collectionSlug && { collection: { slug: opts.collectionSlug } }),
      ...(opts.search && {
        OR: [
          { name: { contains: opts.search, mode: "insensitive" } },
          { slug: { contains: opts.search, mode: "insensitive" } },
          { description: { contains: opts.search, mode: "insensitive" } },
        ],
      }),
    };

    const dbProducts = await db.product.findMany({
      where,
      include: {
        collection: true,
        reviews: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(opts.limit && { take: Math.max(1, opts.limit) }),
      ...(opts.page && opts.limit && { skip: (Math.max(1, opts.page) - 1) * opts.limit }),
    });

    return dbProducts.map(mapPrismaProductToDomain);
  } catch (error) {
    console.error("Database query failed for products:", error);
    return fallbackProducts;
  }
}

/**
 * List products returning paginated metadata
 */
export async function listProductsPaginated(options: ListProductsOptions = {}): Promise<PaginatedProductsResult> {
  try {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isArchived: options.includeArchived ? undefined : false,
      ...(options.featured !== undefined && { featured: options.featured }),
      ...(options.collectionSlug && { collection: { slug: options.collectionSlug } }),
      ...(options.search && {
        OR: [
          { name: { contains: options.search, mode: "insensitive" } },
          { slug: { contains: options.search, mode: "insensitive" } },
          { description: { contains: options.search, mode: "insensitive" } },
        ],
      }),
    };

    const [total, dbProducts] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        include: {
          collection: true,
          reviews: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      products: dbProducts.map(mapPrismaProductToDomain),
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  } catch (error) {
    console.error("Database query failed for paginated products:", error);
    return {
      products: [],
      total: 0,
      page: 1,
      totalPages: 0,
      hasMore: false,
    };
  }
}

/**
 * List trashed (archived) products
 */
export async function listTrashedProducts(): Promise<Product[]> {
  try {
    const dbProducts = await db.product.findMany({
      where: { isArchived: true },
      include: {
        collection: true,
        reviews: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return dbProducts.map(mapPrismaProductToDomain);
  } catch (error) {
    console.error("Database query failed for trashed products:", error);
    throw error;
  }
}

export async function findProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    if (!db?.product || typeof db.product.findFirst !== "function") {
      return undefined;
    }
    const dbProduct = await db.product.findFirst({
      where: { slug, isArchived: false },
      include: {
        collection: true,
        reviews: true,
      },
    });

    return dbProduct ? mapPrismaProductToDomain(dbProduct) : undefined;
  } catch (error) {
    console.error(`Database query failed for slug "${slug}":`, error);
    return undefined;
  }
}

export async function findProductById(id: string): Promise<Product | undefined> {
  try {
    if (!db?.product || typeof db.product.findFirst !== "function") {
      return undefined;
    }
    const dbProduct = await db.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        collection: true,
        reviews: true,
      },
    });

    return dbProduct ? mapPrismaProductToDomain(dbProduct) : undefined;
  } catch (error) {
    console.error(`Database query failed for product "${id}":`, error);
    return undefined;
  }
}

export async function listProductsByCollection(collectionSlug: string): Promise<Product[]> {
  try {
    if (!db?.product || typeof db.product.findMany !== "function") {
      return [];
    }
    const dbProducts = await db.product.findMany({
      where: {
        collection: { slug: collectionSlug },
        isArchived: false,
      },
      include: {
        collection: true,
        reviews: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return dbProducts.map(mapPrismaProductToDomain);
  } catch (error) {
    console.error(`Database query failed for collection "${collectionSlug}":`, error);
    return [];
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    if (!db?.product || typeof db.product.findMany !== "function") {
      return [];
    }
    const dbProducts = await db.product.findMany({
      where: {
        featured: true,
        isArchived: false,
      },
      include: {
        collection: true,
        reviews: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return dbProducts.map(mapPrismaProductToDomain);
  } catch (error) {
    console.error("Database query failed for featured products:", error);
    return [];
  }
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const slug =
    input.slug?.trim() ||
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  let collectionId: string | undefined;

  if (input.collectionSlug) {
    const collection = await db.collection.findFirst({
      where: {
        OR: [
          { slug: input.collectionSlug },
          { id: input.collectionSlug },
          { slug: { equals: input.collectionSlug, mode: "insensitive" } },
          { name: { equals: input.collectionSlug, mode: "insensitive" } },
        ],
      },
    });
    if (collection) {
      collectionId = collection.id;
    }
  }

  // Fallback: If no collection matched via slug, try matching from product name or slug against existing collections
  if (!collectionId && (input.name || slug)) {
    const collections = await db.collection.findMany();
    const query = `${input.name || ""} ${slug}`.toLowerCase();
    const matched = collections.find((c) => {
      const colSlug = c.slug.toLowerCase();
      const colName = c.name.toLowerCase();
      return query.includes(colSlug) || query.includes(colName);
    });
    if (matched) {
      collectionId = matched.id;
    }
  }

  const defaultImages = [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
  ];

  const created = await db.product.create({
    data: {
      slug,
      name: input.name,
      description: input.description || "",
      price: Number(input.price),
      images: input.images && input.images.length > 0 ? input.images : defaultImages,
      colors: input.colors && input.colors.length > 0 ? input.colors : ["Standard"],
      sizes: input.sizes && input.sizes.length > 0 ? input.sizes : ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
      stock: Math.max(0, Number(input.stock || 0)),
      featured: Boolean(input.featured),
      isArchived: false,
      collectionId,
    },
    include: {
      collection: true,
      reviews: true,
    },
  });

  safeRevalidateProducts();
  return mapPrismaProductToDomain(created);
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput
): Promise<Product | undefined> {
  let collectionId: string | undefined;

  if (input.collectionSlug) {
    const collection = await db.collection.findFirst({
      where: {
        OR: [
          { slug: input.collectionSlug },
          { id: input.collectionSlug },
          { slug: { equals: input.collectionSlug, mode: "insensitive" } },
          { name: { equals: input.collectionSlug, mode: "insensitive" } },
        ],
      },
    });
    if (collection) {
      collectionId = collection.id;
    }
  }

  const target = await db.product.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
  });

  if (!target) {
    return undefined;
  }

  const updated = await db.product.update({
    where: { id: target.id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.slug && { slug: input.slug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.price !== undefined && { price: Number(input.price) }),
      ...(input.images && { images: input.images }),
      ...(input.colors && { colors: input.colors }),
      ...(input.sizes && { sizes: input.sizes }),
      ...(input.stock !== undefined && { stock: Math.max(0, Number(input.stock)) }),
      ...(input.featured !== undefined && { featured: Boolean(input.featured) }),
      ...(collectionId && { collectionId }),
    },
    include: {
      collection: true,
      reviews: true,
    },
  });

  safeRevalidateProducts();
  return mapPrismaProductToDomain(updated);
}

export async function updateProductStock(
  id: string,
  newStock: number
): Promise<Product | undefined> {
  const stock = Math.max(0, Number(newStock));

  const target = await db.product.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
  });

  if (!target) {
    return undefined;
  }

  const updated = await db.product.update({
    where: { id: target.id },
    data: { stock },
    include: {
      collection: true,
      reviews: true,
    },
  });

  safeRevalidateProducts();
  return mapPrismaProductToDomain(updated);
}

/**
 * Decrement product stock atomically with interactive transaction to eliminate race conditions
 */
export async function decrementProductStock(
  identifier: string | ProductItemIdentifier,
  quantity: number,
  txClient?: Prisma.TransactionClient,
  options?: {
    orderId?: string;
    reference?: string;
    reason?: string;
    createdBy?: string;
  }
): Promise<void> {
  const qty = Math.max(1, Number(quantity) || 1);
  const id = typeof identifier === "string" ? identifier : identifier.productId || undefined;
  const slug = typeof identifier === "string" ? identifier : identifier.productSlug || undefined;
  const name = typeof identifier === "string" ? identifier : identifier.productName || undefined;

  const execute = async (tx: Prisma.TransactionClient) => {
    let target = null;

    if (slug) {
      target = await tx.product.findUnique({
        where: { slug },
      });
    }

    if (!target && id) {
      target = await tx.product.findFirst({
        where: { id },
      });
    }

    if (!target && name) {
      target = await tx.product.findFirst({
        where: { name: { equals: name.trim(), mode: "insensitive" } },
      });
    }

    if (target) {
      // Row lock
      await tx.$queryRaw`SELECT id, stock FROM products WHERE id = ${target.id} FOR UPDATE`;

      const decrementAmount = Math.min(target.stock, qty);
      if (decrementAmount > 0) {
        const previousStock = target.stock;
        const remaining = Math.max(0, target.stock - decrementAmount);
        
        await tx.product.update({
          where: { id: target.id },
          data: {
            stock: remaining,
          },
        });

        // Record physical StockMovement in audit ledger
        await tx.stockMovement.create({
          data: {
            productId: target.id,
            orderId: options?.orderId,
            quantity: -decrementAmount,
            type: "SALE",
            previousStock,
            newStock: remaining,
            reference: options?.reference,
            reason: options?.reason || "Physical stock deducted for order",
            createdBy: options?.createdBy || "SYSTEM",
          },
        });

        if (remaining <= 5) {
          publishAdminNotification({
            type: "STOCK_LOW",
            priority: remaining <= 2 ? "urgent" : "high",
            title: `⚠️ Low Stock Alert: ${target.name}`,
            message: `Only ${remaining} ${remaining === 1 ? "unit" : "units"} remaining in catalog inventory.`,
            link: `/admin/products?search=${encodeURIComponent(target.name)}`,
            entityId: target.id,
            entityType: "Product",
            metadata: {
              productId: target.id,
              productName: target.name,
              remainingStock: remaining,
            },
          }).catch(() => {});
        }
      }
    }
  };

  if (txClient) {
    await execute(txClient);
  } else {
    await db.$transaction(execute);
  }

  safeRevalidateProducts();
}

/**
 * Increment product stock atomically with interactive transaction to restore inventory
 */
export async function incrementProductStock(
  identifier: string | ProductItemIdentifier,
  quantity: number,
  txClient?: Prisma.TransactionClient,
  options?: {
    orderId?: string;
    reference?: string;
    reason?: string;
    createdBy?: string;
    type?: "CANCELLATION" | "RESTOCK" | "RETURN" | "ADJUSTMENT";
  }
): Promise<void> {
  const qty = Math.max(1, Number(quantity) || 1);
  const id = typeof identifier === "string" ? identifier : identifier.productId || undefined;
  const slug = typeof identifier === "string" ? identifier : identifier.productSlug || undefined;
  const name = typeof identifier === "string" ? identifier : identifier.productName || undefined;

  const execute = async (tx: Prisma.TransactionClient) => {
    let target = null;

    if (slug) {
      target = await tx.product.findUnique({
        where: { slug },
      });
    }

    if (!target && id) {
      target = await tx.product.findFirst({
        where: { id },
      });
    }

    if (!target && name) {
      target = await tx.product.findFirst({
        where: { name: { equals: name.trim(), mode: "insensitive" } },
      });
    }

    if (target) {
      // Row lock
      await tx.$queryRaw`SELECT id, stock FROM products WHERE id = ${target.id} FOR UPDATE`;

      const previousStock = target.stock;
      const restored = await tx.product.update({
        where: { id: target.id },
        data: {
          stock: {
            increment: qty,
          },
        },
      });

      // Record physical StockMovement in audit ledger
      await tx.stockMovement.create({
        data: {
          productId: target.id,
          orderId: options?.orderId,
          quantity: qty,
          type: options?.type || "CANCELLATION",
          previousStock,
          newStock: restored.stock,
          reference: options?.reference,
          reason: options?.reason || "Physical stock restored to catalog",
          createdBy: options?.createdBy || "SYSTEM",
        },
      });

      publishAdminNotification({
        type: "STOCK_LOW",
        priority: "low",
        title: `📦 Stock Restored: ${target.name}`,
        message: `${qty} ${qty === 1 ? "unit" : "units"} automatically restored to catalog inventory (Current stock: ${restored.stock}).`,
        link: `/admin/products?search=${encodeURIComponent(target.name)}`,
        entityId: target.id,
        entityType: "Product",
        metadata: {
          productId: target.id,
          productName: target.name,
          restoredQuantity: qty,
          newStock: restored.stock,
        },
      }).catch(() => {});
    }
  };

  if (txClient) {
    await execute(txClient);
  } else {
    await db.$transaction(execute);
  }

  safeRevalidateProducts();
}

/**
 * Move single product to trash (soft delete)
 */
export async function trashProduct(id: string): Promise<boolean> {
  const res = await db.product.updateMany({
    where: {
      OR: [{ id }, { slug: id }],
    },
    data: {
      isArchived: true,
      deletedAt: new Date(),
    },
  });
  safeRevalidateProducts();
  return res.count > 0;
}

/**
 * Restore product from trash
 */
export async function restoreProduct(id: string): Promise<boolean> {
  const res = await db.product.updateMany({
    where: {
      OR: [{ id }, { slug: id }],
    },
    data: {
      isArchived: false,
      deletedAt: null,
    },
  });
  safeRevalidateProducts();
  return res.count > 0;
}

/**
 * Permanently delete single product (wipe)
 */
export async function permanentDeleteProduct(id: string): Promise<boolean> {
  const res = await db.product.deleteMany({
    where: {
      OR: [{ id }, { slug: id }],
    },
  });
  safeRevalidateProducts();
  return res.count > 0;
}

/**
 * Bulk trash products
 */
export async function bulkTrashProducts(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;

  const res = await db.product.updateMany({
    where: {
      OR: [{ id: { in: ids } }, { slug: { in: ids } }],
    },
    data: {
      isArchived: true,
      deletedAt: new Date(),
    },
  });
  safeRevalidateProducts();
  return res.count;
}

/**
 * Bulk restore products
 */
export async function bulkRestoreProducts(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;

  const res = await db.product.updateMany({
    where: {
      OR: [{ id: { in: ids } }, { slug: { in: ids } }],
    },
    data: {
      isArchived: false,
      deletedAt: null,
    },
  });
  safeRevalidateProducts();
  return res.count;
}

/**
 * Bulk permanently delete products
 */
export async function bulkPermanentDeleteProducts(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;

  const res = await db.product.deleteMany({
    where: {
      OR: [{ id: { in: ids } }, { slug: { in: ids } }],
    },
  });
  safeRevalidateProducts();
  return res.count;
}

/**
 * Bulk stock adjustment
 */
export async function bulkUpdateStock(ids: string[], stock: number): Promise<number> {
  const cleanStock = Math.max(0, stock);

  const res = await db.product.updateMany({
    where: {
      OR: [{ id: { in: ids } }, { slug: { in: ids } }],
    },
    data: {
      stock: cleanStock,
    },
  });
  safeRevalidateProducts();
  return res.count;
}

/**
 * Bulk featured toggle
 */
export async function bulkUpdateFeatured(ids: string[], featured: boolean): Promise<number> {
  const res = await db.product.updateMany({
    where: {
      OR: [{ id: { in: ids } }, { slug: { in: ids } }],
    },
    data: {
      featured,
    },
  });
  safeRevalidateProducts();
  return res.count;
}

/**
 * Empty product trash
 */
export async function emptyProductTrash(): Promise<number> {
  const res = await db.product.deleteMany({
    where: { isArchived: true },
  });
  safeRevalidateProducts();
  return res.count;
}

// Backward compatibility alias
export const deleteProduct = trashProduct;
