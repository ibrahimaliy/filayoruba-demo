import "server-only";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client";
import { publishAdminNotification } from "./notification.service";

export interface AuditEventParams {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  details?: Record<string, unknown> | null;
  ipAddress?: string;
}

export interface ListAuditLogsOptions {
  search?: string;
  entity?: string;
  action?: string;
  page?: number;
  limit?: number;
}

/**
 * Appends an audit record to the database for security and administrative traceability
 */
export async function logAuditEvent(params: AuditEventParams) {
  try {
    const detailsJson = params.details
      ? (JSON.parse(JSON.stringify(params.details)) as Prisma.InputJsonValue)
      : undefined;

    // Trigger real-time alert for security anomaly events
    if (params.action.startsWith("SECURITY_")) {
      publishAdminNotification({
        type: "SECURITY_ALERT",
        priority: "urgent",
        title: `🚨 Security Alert: ${params.action.replace("SECURITY_", "")}`,
        message: `Security anomaly detected on ${params.entity} #${params.entityId || "N/A"}.`,
        link: `/admin/activity`,
        entityId: params.entityId,
        entityType: "Security",
        metadata: {
          action: params.action,
          ipAddress: params.ipAddress,
          userEmail: params.userEmail,
          details: params.details,
        },
      }).catch(() => {});
    }

    return await db.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: params.userId,
        userEmail: params.userEmail,
        details: detailsJson,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    // Audit logging should never crash the main transaction
    console.error("Failed to write audit log:", error);
    return null;
  }
}

/**
 * Lists audit logs with optional search, entity filtering, and pagination
 */
export async function listAuditLogs(options: ListAuditLogsOptions = {}) {
  const { search, entity, action, page = 1, limit = 40 } = options;
  const skip = (Math.max(1, page) - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {};

  if (entity && entity !== "all") {
    where.entity = { equals: entity, mode: "insensitive" };
  }

  if (action && action !== "all") {
    where.action = { equals: action, mode: "insensitive" };
  }

  if (search && search.trim()) {
    const query = search.trim();
    where.OR = [
      { action: { contains: query, mode: "insensitive" } },
      { entity: { contains: query, mode: "insensitive" } },
      { entityId: { contains: query, mode: "insensitive" } },
      { userEmail: { contains: query, mode: "insensitive" } },
      { ipAddress: { contains: query, mode: "insensitive" } },
    ];
  }

  try {
    const [total, logs] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      hasMore: skip + logs.length < total,
    };
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return {
      logs: [],
      total: 0,
      page: 1,
      totalPages: 1,
      hasMore: false,
    };
  }
}

/**
 * Returns summary statistics for administrative activities
 */
export async function getAuditStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalEvents, todayEvents, authEvents, orderEvents] = await Promise.all([
      db.auditLog.count(),
      db.auditLog.count({ where: { createdAt: { gte: today } } }),
      db.auditLog.count({ where: { entity: { in: ["Auth", "Team"] } } }),
      db.auditLog.count({ where: { entity: "Order" } }),
    ]);

    return {
      totalEvents,
      todayEvents,
      authEvents,
      orderEvents,
    };
  } catch (error) {
    console.error("Failed to compute audit stats:", error);
    return {
      totalEvents: 0,
      todayEvents: 0,
      authEvents: 0,
      orderEvents: 0,
    };
  }
}

