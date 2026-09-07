import { NextRequest, NextResponse } from "next/server";
import { reorderHeroSlides } from "@/server/services/hero.service";
import { getAdminSession } from "@/server/auth";
import { logAuditEvent } from "@/server/services/audit.service";

export const dynamic = "force-dynamic";

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
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "orderedIds array is required" },
        { status: 400 }
      );
    }

    const success = await reorderHeroSlides(orderedIds);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Failed to reorder hero slides" },
        { status: 500 }
      );
    }

    await logAuditEvent({
      userId: session.id,
      userEmail: session.email,
      action: "HERO_SLIDES_REORDER",
      entity: "HeroSlide",
      details: { count: orderedIds.length, orderedIds },
    });

    return NextResponse.json({
      success: true,
      message: "Hero slides reordered successfully",
    });
  } catch (error: any) {
    console.error("POST /api/admin/hero-slides/reorder error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to reorder hero slides",
        details: String(error?.stack || error),
      },
      { status: 500 }
    );
  }
}
