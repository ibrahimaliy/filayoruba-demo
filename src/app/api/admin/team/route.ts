import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getAdminSession, hashPassword } from "@/server/auth";
import { logAuditEvent } from "@/server/services/audit.service";
import { getClientIp } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/team - List all admin accounts (SUPER_ADMIN only)
 */
export async function GET(req: Request) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Only Super Admins can manage the team." },
        { status: 403 }
      );
    }

    const admins = await db.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(admins);
  } catch (error) {
    console.error("Team list error:", error);
    return NextResponse.json(
      { message: "Failed to fetch admin team." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/team - Create a new Admin or Super Admin user (SUPER_ADMIN only)
 */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Only Super Admins can create team accounts." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, name, password, role } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { message: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { message: "Full name is required (at least 2 characters)." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedRole = role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";

    // Check duplicate
    const existing = await db.adminUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { message: "An administrator with this email already exists." },
        { status: 409 }
      );
    }

    const salt = crypto.randomUUID();
    const passwordHash = await hashPassword(password, salt);

    const newAdmin = await db.adminUser.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        password: passwordHash,
        salt,
        role: normalizedRole,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAuditEvent({
      action: "TEAM_MEMBER_CREATED",
      entity: "Team",
      entityId: newAdmin.id,
      userId: session.id,
      userEmail: session.email,
      ipAddress: ip,
      details: {
        createdAdminEmail: newAdmin.email,
        createdAdminName: newAdmin.name,
        role: newAdmin.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Admin account for ${newAdmin.name} created successfully.`,
      admin: newAdmin,
    });
  } catch (error) {
    console.error("Create admin team member error:", error);
    return NextResponse.json(
      { message: "Failed to create team member." },
      { status: 500 }
    );
  }
}
