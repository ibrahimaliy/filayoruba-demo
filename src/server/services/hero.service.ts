import "server-only";
import { db } from "@/server/db";
import { HeroSlide, CreateHeroSlideInput, UpdateHeroSlideInput } from "@/types/hero";
import { heroSlides as defaultHeroSlides } from "@/data/hero-slides";
import { revalidateTag } from "next/cache";

type HeroSlideRecord = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  tag: string | null;
  price: string | null;
  link: string;
  image: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function safeRevalidateHeroSlides() {
  try {
    revalidateTag("hero-slides", "max-age=0");
  } catch {
    // Non-fatal in non-Next runtime
  }
}

function mapPrismaHeroSlideToDomain(s: HeroSlideRecord): HeroSlide {
  return {
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    badge: s.badge,
    tag: s.tag,
    price: s.price,
    link: s.link,
    image: s.image,
    order: s.order,
    isActive: s.isActive,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

/**
 * List all hero slides, with optional filter for active-only slides on storefront
 */
export async function listHeroSlides(options?: { activeOnly?: boolean }): Promise<HeroSlide[]> {
  try {
    if (!db?.heroSlide || typeof db.heroSlide.findMany !== "function") {
      return defaultHeroSlides;
    }
    const whereClause = options?.activeOnly ? { isActive: true } : {};
    let dbSlides = await db.heroSlide.findMany({
      where: whereClause,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    // If database table is empty and not filtered by activeOnly, automatically seed default slides
    if (dbSlides.length === 0 && !options?.activeOnly) {
      try {
        const count = await db.heroSlide.count();
        if (count === 0) {
          await seedDefaultHeroSlides();
          dbSlides = await db.heroSlide.findMany({
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          });
        }
      } catch {
        return defaultHeroSlides;
      }
    }

    if (dbSlides.length === 0) {
      return defaultHeroSlides;
    }

    return dbSlides.map(mapPrismaHeroSlideToDomain);
  } catch (error) {
    console.error("Database query failed for hero slides, returning fallback:", error);
    return defaultHeroSlides;
  }
}

/**
 * Get only active slides for public storefront hero carousel
 */
export async function getActiveHeroSlides(): Promise<HeroSlide[]> {
  return listHeroSlides({ activeOnly: true });
}

/**
 * Get a specific hero slide by ID
 */
export async function findHeroSlideById(id: string): Promise<HeroSlide | undefined> {
  try {
    if (!db?.heroSlide || typeof db.heroSlide.findUnique !== "function") {
      return undefined;
    }
    const dbSlide = await db.heroSlide.findUnique({
      where: { id },
    });
    return dbSlide ? mapPrismaHeroSlideToDomain(dbSlide) : undefined;
  } catch (error) {
    console.error(`Database query failed for hero slide ${id}:`, error);
    throw error;
  }
}

export const getHeroSlideById = findHeroSlideById;

/**
 * Create a new hero slide
 */
export async function createHeroSlide(input: CreateHeroSlideInput): Promise<HeroSlide> {
  const title = input.title.trim();
  const subtitle = (input.subtitle || "").trim();
  const badge = input.badge.trim();
  const tag = input.tag?.trim() || null;
  const price = input.price?.trim() || null;
  const link = input.link?.trim() || "/products";
  const image = input.image.trim();
  const isActive = input.isActive !== undefined ? input.isActive : true;

  try {
    if (!db?.heroSlide || typeof db.heroSlide.create !== "function") {
      throw new Error("Database client for hero slides is unavailable");
    }

    let order = input.order;
    if (order === undefined) {
      const highest = await db.heroSlide.findFirst({
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = (highest?.order ?? -1) + 1;
    }

    const created = await db.heroSlide.create({
      data: {
        title,
        subtitle,
        badge,
        tag,
        price,
        link,
        image,
        order,
        isActive,
      },
    });

    safeRevalidateHeroSlides();
    return mapPrismaHeroSlideToDomain(created);
  } catch (error) {
    console.error("Database creation failed for hero slide:", error);
    throw error;
  }
}

/**
 * Update an existing hero slide
 */
export async function updateHeroSlide(
  id: string,
  input: UpdateHeroSlideInput
): Promise<HeroSlide | undefined> {
  try {
    if (!db?.heroSlide || typeof db.heroSlide.update !== "function") {
      throw new Error("Database client for hero slides is unavailable");
    }

    const existing = await db.heroSlide.findUnique({
      where: { id },
    });

    if (!existing) {
      return undefined;
    }

    const updated = await db.heroSlide.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.subtitle !== undefined && { subtitle: input.subtitle.trim() }),
        ...(input.badge !== undefined && { badge: input.badge.trim() }),
        ...(input.tag !== undefined && { tag: input.tag?.trim() || null }),
        ...(input.price !== undefined && { price: input.price?.trim() || null }),
        ...(input.link !== undefined && { link: input.link.trim() }),
        ...(input.image !== undefined && { image: input.image.trim() }),
        ...(input.order !== undefined && { order: input.order }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    safeRevalidateHeroSlides();
    return mapPrismaHeroSlideToDomain(updated);
  } catch (error) {
    console.error(`Database update failed for hero slide "${id}":`, error);
    throw error;
  }
}

/**
 * Delete a hero slide
 */
export async function deleteHeroSlide(id: string): Promise<boolean> {
  try {
    if (!db?.heroSlide || typeof db.heroSlide.delete !== "function") {
      throw new Error("Database client for hero slides is unavailable");
    }

    const existing = await db.heroSlide.findUnique({
      where: { id },
    });

    if (!existing) {
      return false;
    }

    await db.heroSlide.delete({
      where: { id },
    });

    safeRevalidateHeroSlides();
    return true;
  } catch (error) {
    console.error(`Database delete failed for hero slide "${id}":`, error);
    throw error;
  }
}

/**
 * Batch reorder hero slides by providing an ordered array of slide IDs
 */
export async function reorderHeroSlides(orderedIds: string[]): Promise<boolean> {
  if (!db?.heroSlide || typeof db.heroSlide.update !== "function") {
    throw new Error(
      `Database client for hero slides is unavailable during reorder (db: ${typeof db}, heroSlide: ${typeof db?.heroSlide})`
    );
  }

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new Error("orderedIds must be a non-empty array");
  }

  let existingRecords = await db.heroSlide.findMany({
    where: { id: { in: orderedIds } },
    select: { id: true },
  });

  if (existingRecords.length === 0) {
    await seedDefaultHeroSlides();
    existingRecords = await db.heroSlide.findMany({
      where: { id: { in: orderedIds } },
      select: { id: true },
    });
  }

  const existingIdSet = new Set(existingRecords.map((r) => r.id));
  const validUpdates = orderedIds
    .filter((id) => existingIdSet.has(id))
    .map((id, index) =>
      db.heroSlide.update({
        where: { id },
        data: { order: index },
      })
    );

  if (validUpdates.length > 0) {
    await db.$transaction(validUpdates);
  }

  safeRevalidateHeroSlides();
  return true;
}

/**
 * Seed default slides into database if empty or explicitly triggered by admin
 */
export async function seedDefaultHeroSlides(): Promise<void> {
  try {
    if (!db?.heroSlide || typeof db.heroSlide.upsert !== "function") {
      throw new Error("Database client for hero slides is unavailable");
    }

    for (const slide of defaultHeroSlides) {
      await db.heroSlide.upsert({
        where: { id: slide.id },
        update: {
          title: slide.title,
          subtitle: slide.subtitle,
          badge: slide.badge,
          tag: slide.tag,
          price: slide.price,
          link: slide.link || "/products",
          image: slide.image,
          order: slide.order,
          isActive: slide.isActive,
        },
        create: {
          id: slide.id,
          title: slide.title,
          subtitle: slide.subtitle,
          badge: slide.badge,
          tag: slide.tag,
          price: slide.price,
          link: slide.link || "/products",
          image: slide.image,
          order: slide.order,
          isActive: slide.isActive,
        },
      });
    }
    safeRevalidateHeroSlides();
  } catch (error) {
    console.error("Failed to seed default hero slides to DB:", error);
    throw error;
  }
}
