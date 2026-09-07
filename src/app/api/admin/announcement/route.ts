import { NextRequest, NextResponse } from "next/server";
import {
  getAnnouncementBar,
  updateAnnouncementBar,
} from "@/server/services/announcement.service";
import { getAdminSession } from "@/server/auth";
import { logAuditEvent } from "@/server/services/audit.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const config = await getAnnouncementBar();
    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("GET /api/admin/announcement error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch announcement bar" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { isEnabled, speed, messages } = body;

    if (messages !== undefined && !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, message: "Messages must be an array of text strings" },
        { status: 400 }
      );
    }

    if (Array.isArray(messages)) {
      const validMessages = messages.filter(
        (m: unknown) => typeof m === "string" && m.trim().length > 0
      );
      if (validMessages.length === 0) {
        return NextResponse.json(
          { success: false, message: "At least one non-empty message is required" },
          { status: 400 }
        );
      }
    }

    const updated = await updateAnnouncementBar({
      isEnabled: typeof isEnabled === "boolean" ? isEnabled : undefined,
      speed: typeof speed === "number" ? speed : undefined,
      messages: Array.isArray(messages) ? messages : undefined,
    });

    await logAuditEvent({
      userId: session.id,
      userEmail: session.email,
      action: "UPDATE_ANNOUNCEMENT_BAR",
      entity: "AnnouncementBar",
      entityId: updated.id,
      details: {
        isEnabled: updated.isEnabled,
        speed: updated.speed,
        messageCount: updated.messages.length,
      },
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    });

    return NextResponse.json({
      success: true,
      config: updated,
      message: "Announcement bar updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/admin/announcement error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update announcement bar" },
      { status: 500 }
    );
  }
}
