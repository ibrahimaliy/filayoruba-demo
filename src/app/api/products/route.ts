import { NextResponse } from "next/server";
import { listProducts, listProductsPaginated } from "@/server/services/product.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get("collection") || undefined;
    const search = searchParams.get("search") || undefined;
    const featuredParam = searchParams.get("featured");
    const featured = featuredParam !== null ? featuredParam === "true" : undefined;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    if (pageParam || limitParam) {
      const page = pageParam ? parseInt(pageParam, 10) : 1;
      const limit = limitParam ? parseInt(limitParam, 10) : 20;

      const paginated = await listProductsPaginated({
        collectionSlug: collection,
        search,
        featured,
        page,
        limit,
      });

      return NextResponse.json(paginated, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      });
    }

    const products = await listProducts({
      collectionSlug: collection,
      search,
      featured,
    });

    return NextResponse.json(products, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("API /api/products error:", error);
    return NextResponse.json(
      { message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
