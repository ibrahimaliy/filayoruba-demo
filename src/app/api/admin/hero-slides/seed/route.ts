import { NextRequest, NextResponse } from "next/server";
import { seedDefaultHeroSlides, listHeroSlides } from "@/server/services/hero.service";
import { getAdminSession } from "@/server/auth";
import { logAuditEvent } from "@/server/services/audit.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    await seedDefaultHeroSlides();
    const slides = await listHeroSlides();

    await logAuditEvent({
      userId: session.id,
      userEmail: session.email,
      action: "HERO_SLIDES_SEED",
      entity: "HeroSlide",
      details: { count: slides.length },
    });

    return NextResponse.json({
      success: true,
      message: "Default hero slides loaded successfully",
      slides,
    });
  } catch (error) {
    console.error("POST /api/admin/hero-slides/seed error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to seed default hero slides" },
      { status: 500 }
    );
  }
}
