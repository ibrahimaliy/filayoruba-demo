import { NextResponse } from "next/server";
import { listCollections } from "@/server/services/collection.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collections = await listCollections();
    return NextResponse.json(collections, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("API /api/collections error:", error);
    return NextResponse.json(
      { message: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}
