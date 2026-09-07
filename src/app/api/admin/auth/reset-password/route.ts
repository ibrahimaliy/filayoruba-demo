import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { hashPassword, timingSafeEqualStrings } from "@/server/auth";
import { checkRateLimitDistributed, getClientIp } from "@/server/rate-limit";
import { logAuditEvent } from "@/server/services/audit.service";
import { redisGet, redisSet, redisDel } from "@/server/redis";

export const dynamic = "force-dynamic";

interface PasswordResetRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  adminId: string;
  email: string;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // 1. Rate limit reset attempts (10 attempts per 15 mins per IP)
  const rateLimit = await checkRateLimitDistributed(
    `admin_reset_pw:${ip}`,
    10,
    15 * 60 * 1000
  );

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        message: `Too many password reset attempts. Please wait ${rateLimit.resetSeconds} seconds before trying again.`,
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

  const { email, code, newPassword } = body || {};

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json(
      { message: "A valid email address is required." },
      { status: 400 }
    );
  }

  if (!code || typeof code !== "string" || code.trim().length !== 6) {
    return NextResponse.json(
      { message: "A 6-digit verification code is required." },
      { status: 400 }
    );
  }

  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json(
      { message: "New password must be at least 8 characters long." },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const trimmedCode = code.trim();
  const redisKey = `admin_pw_reset:${normalizedEmail}`;

  try {
    // 2. Retrieve OTP record from Redis/memory
    const record = await redisGet<PasswordResetRecord>(redisKey);

    if (!record || Date.now() > record.expiresAt) {
      if (record) {
        await redisDel(redisKey);
      }
      return NextResponse.json(
        { message: "The reset code has expired or is invalid. Please request a new code." },
        { status: 400 }
      );
    }

    // 3. Verify OTP with timing-safe comparison & lockout counter
    const isMatch = timingSafeEqualStrings(record.code, trimmedCode);

    if (!isMatch) {
      const attempts = (record.attempts || 0) + 1;
      if (attempts >= 5) {
        await redisDel(redisKey);
        await logAuditEvent({
          action: "ADMIN_PASSWORD_RESET_LOCKED",
          entity: "Auth",
          userEmail: normalizedEmail,
          ipAddress: ip,
          details: { reason: "Max verification attempts exceeded" },
        });

        return NextResponse.json(
          { message: "Too many incorrect code attempts. This code has been revoked. Please request a new code." },
          { status: 400 }
        );
      }

      const remainingSeconds = Math.max(1, Math.round((record.expiresAt - Date.now()) / 1000));
      await redisSet(redisKey, { ...record, attempts }, remainingSeconds);

      return NextResponse.json(
        { message: `Invalid verification code. ${5 - attempts} attempt(s) remaining.` },
        { status: 400 }
      );
    }

    // 4. Verify account in database
    const adminUser = await db.adminUser.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
      },
    });

    if (!adminUser || !adminUser.isActive) {
      await redisDel(redisKey);
      return NextResponse.json(
        { message: "This administrative account is inactive or does not exist." },
        { status: 403 }
      );
    }

    // 5. Hash new password with PBKDF2 (100,000 iterations) + fresh cryptographic salt
    const salt = crypto.randomUUID();
    const passwordHash = await hashPassword(newPassword, salt);

    await db.adminUser.update({
      where: { id: adminUser.id },
      data: {
        password: passwordHash,
        salt,
      },
    });

    // 6. Consume/Delete OTP record
    await redisDel(redisKey);

    // 7. Audit log
    await logAuditEvent({
      action: "ADMIN_PASSWORD_RESET_SUCCESS",
      entity: "Auth",
      userId: adminUser.id,
      userEmail: adminUser.email,
      ipAddress: ip,
      details: { role: adminUser.role },
    });

    return NextResponse.json({
      success: true,
      message: "Administrator password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Admin reset password error:", error);
    return NextResponse.json(
      { message: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
