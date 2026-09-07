import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sendEmail } from "@/server/services/email.service";
import { renderAdminPasswordResetEmail } from "@/server/email/templates";
import { checkRateLimitDistributed, getClientIp } from "@/server/rate-limit";
import { logAuditEvent } from "@/server/services/audit.service";
import { redisSet } from "@/server/redis";

export const dynamic = "force-dynamic";

/**
 * Generates a cryptographically secure 6-digit OTP
 */
function generateSecureOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const randomNum = 100000 + (array[0] % 900000);
  return randomNum.toString();
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // 1. Anti-abuse rate limit (5 requests per 15 minutes per IP)
  const rateLimit = await checkRateLimitDistributed(
    `admin_forgot_pw:${ip}`,
    5,
    15 * 60 * 1000
  );

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        message: `Too many password reset requests. Please wait ${rateLimit.resetSeconds} seconds before attempting again.`,
      },
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

  const { email } = body || {};
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json(
      { message: "A valid administrator email address is required." },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // 2. Query database for active admin user
    const adminUser = await db.adminUser.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
      },
    });

    // Uniform response to protect against user enumeration
    const genericSuccessResponse = NextResponse.json({
      success: true,
      message:
        "If an active administrator account is associated with this email, a 6-digit reset code has been sent.",
    });

    if (!adminUser || !adminUser.isActive) {
      // Log failed attempt without revealing details to client
      await logAuditEvent({
        action: "ADMIN_PASSWORD_RESET_UNMATCHED",
        entity: "Auth",
        userEmail: normalizedEmail,
        ipAddress: ip,
        details: { attemptedEmail: normalizedEmail, accountExists: !!adminUser },
      });
      return genericSuccessResponse;
    }

    // 3. Generate 6-digit OTP and store with 15-minute expiration
    const code = generateSecureOtp();
    const ttlSeconds = 15 * 60; // 15 minutes
    const expiresAt = Date.now() + ttlSeconds * 1000;

    const record = {
      code,
      expiresAt,
      attempts: 0,
      adminId: adminUser.id,
      email: adminUser.email,
    };

    await redisSet(`admin_pw_reset:${adminUser.email.toLowerCase()}`, record, ttlSeconds);

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `\n🔑 [ADMIN PASSWORD RESET OTP] Email: ${adminUser.email} | Code: ${code} (Expires in 15 mins)\n`
      );
    }

    // 4. Send email notification
    const { subject, html } = renderAdminPasswordResetEmail(adminUser.name, code);
    await sendEmail({
      to: adminUser.email,
      subject,
      html,
    });

    // 5. Audit event
    await logAuditEvent({
      action: "ADMIN_PASSWORD_RESET_REQUESTED",
      entity: "Auth",
      userId: adminUser.id,
      userEmail: adminUser.email,
      ipAddress: ip,
      details: { role: adminUser.role },
    });

    return genericSuccessResponse;
  } catch (error) {
    console.error("Admin forgot password error:", error);
    return NextResponse.json(
      { message: "Unable to process password reset request at this time." },
      { status: 500 }
    );
  }
}
