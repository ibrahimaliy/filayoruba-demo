import { NextResponse } from "next/server";
import { getAnnouncementBar } from "@/server/services/announcement.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getAnnouncementBar();
    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("GET /api/announcement error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch announcement bar" },
      { status: 500 }
    );
  }
}
