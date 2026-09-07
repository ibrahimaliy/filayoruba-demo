import { NextRequest, NextResponse } from "next/server";
import {
  getHeroSlideById,
  updateHeroSlide,
  deleteHeroSlide,
} from "@/server/services/hero.service";
import { getAdminSession } from "@/server/auth";
import { logAuditEvent } from "@/server/services/audit.service";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const slide = await getHeroSlideById(id);

    if (!slide) {
      return NextResponse.json(
        { success: false, message: "Hero slide not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      slide,
    });
  } catch (error) {
    console.error("GET /api/admin/hero-slides/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch hero slide" },
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
    const { title, subtitle, badge, tag, price, link, image, isActive, order } = body;

    const updated = await updateHeroSlide(id, {
      title,
      subtitle,
      badge,
      tag,
      price,
      link,
      image,
      isActive,
      order,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Hero slide not found or update failed" },
        { status: 404 }
      );
    }

    await logAuditEvent({
      userId: session.id,
      userEmail: session.email,
      action: "HERO_SLIDE_UPDATE",
      entity: "HeroSlide",
      entityId: id,
      details: { title: updated.title, isActive: updated.isActive },
    });

    return NextResponse.json({
      success: true,
      message: `Hero slide "${updated.title}" updated successfully`,
      slide: updated,
    });
  } catch (error) {
    console.error("PATCH /api/admin/hero-slides/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update hero slide" },
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
    const success = await deleteHeroSlide(id);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Hero slide not found or could not be deleted" },
        { status: 404 }
      );
    }

    await logAuditEvent({
      userId: session.id,
      userEmail: session.email,
      action: "HERO_SLIDE_DELETE",
      entity: "HeroSlide",
      entityId: id,
      details: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Hero slide deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/admin/hero-slides/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete hero slide" },
      { status: 500 }
    );
  }
}
