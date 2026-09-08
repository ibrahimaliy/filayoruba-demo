import { NextResponse } from "next/server";
import {
  createSessionToken,
  ensureDefaultAdminUser,
  getDemoAdminPassword,
  timingSafeEqualStrings,
  ADMIN_COOKIE_NAME,
} from "@/server/auth";
import { checkRateLimitDistributed, getClientIp } from "@/server/rate-limit";
import { logAuditEvent } from "@/server/services/audit.service";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/auth/demo-login
 * Provides 1-Click Sandbox access for portfolio reviewers and evaluators
 * without exposing or requiring any production administrator credentials.
 * Gated strictly by ENABLE_DEMO_LOGIN="true".
 */
export async function POST(req: Request) {
  // 1. Guard: Demo login must be explicitly enabled via environment variable
  if (process.env.ENABLE_DEMO_LOGIN !== "true") {
    return NextResponse.json(
      { message: "Demo login is disabled in this environment." },
      { status: 403 }
    );
  }

  const ip = getClientIp(req);

  // 2. Distributed rate limiting for demo access (30 attempts per 15 minutes per IP)
  const limit = await checkRateLimitDistributed(`demo_login:${ip}`, 30, 15 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      { message: `Too many demo login requests. Please try again in ${limit.resetSeconds} seconds.` },
      { status: 429 }
    );
  }

  // 3. Require password in request body and verify against getDemoAdminPassword()
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Password is required for demo login." },
      { status: 401 }
    );
  }

  const { password } = body || {};
  if (!password || typeof password !== "string") {
    return NextResponse.json(
      { message: "Password is required for demo login." },
      { status: 401 }
    );
  }

  const expectedPassword = getDemoAdminPassword();
  if (!timingSafeEqualStrings(password, expectedPassword)) {
    return NextResponse.json(
      { message: "Invalid demo credentials." },
      { status: 401 }
    );
  }

  try {
    // Ensure default admin & demo accounts exist in PostgreSQL
    await ensureDefaultAdminUser();

    // Query or fallback to demo reviewer payload
    let demoUser = await db.adminUser.findFirst({
      where: { email: { equals: "demo@filayoruba.com", mode: "insensitive" } },
    });

    const reviewerPayload = {
      id: demoUser?.id || "demo-showcase-reviewer",
      email: "demo@filayoruba.com",
      name: "Portfolio Demo Reviewer",
      role: "SUPER_ADMIN" as const,
    };

    // Create signed cryptographic session token
    const token = await createSessionToken(reviewerPayload);
    const isProduction = process.env.NODE_ENV === "production";

    await logAuditEvent({
      action: "DEMO_ONE_CLICK_LOGIN",
      entity: "Auth",
      userId: reviewerPayload.id,
      userEmail: reviewerPayload.email,
      ipAddress: ip,
      details: { role: reviewerPayload.role, note: "Verified 1-Click portfolio sandbox access" },
    });

    const response = NextResponse.json({
      success: true,
      message: "Welcome to the Fìlà Yorùbá Demo Sandbox!",
      user: reviewerPayload,
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Demo login error:", error);
    return NextResponse.json(
      { message: "Could not initialize demo sandbox session." },
      { status: 500 }
    );
  }
}
