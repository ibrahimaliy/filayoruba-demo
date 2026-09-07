import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/server/auth";
import {
  listAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAdminNotifications,
} from "@/server/services/notification.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const data = await listAdminNotifications();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("GET /api/admin/notifications error:", error);
    return NextResponse.json(
      { message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, all } = body;

    if (all) {
      markAllNotificationsRead();
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (id && typeof id === "string") {
      const updated = markNotificationRead(id);
      return NextResponse.json({ success: updated });
    }

    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/admin/notifications error:", error);
    return NextResponse.json(
      { message: "Failed to update notification." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    clearAdminNotifications();
    return NextResponse.json({ success: true, message: "Notifications cleared." });
  } catch (error) {
    console.error("DELETE /api/admin/notifications error:", error);
    return NextResponse.json(
      { message: "Failed to clear notifications." },
      { status: 500 }
    );
  }
}
