import { NextResponse } from "next/server";
import { getActiveHeroSlides } from "@/server/services/hero.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const slides = await getActiveHeroSlides();
    return NextResponse.json({
      success: true,
      slides,
    });
  } catch (error) {
    console.error("GET /api/hero-slides error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch hero slides" },
      { status: 500 }
    );
  }
}
