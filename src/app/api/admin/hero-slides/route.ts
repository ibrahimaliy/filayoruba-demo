import { NextRequest, NextResponse } from "next/server";
import {
  listHeroSlides,
  createHeroSlide,
} from "@/server/services/hero.service";
import { getAdminSession } from "@/server/auth";
import { logAuditEvent } from "@/server/services/audit.service";

export async function GET() {
  try {
    const slides = await listHeroSlides();
    return NextResponse.json({
      success: true,
      slides,
      count: slides.length,
    });
  } catch (error) {
    console.error("GET /api/admin/hero-slides error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch hero slides" },
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
    const { title, subtitle, badge, tag, price, link, image, isActive, order } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Slide title is required" },
        { status: 400 }
      );
    }

    if (!image || typeof image !== "string" || !image.trim()) {
      return NextResponse.json(
        { success: false, message: "Slide banner image is required" },
        { status: 400 }
      );
    }

    if (!badge || typeof badge !== "string" || !badge.trim()) {
      return NextResponse.json(
        { success: false, message: "Slide promo badge is required" },
        { status: 400 }
      );
    }

    const targetLink = typeof link === "string" && link.trim() ? link.trim() : "/products";

    const created = await createHeroSlide({
      title: title.trim(),
      subtitle: (subtitle || "").trim(),
      badge: badge.trim(),
      tag: tag ? tag.trim() : null,
      price: price ? price.trim() : null,
      link: targetLink,
      image: image.trim(),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      order: typeof order === "number" ? order : undefined,
    });

    await logAuditEvent({
      userId: session.id,
      userEmail: session.email,
      action: "HERO_SLIDE_CREATE",
      entity: "HeroSlide",
      entityId: created.id,
      details: { title: created.title, badge: created.badge },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Hero slide "${created.title}" created successfully`,
        slide: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/hero-slides error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create hero slide" },
      { status: 500 }
    );
  }
}
