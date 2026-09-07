import { CartItem } from "./cart";

export type SalesChannel =
  | "ONLINE_STORE"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "X"
  | "WALK_IN";

/**
 * Canonical Order Lifecycle (Fulfillment):
 * pending -> confirmed -> crafting -> shipped -> delivered (or cancelled).
 *
 * NOTE: Financial state is tracked strictly by PaymentStatus (unpaid, pending, partially_paid, paid, failed, refunded).
 * "paid" and "failed" are kept strictly for backward-compatible mapping of legacy pre-migration database rows.
 */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "crafting"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "paid"    // Legacy mapping support only
  | "failed";  // Legacy mapping support only

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "partially_paid"
  | "failed"
  | "refunded";

export type PaymentMethod =
  | "PAYSTACK"
  | "BANK_TRANSFER"
  | "CASH"
  | "POS";

export type PaymentProvider =
  | "PAYSTACK"
  | "INTERNAL";

export type FulfillmentType =
  | "delivery"
  | "pickup";

export type RefundStatus =
  | "not_refunded"
  | "pending"
  | "partially_refunded"
  | "refunded";

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider: PaymentProvider;
  status: PaymentStatus;
  reference?: string;
  paidAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  salesChannel: SalesChannel;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentType: FulfillmentType;
  refundStatus: RefundStatus;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  amountPaid: number;
  amountDue: number; // Computed derived value: Math.max(0, total - amountPaid)
  amountRefunded: number;
  customer: {
    id?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    instagramHandle?: string;
    xHandle?: string;
  };
  address: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  payments?: PaymentRecord[];
  paymentReference?: string;
  paymentMethod?: string;
  createdAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  cancelledBy?: "customer" | "admin";
  cancelReason?: string;
  stockRestored?: boolean;
  clientRequestId?: string;
  createdById?: string;
  internalNotes?: string;
}