export type AdminNotificationType =
  | "ORDER_PAID"
  | "ORDER_STATUS"
  | "ORDER_CREATED"
  | "STOCK_LOW"
  | "NEW_REVIEW"
  | "SECURITY_ALERT";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  link?: string;
  priority: NotificationPriority;
  entityId?: string;
  entityType?: "Order" | "Product" | "Review" | "Security";
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface AdminRealtimeEvent {
  event: "notification" | "order:update" | "order:create" | "stock:low" | "review:new";
  data: {
    notification?: AdminNotification;
    order?: Record<string, unknown>;
    productId?: string;
    stock?: number;
    timestamp: string;
  };
}

export type NotificationFilterCategory = "all" | "orders" | "inventory" | "reviews" | "security";
