import "server-only";
import { AdminNotification, AdminNotificationType, NotificationPriority } from "@/types/notification";
import { db } from "@/server/db";
import { redisPublish, redisSubscribe } from "@/server/redis";

// Global singleton buffer for notifications
declare global {
  // eslint-disable-next-line no-var
  var __filayorubaNotificationsStore: AdminNotification[] | undefined;
}

const notificationsStore: AdminNotification[] = globalThis.__filayorubaNotificationsStore || [];
if (process.env.NODE_ENV !== "production") {
  globalThis.__filayorubaNotificationsStore = notificationsStore;
}

export interface CreateNotificationInput {
  type: AdminNotificationType;
  title: string;
  message: string;
  link?: string;
  priority?: NotificationPriority;
  entityId?: string;
  entityType?: "Order" | "Product" | "Review" | "Security";
  metadata?: Record<string, unknown>;
}

/**
 * Publishes a real-time event across all server instances via Redis/SSE and stores it in history
 */
export async function publishAdminNotification(input: CreateNotificationInput): Promise<AdminNotification> {
  const notification: AdminNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
    priority: input.priority || "medium",
    entityId: input.entityId,
    entityType: input.entityType,
    metadata: input.metadata,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  // Add to local memory buffer (keep up to 200 items)
  notificationsStore.unshift(notification);
  if (notificationsStore.length > 200) {
    notificationsStore.pop();
  }

  // Persist to AuditLog in database for historical continuity asynchronously
  queueMicrotask(async () => {
    try {
      const detailsJson = JSON.parse(
        JSON.stringify({
          title: input.title,
          message: input.message,
          link: input.link,
          priority: notification.priority,
          metadata: input.metadata,
        })
      );

      await db.auditLog.create({
        data: {
          action: `NOTIF_${input.type}`,
          entity: input.entityType || "Notification",
          entityId: input.entityId || notification.id,
          details: detailsJson,
        },
      });
    } catch {
      // Non-blocking
    }
  });

  // Broadcast to all active SSE listeners across instances via Redis / local bus
  await redisPublish("admin_event", {
    type: input.type,
    notification,
    timestamp: notification.createdAt,
  });

  return notification;
}

/**
 * Returns recent notifications and unread counter
 */
export async function listAdminNotifications(): Promise<{
  notifications: AdminNotification[];
  unreadCount: number;
}> {
  const unreadCount = notificationsStore.filter((n) => !n.isRead).length;
  return {
    notifications: [...notificationsStore],
    unreadCount,
  };
}

/**
 * Marks a specific notification as read
 */
export function markNotificationRead(id: string): boolean {
  const target = notificationsStore.find((n) => n.id === id);
  if (target) {
    target.isRead = true;
    return true;
  }
  return false;
}

/**
 * Marks all notifications as read
 */
export function markAllNotificationsRead(): void {
  for (const n of notificationsStore) {
    n.isRead = true;
  }
}

/**
 * Clears all notifications from active memory buffer
 */
export function clearAdminNotifications(): void {
  notificationsStore.length = 0;
}

/**
 * Subscribes to real-time admin events (used by SSE route handler)
 */
export function subscribeToAdminEvents(
  callback: (payload: { type: AdminNotificationType; notification: AdminNotification; timestamp: string }) => void
): () => void {
  return redisSubscribe("admin_event", callback);
}
