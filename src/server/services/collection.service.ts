import { collections as fallbackCollections } from '@/data/collections';
import "server-only";
import { db } from "@/server/db";
import { Collection } from "@/types/collection";
import { generateSlug } from "@/lib/slugify";
import { revalidateTag } from "next/cache";

export interface CreateCollectionInput {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
}

export interface UpdateCollectionInput {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
}

type CollectionRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

function safeRevalidateCollections() {
  try {
    revalidateTag("collections", "max-age=0");
    revalidateTag("products", "max-age=0");
  } catch {
    // Non-fatal in non-Next runtime
  }
}

function mapPrismaCollectionToDomain(
  c: CollectionRecord & { _count?: { products: number } }
): Collection {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || "",
    image: c.image || undefined,
    productCount: c._count?.products,
  };
}

export async function listCollections(): Promise<Collection[]> {
  try {
    const dbCollections = await db.collection.findMany({
      include: {
        _count: {
          select: { products: { where: { isArchived: false } } },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    if (dbCollections && dbCollections.length > 0) {
      return dbCollections.map(mapPrismaCollectionToDomain);
    }
  } catch (error) {
    console.error('Database query failed in listCollections, serving curated collections fallback:', error);
  }
  return fallbackCollections;
}

export async function findCollectionBySlug(slug: string): Promise<Collection | undefined> {
  try {
    if (!db?.collection || typeof db.collection.findFirst !== "function") {
      return undefined;
    }
    const dbCollection = await db.collection.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      include: {
        _count: {
          select: { products: { where: { isArchived: false } } },
        },
      },
    });

    return dbCollection ? mapPrismaCollectionToDomain(dbCollection) : undefined;
  } catch (error) {
    console.error(`Database query failed for collection "${slug}":`, error);
    return undefined;
  }
}

export async function createCollection(input: CreateCollectionInput): Promise<Collection> {
  const name = input.name.trim();
  const slug = generateSlug(input.slug || name);
  const description = input.description?.trim() || "";
  const image = input.image?.trim() ? input.image.trim() : null;

  try {
    const created = await db.collection.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
      },
      include: {
        _count: {
          select: { products: { where: { isArchived: false } } },
        },
      },
    });

    safeRevalidateCollections();
    return mapPrismaCollectionToDomain(created);
  } catch (error) {
    console.error("Database creation failed for collection:", error);
    throw error;
  }
}

export async function updateCollection(
  idOrSlug: string,
  input: UpdateCollectionInput
): Promise<Collection | undefined> {
  try {
    const target = await db.collection.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (!target) {
      return undefined;
    }

    const updated = await db.collection.update({
      where: { id: target.id },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.slug && { slug: generateSlug(input.slug) }),
        ...(input.description !== undefined && {
          description: input.description.trim() || null,
        }),
        ...(input.image !== undefined && {
          image: input.image.trim() ? input.image.trim() : null,
        }),
      },
      include: {
        _count: {
          select: { products: { where: { isArchived: false } } },
        },
      },
    });

    safeRevalidateCollections();
    return mapPrismaCollectionToDomain(updated);
  } catch (error) {
    console.error(`Database update failed for collection "${idOrSlug}":`, error);
    throw error;
  }
}

export async function deleteCollection(idOrSlug: string): Promise<boolean> {
  try {
    const target = await db.collection.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (!target) {
      return false;
    }

    await db.collection.delete({
      where: { id: target.id },
    });

    safeRevalidateCollections();
    return true;
  } catch (error) {
    console.error(`Database delete failed for collection "${idOrSlug}":`, error);
    throw error;
  }
}
