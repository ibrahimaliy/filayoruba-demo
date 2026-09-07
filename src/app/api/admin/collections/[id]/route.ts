import { NextRequest, NextResponse } from "next/server";
import {
  findCollectionBySlug,
  updateCollection,
  deleteCollection,
} from "@/server/services/collection.service";
import { getAdminSession } from "@/server/auth";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const collection = await findCollectionBySlug(id);

    if (!collection) {
      return NextResponse.json(
        { success: false, message: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      collection,
    });
  } catch (error) {
    console.error("GET /api/admin/collections/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch collection" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { name, slug, description, image } = body;

    const updated = await updateCollection(id, {
      name: typeof name === "string" ? name.trim() : undefined,
      slug: typeof slug === "string" ? slug.trim() : undefined,
      description: typeof description === "string" ? description.trim() : undefined,
      image: typeof image === "string" ? image.trim() : (image === null ? "" : undefined),
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Collection not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Collection "${updated.name}" updated successfully`,
      collection: updated,
    });
  } catch (error) {
    console.error("PATCH /api/admin/collections/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update collection" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const success = await deleteCollection(id);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Collection not found or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Collection deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/admin/collections/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete collection" },
      { status: 500 }
    );
  }
}
