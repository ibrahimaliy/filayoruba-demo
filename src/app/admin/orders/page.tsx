"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  CheckSquare,
  Square,
  ShoppingBag,
  CreditCard,
  Sparkles,
  Truck,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  Ban,
  Radio,
  Filter,
  XCircle,
  AlertCircle,
  Download,
  Plus,
  Store,
  MessageSquare,
} from "lucide-react";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function TwitterIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </svg>
  );
}

import { Order, OrderStatus } from "@/types/order";
import ConfirmDialog, { ConfirmDialogVariant } from "@/components/admin/ConfirmDialog";
import AdminPagination from "@/components/admin/AdminPagination";
import CreateOrderDrawer from "@/components/admin/CreateOrderDrawer";
import { AdminNotification } from "@/types/notification";
import { toast } from "sonner";

const statusColors: Record<OrderStatus, { bg: string; text: string; dot: string; label: string }> = {
  pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500", label: "Pending Payment" },
  confirmed: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500", label: "Confirmed" },
  paid: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500", label: "Confirmed & Paid" },
  crafting: { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", dot: "bg-purple-500", label: "In Crafting" },
  shipped: { bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", dot: "bg-indigo-500", label: "Dispatched / Shipped" },
  delivered: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", label: "Delivered" },
  cancelled: { bg: "bg-slate-100 border-slate-200", text: "text-slate-600", dot: "bg-slate-400", label: "Cancelled" },
  failed: { bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "bg-red-500", label: "Payment Failed" },
};

const channelBadges: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  ONLINE_STORE: { label: "Online Store", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  WHATSAPP: { label: "WhatsApp", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  INSTAGRAM: { label: "Instagram", bg: "bg-fuchsia-50 border-fuchsia-200", text: "text-fuchsia-700", dot: "bg-fuchsia-500" },
  X: { label: "X (Twitter)", bg: "bg-slate-100 border-slate-300", text: "text-slate-800", dot: "bg-slate-600" },
  WALK_IN: { label: "Walk-in", bg: "bg-amber-50 border-amber-200", text: "text-amber-800", dot: "bg-amber-500" },
};

const paymentStatusBadges: Record<string, { label: string; bg: string; text: string }> = {
  paid: { label: "Paid", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  partially_paid: { label: "Partially Paid", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  pending: { label: "Awaiting Verification", bg: "bg-sky-50 border-sky-200", text: "text-sky-700" },
  unpaid: { label: "Unpaid Hold", bg: "bg-rose-50 border-rose-200", text: "text-rose-700" },
  failed: { label: "Failed", bg: "bg-red-50 border-red-200", text: "text-red-700" },
  refunded: { label: "Refunded", bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
};

// Helper to display dates from YYYY-MM-DD strings safely without timezone shifts
const formatDateDisplay = (ymd: string, includeYear = true) => {
  if (!ymd) return "";
  const parts = ymd.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return ymd;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
  });
};

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "trash">("pipeline");
  const [orders, setOrders] = useState<Order[]>([]);
  const [trashedOrders, setTrashedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>("all");
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);

  // Manual payment recording inside order details modal
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [manualPayAmount, setManualPayAmount] = useState<number>(0);
  const [manualPayMethod, setManualPayMethod] = useState<"BANK_TRANSFER" | "CASH" | "POS" | "PAYSTACK">("BANK_TRANSFER");
  const [manualPayRef, setManualPayRef] = useState("");
  const [manualPayNotes, setManualPayNotes] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [datePreset, setDatePreset] = useState<"all" | "today" | "week" | "month" | "lastMonth" | "last30" | "year" | "custom">("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [isBulkVerifying, setIsBulkVerifying] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedRef, setCopiedRef] = useState(false);
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 18-Column Omnichannel CSV Export
  const exportToCSV = () => {
    const headers = [
      "Order Number",
      "Created Date",
      "Sales Channel",
      "Order Status",
      "Payment Status",
      "Payment Method",
      "Fulfillment Type",
      "Customer Name",
      "Customer Phone",
      "Customer Email",
      "Subtotal",
      "Discount",
      "Shipping Fee",
      "Total",
      "Amount Paid",
      "Amount Due",
      "Amount Refunded",
      "Payment Reference",
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber || o.id}"`,
      `"${o.createdAt ? new Date(o.createdAt).toISOString() : ""}"`,
      `"${o.salesChannel || "ONLINE_STORE"}"`,
      `"${o.status.toUpperCase()}"`,
      `"${(o.paymentStatus || "unpaid").toUpperCase()}"`,
      `"${o.paymentMethod || "N/A"}"`,
      `"${(o.fulfillmentType || "delivery").toUpperCase()}"`,
      `"${(`${o.customer?.firstName || ""} ${o.customer?.lastName || ""}`).trim()}"`,
      `"${o.customer?.phone || ""}"`,
      `"${o.customer?.email || ""}"`,
      (Number(o.subtotal) || 0).toFixed(2),
      (Number(o.discount) || 0).toFixed(2),
      (Number(o.shipping) || 0).toFixed(2),
      (Number(o.total) || 0).toFixed(2),
      (Number(o.amountPaid) || 0).toFixed(2),
      (Number(o.amountDue) || 0).toFixed(2),
      (Number(o.amountRefunded) || 0).toFixed(2),
      `"${o.paymentReference || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `filayoruba-omnichannel-orders-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: ConfirmDialogVariant;
    isLoading?: boolean;
    itemCount?: number;
    highlightText?: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const json = await res.json();
        setOrders(json);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrashedOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders?status=trash");
      if (res.ok) {
        const json = await res.json();
        setTrashedOrders(json);
      }
    } catch (err) {
      console.error("Failed to load trashed orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersSilent = useCallback(async (highlightId?: string) => {
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const json = await res.json();
        setOrders(json);
      }
      if (highlightId) {
        setRecentlyUpdatedIds((prev) => new Set(prev).add(highlightId));
        setTimeout(() => {
          setRecentlyUpdatedIds((prev) => {
            const next = new Set(prev);
            next.delete(highlightId);
            return next;
          });
        }, 7000);
      }
    } catch (err) {
      console.error("Failed to silently sync orders:", err);
    }
  }, []);

  const reloadData = () => {
    setSelectedIds([]);
    fetchOrders();
    fetchTrashedOrders();
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Listen for instant push updates from Server-Sent Events / BroadcastChannel
  useEffect(() => {
    const handleLiveOrderUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<AdminNotification>;
      const entityId =
        customEvent.detail?.entityId ||
        (customEvent.detail?.metadata?.orderNumber as string) ||
        "";
      fetchOrdersSilent(entityId);
    };

    window.addEventListener("filayoruba:order-updated", handleLiveOrderUpdate);
    return () => {
      window.removeEventListener("filayoruba:order-updated", handleLiveOrderUpdate);
    };
  }, [fetchOrdersSilent]);

  const formatNaira = (amount: number) => {
    return `₦${(amount || 0).toLocaleString("en-NG")}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
    toast.success("Copied to Clipboard", {
      description: "Paystack reference copied successfully.",
    });
  };

  const handleRecordManualPayment = async (orderId: string) => {
    if (!manualPayAmount || manualPayAmount <= 0) {
      toast.error("Invalid Amount", { description: "Please enter a valid positive payment amount." });
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const res = await fetch(`/api/admin/orders/${orderId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: manualPayAmount,
          method: manualPayMethod,
          reference: manualPayRef,
          notes: manualPayNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to record payment");
      }

      toast.success("Payment Recorded", {
        description: `₦${manualPayAmount.toLocaleString()} payment successfully recorded via ${manualPayMethod.replace("_", " ")}.`,
      });

      setIsRecordingPayment(false);
      setManualPayRef("");
      setManualPayNotes("");
      if (data.order) {
        setSelectedOrder(data.order);
      }
      reloadData();
    } catch (err: any) {
      console.error("Payment recording error:", err);
      toast.error("Payment Error", { description: err.message || "Failed to record payment" });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus,
    override = false
  ) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          overridePaymentGuard: override,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = data.order;
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? (updated || { ...o, status: newStatus }) : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updated || { ...selectedOrder, status: newStatus });
        }
        toast.success("Order Status Updated", {
          description: `Order #${updated?.orderNumber || orderId} status changed to ${newStatus.toUpperCase()}.`,
        });
      } else {
        const err = await res.json();
        if (err.requiresOverride) {
          setConfirmDialog({
            isOpen: true,
            title: "Unpaid Order Notice",
            description: `This order has an unconfirmed payment or balance due. Do you want to advance it to ${newStatus.toUpperCase()} anyway?`,
            confirmLabel: `Yes, Advance to ${newStatus.toUpperCase()}`,
            variant: "warning",
            onConfirm: async () => {
              await handleStatusChange(orderId, newStatus, true);
            },
          });
        } else {
          toast.error("Status Update Failed", {
            description: err.message || "Failed to update order status.",
          });
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Network Error", {
        description: "An error occurred while updating order status.",
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Paystack Live Verification Check for Single Order
  const verifyPaystackOrder = async (order: Order) => {
    try {
      setVerifyingId(order.id);
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-paystack" }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Payment Verified", {
          description: `Order #${order.orderNumber} confirmed as PAID via Paystack gateway.`,
        });
        if (selectedOrder?.id === order.id && data.order) {
          setSelectedOrder(data.order);
        }
        reloadData();
      } else {
        toast.warning("Verification Pending", {
          description: data.message || "Payment has not been completed by customer.",
        });
      }
    } catch (err) {
      console.error("Paystack verification error:", err);
      toast.error("Verification Error", {
        description: "Failed to connect to Paystack verification API.",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  // Bulk Paystack Verification for Selected Orders
  const handleBulkPaystackVerify = async () => {
    const pendingInSelection = orders.filter(
      (o) => selectedIds.includes(o.id) && (o.status === "pending" || o.status === "failed")
    );

    if (pendingInSelection.length === 0) return;

    try {
      setIsBulkVerifying(true);
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-paystack",
          ids: pendingInSelection.map((o) => o.id),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Bulk Paystack Verified", {
          description: data.message || `${pendingInSelection.length} orders checked.`,
        });
        reloadData();
      } else {
        toast.error("Verification Failed", {
          description: "Bulk Paystack verification could not complete.",
        });
      }
    } catch {
      toast.error("Network Error", {
        description: "Network error during bulk Paystack verification.",
      });
    } finally {
      setIsBulkVerifying(false);
    }
  };

  const currentList = activeTab === "pipeline" ? orders : trashedOrders;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  // Order Cancellation Dialogs with Stock Restoration
  const promptCancelOrder = (order: Order) => {
    setConfirmDialog({
      isOpen: true,
      title: `Cancel Order #${order.orderNumber}?`,
      description: `This will mark the order as CANCELLED. Any previously reserved or deducted cap inventory will automatically be restored to the live catalog.`,
      confirmLabel: "Cancel Order & Restore Stock",
      variant: "danger",
      highlightText: order.orderNumber,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/orders/${order.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "cancel",
              reason: "Cancelled by Admin in Dashboard",
            }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Order Cancelled", {
              description: `Order #${order.orderNumber} cancelled and stock restored to catalog.`,
            });
            if (selectedOrder && selectedOrder.id === order.id) {
              setSelectedOrder(
                data.order || {
                  ...selectedOrder,
                  status: "cancelled",
                  stockRestored: true,
                  cancelledBy: "admin",
                  cancelledAt: new Date().toISOString(),
                }
              );
            }
            reloadData();
          } else {
            toast.error("Cancellation Failed", {
              description: data.message || "Failed to cancel order.",
            });
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const promptBulkCancel = () => {
    setConfirmDialog({
      isOpen: true,
      title: `Cancel ${selectedIds.length} Selected Orders?`,
      description: `All selected orders will be marked as CANCELLED, and all reserved cap inventory will automatically be restored to the catalog.`,
      confirmLabel: "Cancel Orders & Restore Stock",
      variant: "danger",
      itemCount: selectedIds.length,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/orders/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "cancel", ids: selectedIds }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Bulk Cancellation Complete", {
              description: data.message || `${selectedIds.length} orders cancelled and stock restored.`,
            });
            reloadData();
          } else {
            toast.error("Bulk Action Failed", {
              description: data.message || "Failed to cancel orders.",
            });
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Trash & Delete Dialogs
  const promptTrashOrder = (order: Order) => {
    setConfirmDialog({
      isOpen: true,
      title: "Move Order to Trash?",
      description: `Order ${order.orderNumber} will be moved to the Trash Bin. You can restore it anytime.`,
      confirmLabel: "Move to Trash",
      variant: "danger",
      highlightText: order.orderNumber,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/orders/${order.id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            toast.success("Moved to Trash", {
              description: `Order #${order.orderNumber} moved to Trash Bin.`,
            });
            if (selectedOrder?.id === order.id) setSelectedOrder(null);
            reloadData();
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const promptRestoreOrder = (order: Order) => {
    setConfirmDialog({
      isOpen: true,
      title: "Restore Order?",
      description: `Order ${order.orderNumber} will be restored to the active fulfillment pipeline.`,
      confirmLabel: "Restore Order",
      variant: "info",
      highlightText: order.orderNumber,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/orders/${order.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "restore" }),
          });
          if (res.ok) {
            toast.success("Order Restored", {
              description: `Order #${order.orderNumber} restored to fulfillment pipeline.`,
            });
            reloadData();
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const promptPermanentDeleteOrder = (order: Order) => {
    setConfirmDialog({
      isOpen: true,
      title: "Permanently Delete Order?",
      description: `Are you sure you want to permanently delete order ${order.orderNumber}? This will wipe customer & item history.`,
      confirmLabel: "Wipe Permanently",
      variant: "danger",
      highlightText: "Permanent Data Loss",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/orders/${order.id}?hard=true`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Order Permanently Deleted", {
              description: `Order #${order.orderNumber} wiped from database.`,
            });
            if (selectedOrder?.id === order.id) setSelectedOrder(null);
            reloadData();
          } else {
            toast.error("Deletion Failed", {
              description: data.message || "Failed to delete order.",
            });
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const promptBulkTrash = () => {
    setConfirmDialog({
      isOpen: true,
      title: `Move ${selectedIds.length} Orders to Trash?`,
      description: "Selected orders will be moved to the Trash Bin.",
      confirmLabel: "Move Selected to Trash",
      variant: "danger",
      itemCount: selectedIds.length,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/orders/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "trash", ids: selectedIds }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Bulk Trash Complete", {
              description: data.message || `${selectedIds.length} orders moved to trash.`,
            });
            reloadData();
          } else {
            toast.error("Bulk Action Failed", {
              description: data.message || "Failed to move orders to trash.",
            });
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const promptBulkRestore = () => {
    setConfirmDialog({
      isOpen: true,
      title: `Restore ${selectedIds.length} Orders?`,
      description: "Selected orders will be restored back into the active fulfillment pipeline.",
      confirmLabel: "Restore Selected",
      variant: "info",
      itemCount: selectedIds.length,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/orders/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "restore", ids: selectedIds }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Bulk Restore Complete", {
              description: data.message || `${selectedIds.length} orders restored.`,
            });
            reloadData();
          } else {
            toast.error("Bulk Restore Failed", {
              description: data.message || "Failed to restore orders.",
            });
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const promptBulkPermanentDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: `Permanently Delete ${selectedIds.length} Orders?`,
      description: "These order records will be permanently erased from the database.",
      confirmLabel: "Wipe Permanently",
      variant: "danger",
      itemCount: selectedIds.length,
      highlightText: "Irreversible Action",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/orders/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete", ids: selectedIds }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Bulk Delete Complete", {
              description: data.message || `${selectedIds.length} orders permanently deleted.`,
            });
            reloadData();
          } else {
            toast.error("Bulk Delete Failed", {
              description: data.message || "Failed to permanently delete orders.",
            });
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const promptEmptyTrash = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Empty Entire Orders Trash?",
      description: `All ${trashedOrders.length} orders in the trash bin will be permanently erased.`,
      confirmLabel: "Empty Trash",
      variant: "danger",
      itemCount: trashedOrders.length,
      highlightText: "Permanent Wipe",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/orders/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "empty-trash" }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Trash Emptied", {
              description: data.message || "All items in orders trash bin erased.",
            });
            reloadData();
          } else {
            toast.error("Empty Trash Failed", {
              description: data.message || "Failed to empty trash.",
            });
          }
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleBulkStatusChange = async (status: OrderStatus) => {
    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", ids: selectedIds, status }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Bulk Status Updated", {
          description: data.message || `Orders status updated to ${status.toUpperCase()}.`,
        });
        reloadData();
      }
    } catch {
      toast.error("Update Error", {
        description: "Failed to update orders status.",
      });
    }
  };

  const applyDatePreset = (preset: "all" | "today" | "week" | "month" | "lastMonth" | "last30" | "year") => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
      return;
    }

    const formatYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "today") {
      const todayStr = formatYMD(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "week") {
      const d = new Date(now);
      const day = d.getDay();
      const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
      const endOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday + 6);
      setStartDate(formatYMD(startOfWeek));
      setEndDate(formatYMD(endOfWeek));
    } else if (preset === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(formatYMD(startOfMonth));
      setEndDate(formatYMD(endOfMonth));
    } else if (preset === "lastMonth") {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(formatYMD(startOfLastMonth));
      setEndDate(formatYMD(endOfLastMonth));
    } else if (preset === "last30") {
      const past30 = new Date(now);
      past30.setDate(past30.getDate() - 30);
      setStartDate(formatYMD(past30));
      setEndDate(formatYMD(now));
    } else if (preset === "year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      setStartDate(formatYMD(startOfYear));
      setEndDate(formatYMD(endOfYear));
    }
  };

  const filteredOrders = useMemo(() => {
    return currentList.filter((o) => {
      // 1. Status Filter
      const matchesStatus =
        statusFilter === "all" || o.status === statusFilter;

      // 2. Exact Calendar Date / Date Range Filter (Timezone-safe)
      let matchesDate = true;
      if (startDate || endDate) {
        if (!o.createdAt) {
          matchesDate = false;
        } else {
          const orderDate = new Date(o.createdAt);
          if (isNaN(orderDate.getTime())) {
            matchesDate = false;
          } else {
            if (startDate) {
              const [sY, sM, sD] = startDate.split("-").map(Number);
              const start = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
              if (orderDate < start) matchesDate = false;
            }
            if (endDate && matchesDate) {
              const [eY, eM, eD] = endDate.split("-").map(Number);
              const end = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
              if (orderDate > end) matchesDate = false;
            }
          }
        }
      }

      // 3. Search Filter
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (o.orderNumber || "").toLowerCase().includes(q) ||
        (o.paymentReference && o.paymentReference.toLowerCase().includes(q)) ||
        `${o.customer?.firstName || ""} ${o.customer?.lastName || ""}`.toLowerCase().includes(q) ||
        (o.customer?.email || "").toLowerCase().includes(q) ||
        (o.customer?.phone && o.customer.phone.includes(q));

      // 4. Sales Channel Filter
      const matchesChannel =
        channelFilter === "all" || o.salesChannel === channelFilter;

      // 5. Payment Status Filter
      const matchesPaymentStatus =
        paymentStatusFilter === "all" || o.paymentStatus === paymentStatusFilter;

      // 6. Fulfillment Filter
      const matchesFulfillment =
        fulfillmentFilter === "all" || o.fulfillmentType === fulfillmentFilter;

      return (
        matchesStatus &&
        matchesChannel &&
        matchesPaymentStatus &&
        matchesFulfillment &&
        matchesDate &&
        matchesSearch
      );
    });
  }, [currentList, statusFilter, channelFilter, paymentStatusFilter, fulfillmentFilter, startDate, endDate, search]);

  // Reset to page 1 whenever filters or tabs change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, channelFilter, paymentStatusFilter, fulfillmentFilter, startDate, endDate, search]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const isAllSelected =
    filteredOrders.length > 0 && selectedIds.length === filteredOrders.length;

  const selectedPendingCount = orders.filter(
    (o) => selectedIds.includes(o.id) && (o.status === "pending" || o.status === "failed")
  ).length;

  const selectedPaidCount = orders.filter(
    (o) => selectedIds.includes(o.id) && o.status !== "pending" && o.status !== "failed"
  ).length;

  return (
    <div className="space-y-8 animate-fade-in relative pb-16">
      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        itemCount={confirmDialog.itemCount}
        highlightText={confirmDialog.highlightText}
      />      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#000000]">
            Order Fulfillment Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track artisan crafting progress, verify Paystack gateway payments, and manage fulfillment lifecycles.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => setIsCreateOrderOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Order</span>
          </button>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-all cursor-pointer"
            title="Download 18-column CSV export"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={reloadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setActiveTab("pipeline");
              setSelectedIds([]);
            }}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "pipeline"
                ? "bg-[#000000] text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Active Orders ({orders.length})
          </button>

          <button
            onClick={() => {
              setActiveTab("trash");
              setSelectedIds([]);
            }}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "trash"
                ? "bg-red-600 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-red-50 hover:text-red-600"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Trash Bin ({trashedOrders.length})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto flex-wrap">
          {/* Sales Channel Filter */}
          {activeTab === "pipeline" && (
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
              <Store className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#000000] focus:outline-none cursor-pointer pr-4"
              >
                <option value="all">All Channels</option>
                <option value="ONLINE_STORE">Online Store</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="X">X (Twitter)</option>
                <option value="WALK_IN">Walk-in</option>
              </select>
            </div>
          )}

          {/* Payment Status Filter */}
          {activeTab === "pipeline" && (
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-400 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#000000] focus:outline-none cursor-pointer pr-4"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="pending">Awaiting Verification</option>
                <option value="unpaid">Unpaid Hold</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 flex-1 sm:w-52">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search FY-..., customer, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Exact Calendar Date Range Filter & Presets */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs hover:border-[#FED501]/50 focus-within:border-[#FED501] focus-within:ring-2 focus-within:ring-[#FED501]/20 transition-all flex-wrap">
            {/* Presets Dropdown */}
            <div className="flex items-center pl-2 pr-1 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-[#FED501] mr-1.5 shrink-0" />
              <select
                value={datePreset}
                onChange={(e) =>
                  applyDatePreset(e.target.value as "all" | "today" | "week" | "month" | "lastMonth" | "last30" | "year")
                }
                className="bg-transparent text-xs font-bold text-[#000000] focus:outline-none cursor-pointer pr-6"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="last30">Last 30 Days</option>
                <option value="year">This Year</option>
                {datePreset === "custom" && <option value="custom">Custom Range</option>}
              </select>
            </div>

            {/* From Date */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="bg-transparent text-xs font-mono text-slate-800 focus:outline-none cursor-pointer"
                title="Start Date"
              />
            </div>

            {/* To Date */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="bg-transparent text-xs font-mono text-slate-800 focus:outline-none cursor-pointer"
                title="End Date"
              />
            </div>

            {/* Clear Date */}
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setDatePreset("all");
                }}
                className="p-1 text-slate-400 hover:text-red-600 cursor-pointer rounded transition-colors"
                title="Clear date filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          {activeTab === "pipeline" && (
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs hover:border-[#FED501]/60 focus-within:border-[#FED501] focus-within:ring-2 focus-within:ring-[#FED501]/20 transition-all">
              <Filter className="w-3.5 h-3.5 text-[#FED501] shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#000000] focus:outline-none cursor-pointer pr-6"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Payment</option>
                <option value="paid">Paid & Queued</option>
                <option value="crafting">In Crafting</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Payment Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {activeTab === "trash" && trashedOrders.length > 0 && (
            <button
              onClick={promptEmptyTrash}
              className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Empty Trash
            </button>
          )}
        </div>
      </div>

      {/* Active Synchronized Filter Summary Strip */}
      {(startDate || endDate || statusFilter !== "all" || search) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-100/90 border border-slate-200 text-xs animate-fade-in">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-600 font-medium">
              Filtered: <strong className="text-[#000000] font-bold">{filteredOrders.length}</strong> {filteredOrders.length === 1 ? "order" : "orders"}
            </span>

            {(startDate || endDate) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#000000] text-white text-[11px] font-semibold">
                <Calendar className="w-3 h-3 text-[#FED501]" />
                <span>
                  Date:{" "}
                  {startDate && endDate
                    ? startDate === endDate
                      ? formatDateDisplay(startDate, true)
                      : `${formatDateDisplay(startDate, false)} – ${formatDateDisplay(endDate, true)}`
                    : startDate
                    ? `From ${formatDateDisplay(startDate, true)}`
                    : `Up to ${formatDateDisplay(endDate, true)}`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setDatePreset("all");
                  }}
                  className="hover:text-[#FED501] cursor-pointer ml-0.5"
                  title="Remove date filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[11px] font-semibold">
                <span>Status: {statusColors[statusFilter as OrderStatus]?.label || statusFilter}</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className="hover:text-red-600 cursor-pointer ml-0.5"
                  title="Remove status filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[11px] font-semibold">
                <span>Search: &ldquo;{search}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="hover:text-red-600 cursor-pointer ml-0.5"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setDatePreset("all");
              setStatusFilter("all");
              setSearch("");
            }}
            className="text-[11px] font-bold text-[#FED501] hover:underline cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-40 bg-[#000000] text-white p-3.5 sm:px-6 sm:py-3.5 rounded-2xl shadow-2xl border border-[#FED501] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 animate-fade-down">
          <div className="flex items-center gap-3">
            <span className="bg-[#FED501] text-[#000000] font-black text-xs px-2.5 py-1 rounded-lg">
              {selectedIds.length} Selected
            </span>
            <span className="text-xs text-slate-300">
              Bulk actions:
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === "pipeline" ? (
              <>
                {/* Bulk Verify via Paystack for pending orders */}
                {selectedPendingCount > 0 && (
                  <button
                    onClick={handleBulkPaystackVerify}
                    disabled={isBulkVerifying}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isBulkVerifying ? "animate-spin" : ""}`} />
                    Verify ({selectedPendingCount})
                  </button>
                )}

                {/* Bulk Advance for Paid Orders */}
                <button
                  onClick={() => handleBulkStatusChange("crafting")}
                  disabled={selectedPaidCount === 0}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-xs font-bold transition-colors cursor-pointer"
                  title={selectedPaidCount === 0 ? "Requires paid orders" : "Mark paid orders as In Crafting"}
                >
                  Mark Crafting {selectedPaidCount > 0 ? `(${selectedPaidCount})` : ""}
                </button>
                <button
                  onClick={() => handleBulkStatusChange("shipped")}
                  disabled={selectedPaidCount === 0}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-xs font-bold transition-colors cursor-pointer"
                  title={selectedPaidCount === 0 ? "Requires paid orders" : "Mark paid orders as Shipped"}
                >
                  Mark Shipped
                </button>
                <button
                  onClick={() => handleBulkStatusChange("delivered")}
                  disabled={selectedPaidCount === 0}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-xs font-bold transition-colors cursor-pointer"
                  title={selectedPaidCount === 0 ? "Requires paid orders" : "Mark paid orders as Delivered"}
                >
                  Mark Delivered
                </button>
                <button
                  onClick={promptBulkCancel}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Cancel selected orders and automatically restore catalog inventory"
                >
                  <Ban className="w-3.5 h-3.5" /> Cancel ({selectedIds.length})
                </button>
                <button
                  onClick={promptBulkTrash}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Trash
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={promptBulkRestore}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                </button>
                <button
                  onClick={promptBulkPermanentDelete}
                  className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Forever
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Orders Table vs Mobile Cards Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-slate-300" />
            Loading orders pipeline...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center">
            <h3 className="text-base font-bold text-slate-700">
              {activeTab === "pipeline" ? "No active orders found" : "Trash Bin is empty"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === "pipeline"
                ? "Incoming customer orders will appear here."
                : "Deleted orders are moved here for safe keeping."}
            </p>
          </div>
        ) : (
          <>
            {/* 1. MOBILE CARD LIST (< md screens) */}
            <div className="divide-y divide-slate-100 md:hidden">
              {/* Select All Bar on Mobile */}
              <div className="p-3 bg-slate-50/90 flex items-center justify-between border-b border-slate-100 text-xs">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#000000]" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Select All ({filteredOrders.length})</span>
                </button>
                <span className="text-[11px] text-slate-400 font-medium">
                  {selectedIds.length} chosen
                </span>
              </div>

              {paginatedOrders.map((order) => {
                const isSelected = selectedIds.includes(order.id);
                const isHighlighted =
                  recentlyUpdatedIds.has(order.id) ||
                  recentlyUpdatedIds.has(order.orderNumber || "");
                const statusInfo = statusColors[order.status] || statusColors.pending;
                const isUnpaid = order.status === "pending" || order.status === "failed";

                return (
                  <div
                    key={order.id}
                    className={`p-4 space-y-3 transition-colors ${
                      isHighlighted
                        ? "bg-emerald-50/90 ring-2 ring-emerald-400 ring-inset"
                        : isSelected
                        ? "bg-blue-50/40"
                        : "hover:bg-slate-50/60"
                    }`}
                  >
                    {/* Top Row: Checkbox, Order ID, Date & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() => handleToggleSelect(order.id)}
                          className="p-1 -ml-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#000000]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="font-bold font-mono text-[#000000] text-sm hover:text-[#FED501] transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                          >
                            <span>{order.orderNumber}</span>
                            <Eye className="w-3.5 h-3.5 text-[#FED501]" />
                          </button>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {new Date(order.createdAt || Date.now()).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            •{" "}
                            {new Date(order.createdAt || Date.now()).toLocaleTimeString("en-NG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Status Selector or Badge */}
                      {activeTab === "pipeline" ? (
                        <div className="relative inline-block shrink-0">
                          <select
                            value={order.status}
                            disabled={updatingOrderId === order.id}
                            onChange={(e) => {
                              handleStatusChange(order.id, e.target.value as OrderStatus);
                            }}
                            className={`appearance-none text-[10px] font-bold px-2.5 py-1 pr-6 rounded-full border cursor-pointer transition-all shadow-2xs focus:outline-none ${statusInfo.bg} ${statusInfo.text} disabled:opacity-50`}
                          >
                            {isUnpaid ? (
                              <>
                                <option value="pending">⏳ Pending</option>
                                <option value="cancelled">✕ Cancel</option>
                                <option value="failed">! Failed</option>
                              </>
                            ) : (
                              <>
                                <option value="paid">✓ Paid</option>
                                <option value="crafting">⚒ Crafting</option>
                                <option value="shipped">🚚 Shipped</option>
                                <option value="delivered">★ Delivered</option>
                                <option value="cancelled">✕ Cancel</option>
                              </>
                            )}
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                        </div>
                      ) : (
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border shrink-0 ${statusInfo.bg} ${statusInfo.text}`}>
                          {statusInfo.label}
                        </span>
                      )}
                    </div>

                    {/* Cancellation Details on Mobile Card */}
                    {order.status === "cancelled" && (
                      <div className="p-2 rounded-xl bg-rose-50/90 border border-rose-200 text-[11px] text-rose-900 flex items-center justify-between gap-1.5">
                        <span className="font-bold flex items-center gap-1 shrink-0">
                          <Ban className="w-3 h-3 text-rose-600" />
                          {order.cancelledBy === "customer" ? "Customer Cancelled" : "Admin Cancelled"}
                        </span>
                        {order.cancelReason && (
                          <span className="text-rose-700/80 truncate text-right text-[10px]" title={order.cancelReason}>
                            {order.cancelReason}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Customer Info Card */}
                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="font-bold text-slate-800">
                        {order.customer.firstName} {order.customer.lastName}
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <a
                          href={`mailto:${order.customer.email}`}
                          className="hover:text-[#000000] truncate max-w-[170px] flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{order.customer.email}</span>
                        </a>
                        {order.customer.phone && (
                          <a
                            href={`tel:${order.customer.phone}`}
                            className="hover:text-[#000000] font-semibold text-[#000000] flex items-center gap-1 shrink-0"
                          >
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{order.customer.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Items & Total Strip */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="min-w-0 pr-2">
                        <div className="text-[11px] text-slate-700 font-medium truncate">
                          {order.items[0]?.quantity}x {order.items[0]?.product.name}{" "}
                          <span className="text-slate-400 font-mono">({order.items[0]?.selectedSize}&quot;)</span>
                          {order.items.length > 1 && (
                            <span className="text-slate-400 font-bold ml-1">+{order.items.length - 1} more</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-[#000000] text-sm block">
                          {formatNaira(order.total)}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          {order.paymentMethod || "Paystack"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Mobile Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#000000] hover:text-white font-bold text-xs text-[#000000] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect & Fulfill</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {isUnpaid && activeTab === "pipeline" && (
                          <button
                            type="button"
                            onClick={() => verifyPaystackOrder(order)}
                            disabled={verifyingId === order.id}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Verify Paystack"
                          >
                            <RefreshCw className={`w-3 h-3 ${verifyingId === order.id ? "animate-spin" : ""}`} />
                            <span>Verify</span>
                          </button>
                        )}

                        {activeTab === "pipeline" ? (
                          <button
                            type="button"
                            onClick={() => promptTrashOrder(order)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                            title="Move to Trash"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => promptRestoreOrder(order)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="Restore Order"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => promptPermanentDeleteOrder(order)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                              title="Permanently Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. DESKTOP DATA TABLE (>= md screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-4 px-4 w-10">
                      <button
                        onClick={handleSelectAll}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {isAllSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#000000]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-5">Order ID</th>
                    <th className="py-4 px-5">Date Placed</th>
                    <th className="py-4 px-6">Customer Info</th>
                    <th className="py-4 px-6">Handcrafted Items</th>
                    <th className="py-4 px-6">Total Amount</th>
                    <th className="py-4 px-6">
                      {activeTab === "pipeline" ? "Fulfillment Stage / Status" : "Status"}
                    </th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedOrders.map((order) => {
                    const isSelected = selectedIds.includes(order.id);
                    const isHighlighted =
                      recentlyUpdatedIds.has(order.id) ||
                      recentlyUpdatedIds.has(order.orderNumber || "");
                    const statusInfo = statusColors[order.status] || statusColors.pending;
                    const isUnpaid =
                      order.paymentStatus !== "paid" &&
                      order.status !== "paid" &&
                      order.status !== "confirmed";
                    const chan = order.salesChannel ? channelBadges[order.salesChannel] : channelBadges.ONLINE_STORE;
                    const payBadge = order.paymentStatus ? paymentStatusBadges[order.paymentStatus] : null;

                    return (
                      <tr
                        key={order.id}
                        className={`transition-all duration-700 ${
                          isHighlighted
                            ? "bg-emerald-50/90 ring-2 ring-emerald-400 ring-inset shadow-md"
                            : isSelected
                            ? "bg-blue-50/40"
                            : "hover:bg-slate-50/60"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleSelect(order.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#000000]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Order ID & Sales Channel */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="font-bold font-mono text-[#000000] text-xs sm:text-sm hover:text-[#FED501] transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                              title="Click to view order details"
                            >
                              <span>{order.orderNumber}</span>
                              <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[#FED501] transition-opacity" />
                            </button>
                            {isHighlighted && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider animate-pulse">
                                ● Live
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {chan && (
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${chan.bg} ${chan.text}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${chan.dot}`} />
                                {chan.label}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-medium">
                              {order.fulfillmentType === "pickup" ? "• Pickup" : "• Delivery"}
                            </span>
                          </div>
                        </td>

                        {/* Standalone Date Placed */}
                        <td className="py-4 px-5">
                          <div className="font-semibold text-slate-700 text-xs flex items-center gap-1.5 whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {new Date(order.createdAt || Date.now()).toLocaleDateString("en-NG", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 pl-5 font-mono">
                            {new Date(order.createdAt || Date.now()).toLocaleTimeString("en-NG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-800">
                            {order.customer.firstName} {order.customer.lastName}
                          </div>
                          {order.customer.email && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              {order.customer.email}
                            </div>
                          )}
                          {order.customer.phone && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {order.customer.phone}
                            </div>
                          )}
                        </td>

                        {/* Items */}
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            {order.items.slice(0, 2).map((item, idx) => (
                              <div
                                key={idx}
                                className="text-slate-700 text-[11px] font-medium flex items-center gap-1.5"
                              >
                                <span className="w-4 h-4 rounded bg-slate-100 text-[#000000] font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                                  {item.quantity}x
                                </span>
                                <span className="truncate max-w-[150px]">
                                  {item.product.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({item.selectedSize}&quot;)
                                </span>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-[10px] text-slate-400 font-semibold italic">
                                +{order.items.length - 2} more cap(s)
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Total & Payment Status */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-[#000000] text-sm">
                            {formatNaira(order.total)}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {payBadge && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${payBadge.bg} ${payBadge.text}`}
                              >
                                {payBadge.label}
                              </span>
                            )}
                            {order.amountDue !== undefined &&
                              order.amountDue > 0 &&
                              order.paymentStatus !== "unpaid" && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                                  ₦{order.amountDue.toLocaleString()} Due
                                </span>
                              )}
                          </div>
                        </td>

                        {/* Stage / Status with Payment Guard */}
                        <td className="py-4 px-6">
                          {activeTab === "pipeline" ? (
                            <div className="flex items-center gap-2">
                              <div className="relative inline-block">
                                <select
                                  value={order.status}
                                  disabled={updatingOrderId === order.id}
                                  onChange={(e) => {
                                    handleStatusChange(order.id, e.target.value as OrderStatus);
                                  }}
                                  className={`appearance-none text-[11px] font-bold px-3 py-1.5 pr-7 rounded-full border cursor-pointer transition-all shadow-2xs focus:outline-none ${statusInfo.bg} ${statusInfo.text} disabled:opacity-50`}
                                >
                                  {isUnpaid ? (
                                    <>
                                      <option value="pending">⏳ Pending Payment</option>
                                      <option value="confirmed">✓ Confirm Order</option>
                                      <option value="paid">✓ Mark as Paid &amp; Confirmed</option>
                                      <option value="crafting">⚒ In Crafting</option>
                                      <option value="shipped">🚚 Dispatched / Shipped</option>
                                      <option value="delivered">★ Delivered</option>
                                      <option value="cancelled">✕ Cancel Order</option>
                                      <option value="failed">! Payment Failed</option>
                                    </>
                                  ) : (
                                    <>
                                      <option value="confirmed">✓ Confirmed</option>
                                      <option value="paid">✓ Paid &amp; Queued</option>
                                      <option value="crafting">⚒ In Crafting</option>
                                      <option value="shipped">🚚 Dispatched / Shipped</option>
                                      <option value="delivered">★ Delivered</option>
                                      <option value="cancelled">✕ Cancelled</option>
                                    </>
                                  )}
                                </select>
                                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                              </div>

                              {isUnpaid && order.paymentMethod === "PAYSTACK" && (
                                <button
                                  onClick={() => verifyPaystackOrder(order)}
                                  disabled={verifyingId === order.id}
                                  title="Check Paystack Payment Status"
                                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                >
                                  <RefreshCw
                                    className={`w-3 h-3 ${verifyingId === order.id ? "animate-spin" : ""}`}
                                  />
                                  <span>Verify</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span
                                className={`px-3 py-1 text-xs font-bold rounded-full border ${statusInfo.bg} ${statusInfo.text}`}
                              >
                                {statusInfo.label}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {order.amountDue !== undefined &&
                              order.amountDue > 0 &&
                              order.status !== "cancelled" && (
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setIsRecordingPayment(true);
                                    setManualPayAmount(order.amountDue || order.total);
                                  }}
                                  className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                                  title="Record Payment"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Pay</span>
                                </button>
                              )}

                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 rounded-lg bg-slate-100 hover:bg-[#000000] hover:text-white text-slate-600 transition-colors cursor-pointer"
                              title="View Order Dossier"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {activeTab === "pipeline" ? (
                              <button
                                onClick={() => promptTrashOrder(order)}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Move to Trash Bin"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => promptRestoreOrder(order)}
                                  className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 transition-colors cursor-pointer"
                                  title="Restore Order"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => promptPermanentDeleteOrder(order)}
                                  className="p-2 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
                                  title="Permanently Delete Order"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <AdminPagination
              currentPage={currentPage}
              totalItems={filteredOrders.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="orders"
            />
          </>
        )}
      </div>

      {/* 3. ORDER DETAILS & FULFILLMENT MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8 border border-slate-200 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => {
                setSelectedOrder(null);
                setIsRecordingPayment(false);
              }}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="border-b border-slate-100 pb-4 mb-5 sm:mb-6 pr-8">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FED501]">
                Order Management & Omnichannel Fulfillment
              </span>
              <div className="flex items-center gap-2.5 sm:gap-3 mt-1 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#000000]">
                  {selectedOrder.orderNumber}
                </h2>
                {/* Channel Badge */}
                {selectedOrder.salesChannel && channelBadges[selectedOrder.salesChannel] && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      channelBadges[selectedOrder.salesChannel].bg
                    } ${channelBadges[selectedOrder.salesChannel].text}`}
                  >
                    {channelBadges[selectedOrder.salesChannel].label}
                  </span>
                )}
                {/* Fulfillment Type */}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {selectedOrder.fulfillmentType === "pickup" ? "In-Store Pickup" : "Home Delivery"}
                </span>
                {/* Order Status */}
                <span
                  className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold border ${
                    statusColors[selectedOrder.status]?.bg
                  } ${statusColors[selectedOrder.status]?.text}`}
                >
                  {statusColors[selectedOrder.status]?.label}
                </span>
                {/* Payment Status */}
                {selectedOrder.paymentStatus && paymentStatusBadges[selectedOrder.paymentStatus] && (
                  <span
                    className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold border ${
                      paymentStatusBadges[selectedOrder.paymentStatus].bg
                    } ${paymentStatusBadges[selectedOrder.paymentStatus].text}`}
                  >
                    {paymentStatusBadges[selectedOrder.paymentStatus].label}
                  </span>
                )}
                {/* Refund Status */}
                {selectedOrder.refundStatus && selectedOrder.refundStatus !== "not_refunded" && (
                  <span
                    className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold border ${
                      selectedOrder.refundStatus === "refunded"
                        ? "bg-purple-100 border-purple-300 text-purple-800"
                        : "bg-amber-100 border-amber-300 text-amber-800"
                    }`}
                  >
                    Refund: {selectedOrder.refundStatus === "refunded" ? "Fully Refunded" : "Partially Refunded"}
                  </span>
                )}
              </div>
            </div>

            {/* 6-DIMENSION SEPARATED STATE DOSSIER */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3.5 mb-5 sm:mb-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Order Status</span>
                <span className="font-bold text-slate-800 capitalize">{statusColors[selectedOrder.status]?.label || selectedOrder.status}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Payment Status</span>
                <span className="font-bold text-emerald-700 capitalize">{paymentStatusBadges[selectedOrder.paymentStatus]?.label || selectedOrder.paymentStatus || "Unpaid"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">3. Refund Status</span>
                <span className={`font-bold capitalize ${selectedOrder.refundStatus && selectedOrder.refundStatus !== "not_refunded" ? "text-purple-700" : "text-slate-500"}`}>
                  {selectedOrder.refundStatus === "refunded" ? "Fully Refunded" : selectedOrder.refundStatus === "partially_refunded" ? "Partially Refunded" : "Not Refunded"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">4. Total Amount</span>
                <span className="font-mono font-bold text-slate-900">{formatNaira(selectedOrder.total)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">5. Amount Paid</span>
                <span className="font-mono font-bold text-emerald-600">{formatNaira(selectedOrder.amountPaid || 0)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">6. Amount Due</span>
                <span className={`font-mono font-bold ${(selectedOrder.amountDue || 0) > 0 ? "text-amber-600" : "text-slate-400"}`}>
                  {formatNaira(selectedOrder.amountDue || 0)}
                </span>
              </div>
            </div>

            {/* PAYMENT COLLECTION & UNPAID CONTROLS */}
            {selectedOrder.amountDue !== undefined &&
            selectedOrder.amountDue > 0 &&
            selectedOrder.status !== "cancelled" && (
              <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                      <CreditCard className="w-4 sm:w-5 h-4 sm:h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-amber-900">
                        Payment Outstanding: ₦{selectedOrder.amountDue.toLocaleString()} Due
                      </h3>
                      <p className="text-[11px] sm:text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                        Total: ₦{selectedOrder.total.toLocaleString()} • Paid so far: ₦
                        {(selectedOrder.amountPaid || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {!isRecordingPayment && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecordingPayment(true);
                        setManualPayAmount(selectedOrder.amountDue || selectedOrder.total);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                  )}
                </div>

                {/* Inline Manual Payment Recording Form */}
                {isRecordingPayment ? (
                  <div className="p-3.5 rounded-xl bg-white border border-amber-300 space-y-3 mt-3 animate-fade-in">
                    <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Record Customer Payment</span>
                      <button
                        type="button"
                        onClick={() => setIsRecordingPayment(false)}
                        className="text-slate-400 hover:text-slate-600 text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                          Amount (₦)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={selectedOrder.amountDue || selectedOrder.total}
                          value={manualPayAmount}
                          onChange={(e) => setManualPayAmount(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                          Payment Method
                        </label>
                        <select
                          value={manualPayMethod}
                          onChange={(e: any) => setManualPayMethod(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
                        >
                          <option value="BANK_TRANSFER">Bank Transfer</option>
                          <option value="CASH">Cash (Storefront)</option>
                          <option value="POS">POS Terminal</option>
                          <option value="PAYSTACK">Paystack</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                          Reference / Memo
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. TRF-10924 or Receipt #"
                          value={manualPayRef}
                          onChange={(e) => setManualPayRef(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                          Internal Notes
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Customer paid via GTBank transfer"
                          value={manualPayNotes}
                          onChange={(e) => setManualPayNotes(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsRecordingPayment(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRecordManualPayment(selectedOrder.id)}
                        disabled={isSubmittingPayment}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingPayment ? "Recording..." : "Confirm & Apply Payment"}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center gap-2 sm:gap-2.5">
                  {selectedOrder.paymentMethod === "PAYSTACK" && (
                    <button
                      onClick={() => verifyPaystackOrder(selectedOrder)}
                      disabled={verifyingId === selectedOrder.id}
                      className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${verifyingId === selectedOrder.id ? "animate-spin" : ""}`}
                      />
                      Verify with Paystack
                    </button>
                  )}

                  <button
                    onClick={() => promptCancelOrder(selectedOrder)}
                    className="px-3.5 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cancel Order</span>
                  </button>
                </div>
              </div>
            )}

            {selectedOrder.status === "cancelled" ? (
              /* CANCELLATION DOSSIER & METADATA CARD */
              <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-rose-900">
                    <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                    <h3 className="text-xs sm:text-sm font-bold">
                      Order Cancelled ({selectedOrder.cancelledBy === "customer" ? "By Customer" : "By Store Administrator"})
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-rose-200/60 text-rose-950">
                  {selectedOrder.cancelledAt && (
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                        Timestamp
                      </span>
                      <span className="font-semibold text-slate-800">
                        {new Date(selectedOrder.cancelledAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                      Stock Restoration Status
                    </span>
                    <span className="font-bold text-emerald-700 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Restored to Catalog
                    </span>
                  </div>
                </div>

                {selectedOrder.cancelReason && (
                  <div className="text-xs bg-white/90 p-3 rounded-xl border border-rose-200/80 text-rose-950">
                    <span className="font-bold block text-[10px] uppercase tracking-wider text-rose-600 mb-0.5">
                      Stated Reason for Cancellation
                    </span>
                    <span className="leading-relaxed">{selectedOrder.cancelReason}</span>
                  </div>
                )}
              </div>
            ) : (
              /* ACTIVE FULFILLMENT PIPELINE STEP CONTROLS */
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 mb-5 sm:mb-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FED501]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Advance Fulfillment Pipeline:
                    </span>
                  </div>
                  {selectedOrder.amountDue !== undefined && selectedOrder.amountDue > 0 ? (
                    <span className="text-[10px] sm:text-[11px] text-amber-800 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 self-start sm:self-auto">
                      <AlertCircle className="w-3 h-3 text-amber-600" /> Balance Due: ₦{selectedOrder.amountDue.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 self-start sm:self-auto">
                      <CheckCircle2 className="w-3 h-3" /> Payment Verified
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, "confirmed")}
                    className={`px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedOrder.status === "confirmed"
                        ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-300"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmed
                  </button>

                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, "crafting")}
                    className={`px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedOrder.status === "crafting"
                        ? "bg-purple-600 text-white shadow-sm ring-2 ring-purple-300"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-700"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    In Crafting
                  </button>

                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, "shipped")}
                    className={`px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedOrder.status === "shipped"
                        ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Dispatched
                  </button>

                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, "delivered")}
                    className={`px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedOrder.status === "delivered"
                        ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Delivered
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Order Cancellation</span>
                  <button
                    onClick={() => promptCancelOrder(selectedOrder)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cancel Order &amp; Restore Stock</span>
                  </button>
                </div>
              </div>
            )}

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-5 sm:mb-6">
              <div className="bg-slate-50/50 p-3.5 sm:p-4 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Customer Information
                </h4>
                <div className="font-bold text-slate-800 text-sm">
                  {selectedOrder.customer.firstName} {selectedOrder.customer.lastName}
                </div>
                {selectedOrder.customer.email && (
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{selectedOrder.customer.email}</span>
                  </div>
                )}
                {selectedOrder.customer.phone && (
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a
                      href={`tel:${selectedOrder.customer.phone}`}
                      className="hover:text-[#000000] font-semibold text-[#000000]"
                    >
                      {selectedOrder.customer.phone}
                    </a>
                  </div>
                )}
              </div>

              <div className="bg-slate-50/50 p-3.5 sm:p-4 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {selectedOrder.fulfillmentType === "pickup" ? "Pickup Location" : "Delivery Destination"}
                </h4>
                {selectedOrder.fulfillmentType === "pickup" ? (
                  <div className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5">
                    <Store className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">Showroom Walk-in Collection</div>
                      <div className="text-slate-500 mt-0.5">Lagos Boutique Showroom</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#FED501] flex-shrink-0 mt-0.5" />
                    <div>
                      <div>{selectedOrder.address.address}</div>
                      <div className="font-semibold mt-0.5">
                        {selectedOrder.address.city}, {selectedOrder.address.state}
                      </div>
                      <div className="text-slate-400">{selectedOrder.address.country}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Handcrafted Items List */}
            <div className="mb-5 sm:mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Items In Order ({selectedOrder.items.length})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-100 overflow-hidden relative border border-slate-200 flex-shrink-0">
                        {item.product.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 text-xs truncate max-w-[170px] sm:max-w-none">
                          {item.product.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                          Size:{" "}
                          <span className="font-bold text-[#000000]">
                            {item.selectedSize}&quot;
                          </span>{" "}
                          • Qty: {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-slate-800 text-xs shrink-0">
                      {formatNaira(item.product.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recorded Payments Ledger */}
            {selectedOrder.payments && selectedOrder.payments.length > 0 && (
              <div className="mb-5 sm:mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Recorded Payments Ledger
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                  {selectedOrder.payments.map((p, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 font-mono">
                          {formatNaira(Number(p.amount))}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-2">
                          via <strong>{p.method.replace("_", " ")}</strong> ({p.provider})
                        </span>
                        {p.reference && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Ref: {p.reference}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-[10px] text-slate-400 font-mono">
                        {new Date(p.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Breakdown */}
            <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>{formatNaira(selectedOrder.subtotal)}</span>
              </div>
              {Number(selectedOrder.discount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount:</span>
                  <span>-{formatNaira(Number(selectedOrder.discount))}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Shipping Fee:</span>
                <span>{formatNaira(selectedOrder.shipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-[#000000]">{formatNaira(selectedOrder.total)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 text-slate-500">
                <span>Amount Paid:</span>
                <span className="font-semibold text-emerald-700">
                  {formatNaira(Number(selectedOrder.amountPaid) || 0)}
                </span>
              </div>
              {selectedOrder.amountDue !== undefined && selectedOrder.amountDue > 0 && (
                <div className="flex justify-between text-xs text-amber-800 font-bold">
                  <span>Amount Due:</span>
                  <span>{formatNaira(selectedOrder.amountDue)}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                href={`/track-order?ref=${selectedOrder.paymentReference || selectedOrder.orderNumber}`}
                target="_blank"
                className="text-xs text-[#FED501] font-bold flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Customer Live Tracking Page ↗
              </Link>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setIsRecordingPayment(false);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#000000] text-white text-xs font-bold hover:bg-[#262626] cursor-pointer text-center"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Omnichannel Order Drawer */}
      <CreateOrderDrawer
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        onOrderCreated={reloadData}
      />
    </div>
  );
}
