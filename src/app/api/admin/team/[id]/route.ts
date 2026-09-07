import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getAdminSession, hashPassword } from "@/server/auth";
import { logAuditEvent } from "@/server/services/audit.service";
import { getClientIp } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/team/[id] - Update name, role, active status, or reset password (SUPER_ADMIN only)
 */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Only Super Admins can modify team members." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const { name, role, isActive, password } = body;

    const targetAdmin = await db.adminUser.findUnique({
      where: { id },
    });

    if (!targetAdmin) {
      return NextResponse.json(
        { message: "Admin user not found." },
        { status: 404 }
      );
    }

    // Guard: Cannot deactivate self
    if (isActive === false && session.id === targetAdmin.id) {
      return NextResponse.json(
        { message: "You cannot deactivate your own administrative account." },
        { status: 400 }
      );
    }

    // Guard: If demoting or deactivating a SUPER_ADMIN, ensure at least one other active SUPER_ADMIN exists
    if (
      targetAdmin.role === "SUPER_ADMIN" &&
      (role === "ADMIN" || isActive === false)
    ) {
      const activeSuperAdmins = await db.adminUser.count({
        where: { role: "SUPER_ADMIN", isActive: true },
      });

      if (activeSuperAdmins <= 1) {
        return NextResponse.json(
          {
            message: "Cannot modify or deactivate the only active Super Admin account in the system.",
          },
          { status: 400 }
        );
      }
    }

    const updateData: {
      name?: string;
      role?: string;
      isActive?: boolean;
      password?: string;
      salt?: string;
    } = {};

    if (typeof name === "string" && name.trim().length >= 2) {
      updateData.name = name.trim();
    }

    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      updateData.role = role;
    }

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    if (typeof password === "string" && password.length >= 8) {
      const salt = crypto.randomUUID();
      updateData.password = await hashPassword(password, salt);
      updateData.salt = salt;
    }

    const updated = await db.adminUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await logAuditEvent({
      action: "TEAM_MEMBER_UPDATED",
      entity: "Team",
      entityId: updated.id,
      userId: session.id,
      userEmail: session.email,
      ipAddress: ip,
      details: {
        updatedAdminEmail: updated.email,
        changes: {
          role: updateData.role,
          isActive: updateData.isActive,
          name: updateData.name,
          passwordReset: Boolean(updateData.password),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Admin ${updated.name} updated successfully.`,
      admin: updated,
    });
  } catch (error) {
    console.error("Update team member error:", error);
    return NextResponse.json(
      { message: "Failed to update team member." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/team/[id] - Permanently delete an admin user (SUPER_ADMIN only)
 */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Only Super Admins can remove team accounts." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const targetAdmin = await db.adminUser.findUnique({
      where: { id },
    });

    if (!targetAdmin) {
      return NextResponse.json(
        { message: "Admin user not found." },
        { status: 404 }
      );
    }

    // Guard: Cannot delete self
    if (session.id === targetAdmin.id) {
      return NextResponse.json(
        { message: "You cannot delete your own administrative account." },
        { status: 400 }
      );
    }

    // Guard: If deleting a SUPER_ADMIN, ensure at least one other active SUPER_ADMIN exists
    if (targetAdmin.role === "SUPER_ADMIN") {
      const superAdminsCount = await db.adminUser.count({
        where: { role: "SUPER_ADMIN" },
      });

      if (superAdminsCount <= 1) {
        return NextResponse.json(
          { message: "Cannot delete the only Super Admin account in the system." },
          { status: 400 }
        );
      }
    }

    await db.adminUser.delete({
      where: { id },
    });

    await logAuditEvent({
      action: "TEAM_MEMBER_DELETED",
      entity: "Team",
      entityId: id,
      userId: session.id,
      userEmail: session.email,
      ipAddress: ip,
      details: {
        deletedAdminEmail: targetAdmin.email,
        deletedAdminName: targetAdmin.name,
        role: targetAdmin.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Admin account for ${targetAdmin.name} (${targetAdmin.email}) deleted.`,
    });
  } catch (error) {
    console.error("Delete team member error:", error);
    return NextResponse.json(
      { message: "Failed to delete team member." },
      { status: 500 }
    );
  }
}
