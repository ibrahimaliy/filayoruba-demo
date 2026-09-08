import type { MetadataRoute } from "next";
import { db } from "@/server/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://filayoruba.com").replace(/\/$/, "");
  const currentDate = new Date().toISOString();

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/size-guide`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/return-policy`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/return-and-refund`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cancel-order`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
    return staticRoutes;
  }

  try {
    const [products, collections] = await Promise.all([
      db.product.findMany({
        where: { isArchived: false },
        select: { slug: true, updatedAt: true },
      }),
      db.collection.findMany({
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: p.updatedAt ? p.updatedAt.toISOString() : currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const collectionRoutes: MetadataRoute.Sitemap = collections.map((c) => ({
      url: `${baseUrl}/products?collection=${c.slug}`,
      lastModified: c.updatedAt ? c.updatedAt.toISOString() : currentDate,
      changeFrequency: "weekly",
      priority: 0.75,
    }));

    return [...staticRoutes, ...productRoutes, ...collectionRoutes];
  } catch (err) {
    console.warn("Database unreachable during sitemap generation, falling back to static routes:", (err as Error)?.message || err);
    return staticRoutes;
  }
}
