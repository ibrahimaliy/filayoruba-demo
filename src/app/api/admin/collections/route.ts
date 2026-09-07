import { NextRequest, NextResponse } from "next/server";
import {
  listCollections,
  createCollection,
} from "@/server/services/collection.service";
import { getAdminSession } from "@/server/auth";

export async function GET() {
  try {
    const collections = await listCollections();
    return NextResponse.json({
      success: true,
      collections,
      count: collections.length,
    });
  } catch (error) {
    console.error("GET /api/admin/collections error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, slug, description, image } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Collection title is required" },
        { status: 400 }
      );
    }

    const created = await createCollection({
      name: name.trim(),
      slug: slug && typeof slug === "string" ? slug.trim() : undefined,
      description: description && typeof description === "string" ? description.trim() : undefined,
      image: image && typeof image === "string" && image.trim() ? image.trim() : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Collection "${created.name}" created successfully`,
        collection: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/collections error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create collection" },
      { status: 500 }
    );
  }
}
