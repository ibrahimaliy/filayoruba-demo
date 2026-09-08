import { NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  hashPassword,
  createSessionToken,
  ensureDefaultAdminUser,
  getMasterAdminPassword,
  getDemoAdminPassword,
  timingSafeEqualStrings,
  ADMIN_COOKIE_NAME,
} from "@/server/auth";
import { checkRateLimitDistributed, resetRateLimit, getClientIp } from "@/server/rate-limit";
import { logAuditEvent } from "@/server/services/audit.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const isDev = process.env.NODE_ENV !== "production";
  const maxAttempts = isDev ? 50 : 10;

  // 1. Anti-brute-force distributed rate limit
  const limit = await checkRateLimitDistributed(`admin_login:${ip}`, maxAttempts, 15 * 60 * 1000);
  if (!limit.success) {
    await logAuditEvent({
      action: "ADMIN_LOGIN_RATE_LIMITED",
      entity: "Auth",
      ipAddress: ip,
      details: { resetSeconds: limit.resetSeconds },
    });

    return NextResponse.json(
      { message: `Too many failed login attempts. Please wait ${limit.resetSeconds} seconds before trying again.` },
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON request payload." },
      { status: 400 }
    );
  }

  try {
    const { password, email } = body || {};

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { message: "Password is required." },
        { status: 400 }
      );
    }

    // Ensure database table has default admin user
    await ensureDefaultAdminUser();

    let authenticatedAdmin: { id?: string; email?: string; name?: string; role?: string } | null = null;

    // A. Check database admin users
    const targetEmail = (email && typeof email === "string" && email.trim())
      ? email.toLowerCase().trim()
      : "admin@filayoruba.com";

    const dbAdmin = await db.adminUser.findFirst({
      where: {
        email: { equals: targetEmail, mode: "insensitive" },
      },
    });

    if (dbAdmin) {
      // Guard: Deactivated accounts are strictly forbidden from logging in
      if (!dbAdmin.isActive) {
        await logAuditEvent({
          action: "ADMIN_LOGIN_DEACTIVATED",
          entity: "Auth",
          userId: dbAdmin.id,
          userEmail: dbAdmin.email,
          ipAddress: ip,
          details: { attemptedEmail: targetEmail },
        });

        return NextResponse.json(
          { message: "This administrative account has been deactivated. Please contact an active Super Admin." },
          { status: 403 }
        );
      }

      const computedHash = await hashPassword(password, dbAdmin.salt);
      if (timingSafeEqualStrings(computedHash, dbAdmin.password)) {
        authenticatedAdmin = {
          id: dbAdmin.id,
          email: dbAdmin.email,
          name: dbAdmin.name,
          role: dbAdmin.role,
        };
      }
    }

    // B. Check for dedicated throwaway demo reviewer account
    if (!authenticatedAdmin && targetEmail === "demo@filayoruba.com") {
      const demoPass = getDemoAdminPassword();
      if (timingSafeEqualStrings(password, demoPass)) {
        authenticatedAdmin = {
          id: dbAdmin?.id || "demo-showcase-reviewer",
          email: "demo@filayoruba.com",
          name: "Portfolio Demo Reviewer",
          role: "SUPER_ADMIN",
        };
      }
    }

    // C. Fallback to master admin password (only allowed for break-glass recovery when account is not deactivated)
    if (!authenticatedAdmin && (!dbAdmin || dbAdmin.isActive)) {
      const masterPass = getMasterAdminPassword();
      if (masterPass && timingSafeEqualStrings(password, masterPass)) {
        authenticatedAdmin = {
          id: dbAdmin?.id,
          email: targetEmail || "superadmin@filayoruba.com",
          name: dbAdmin?.name || "Fìlà Yorùbá Master Artisan",
          role: "SUPER_ADMIN",
        };

        if (process.env.NODE_ENV === "production") {
          await logAuditEvent({
            action: "SECURITY_BREAK_GLASS_LOGIN",
            entity: "Auth",
            userEmail: authenticatedAdmin.email,
            ipAddress: ip,
            details: { note: "Master administrative secret key used for login" },
          });
        }
      }
    }

    // If authentication failed
    if (!authenticatedAdmin) {
      await logAuditEvent({
        action: "ADMIN_LOGIN_FAILED",
        entity: "Auth",
        userEmail: targetEmail || "unknown",
        ipAddress: ip,
        details: { attemptedEmail: targetEmail },
      });

      return NextResponse.json(
        { message: "Invalid administrative email or password." },
        { status: 401 }
      );
    }

    // On successful login, clear the rate limit counter for this IP
    resetRateLimit(`admin_login:${ip}`);

    // Create signed session token
    const token = await createSessionToken(authenticatedAdmin);
    const isProduction = process.env.NODE_ENV === "production";

    await logAuditEvent({
      action: "ADMIN_LOGIN_SUCCESS",
      entity: "Auth",
      userId: authenticatedAdmin.id,
      userEmail: authenticatedAdmin.email,
      ipAddress: ip,
      details: { role: authenticatedAdmin.role, name: authenticatedAdmin.name },
    });

    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful",
      user: {
        id: authenticatedAdmin.id,
        email: authenticatedAdmin.email,
        name: authenticatedAdmin.name,
        role: authenticatedAdmin.role,
      },
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
    console.error("Admin login error:", error);
    return NextResponse.json(
      { message: "Authentication failed" },
      { status: 500 }
    );
  }
}
