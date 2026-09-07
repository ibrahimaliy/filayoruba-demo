import { NextResponse } from "next/server";
import { getAdminSession } from "@/server/auth";
import { listAuditLogs, getAuditStats } from "@/server/services/audit.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const entity = searchParams.get("entity") || undefined;
    const action = searchParams.get("action") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "40", 10);

    const [auditData, stats] = await Promise.all([
      listAuditLogs({ search, entity, action, page, limit }),
      getAuditStats(),
    ]);

    return NextResponse.json({
      success: true,
      ...auditData,
      stats,
    });
  } catch (error) {
    console.error("Admin activity log route error:", error);
    return NextResponse.json(
      { message: "Failed to retrieve activity logs." },
      { status: 500 }
    );
  }
}
