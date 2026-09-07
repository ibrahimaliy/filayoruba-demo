import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminSession } from "@/server/auth";
import { logAuditEvent } from "@/server/services/audit.service";
import { getClientIp } from "@/server/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const session = await getAdminSession(req);

  if (session) {
    await logAuditEvent({
      action: "ADMIN_LOGOUT",
      entity: "Auth",
      userId: session.id,
      userEmail: session.email,
      ipAddress: ip,
      details: { role: session.role },
    });
  }

  const response = NextResponse.json({
    success: true,
    message: "Admin logged out successfully",
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

