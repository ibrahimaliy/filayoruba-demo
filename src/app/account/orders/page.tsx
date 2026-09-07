"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import {
  Package,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Sparkles,
  Loader2,
  Star,
  CreditCard,
  Search,
  ShoppingBag,
  MapPin,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Order } from "@/types/order";
import { cn } from "@/lib/utils";
import ReviewModal, { ReviewModalProduct } from "@/components/reviews/ReviewModal";
import CancelOrderModal from "@/components/orders/CancelOrderModal";
import ChangeAddressModal from "@/components/orders/ChangeAddressModal";
import { Review, Product } from "@/types/product";
import { usePageRestore } from "@/hooks/use-page-restore";
import { useCartStore } from "@/store/cart-store";
import { useCartDrawerStore } from "@/store/cart-drawer-store";
import { formatSizeLabel } from "@/lib/sizing";

type StatusTab = "all" | "active" | "delivered" | "cancelled";

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<{ name: string; email: string } | null>(null);
  const [reviewedProducts, setReviewedProducts] = useState<Record<string, number>>({});
  const [activeReviewItem, setActiveReviewItem] = useState<{
    product: ReviewModalProduct;
    orderNumber: string;
  } | null>(null);
  const [activeCancelOrder, setActiveCancelOrder] = useState<Order | null>(null);
  const [activeAddressOrder, setActiveAddressOrder] = useState<Order | null>(null);
  const [resumingOrderId, setResumingOrderId] = useState<string | null>(null);

  // Status Filter & Search
  const [statusFilter, setStatusFilter] = useState<StatusTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Per-order item selection state: mapping orderId -> selected item keys
  const [selectedItemKeysByOrder, setSelectedItemKeysByOrder] = useState<Record<string, string[]>>({});

  const addToCart = useCartStore((state) => state.addToCart);
  const openDrawer = useCartDrawerStore((state) => state.open);

  // Reset loading status when returning via Back/bfcache
  usePageRestore(() => setResumingOrderId(null));

  useEffect(() => {
    async function loadCustomerData() {
      try {
        const ordersRes = await fetch("/api/customer/orders");
        const ordersData = await ordersRes.json();
        if (ordersRes.ok && ordersData.orders) {
          setOrders(ordersData.orders);
        }

        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionRes.ok && sessionData.authenticated && sessionData.customer) {
          setCustomer({
            name: `${sessionData.customer.firstName || ""} ${sessionData.customer.lastName || ""}`.trim() || sessionData.customer.email.split("@")[0],
            email: sessionData.customer.email,
          });
        }

        const reviewsRes = await fetch("/api/customer/reviews");
        const reviewsData = await reviewsRes.json();
        if (reviewsRes.ok && Array.isArray(reviewsData.reviews)) {
          const map: Record<string, number> = {};
          reviewsData.reviews.forEach((r: any) => {
            if (r.product?.slug) {
              map[r.product.slug] = r.rating;
            }
          });
          setReviewedProducts(map);
        }
      } catch (err) {
        console.error("Error fetching customer orders:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCustomerData();
  }, []);

  const handleReviewSuccess = (newReview: Review) => {
    if (activeReviewItem) {
      setReviewedProducts((prev) => ({
        ...prev,
        [activeReviewItem.product.slug]: newReview.rating,
      }));
    }
  };

  const handleCancelSuccess = (updatedOrder: any) => {
    if (updatedOrder) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === updatedOrder.id
            ? { ...o, ...updatedOrder, status: "cancelled" }
            : o
        )
      );
    }
  };

  const handleAddressUpdateSuccess = (updatedOrder: Order) => {
    if (updatedOrder) {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
      );
    }
  };

  const handleResumePayment = async (order: Order) => {
    try {
      setResumingOrderId(order.id);
      const res = await fetch("/api/paystack/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, email: customer?.email }),
      });
      const data = await res.json();
      if (!res.ok || !data.authorizationUrl) {
        throw new Error(data.message || "Unable to resume payment at this time.");
      }
      const toastId = toast.loading("Redirecting to Paystack secure checkout...");

      setTimeout(() => {
        setResumingOrderId(null);
        toast.dismiss(toastId);
      }, 6000);

      window.location.href = data.authorizationUrl;
    } catch (err: any) {
      toast.error(err.message || "Payment resumption failed.");
      setResumingOrderId(null);
    }
  };

  // Helper to get selected item keys for an order (defaults to all items selected)
  const getSelectedKeysForOrder = (order: Order): string[] => {
    if (selectedItemKeysByOrder[order.id] !== undefined) {
      return selectedItemKeysByOrder[order.id];
    }
    return order.items.map(
      (i) => `${i.product?.id || (i as any).productId || (i as any).id}-${i.selectedSize || (i as any).size || "Standard"}`
    );
  };

  const toggleItemInOrder = (order: Order, itemKey: string) => {
    const current = getSelectedKeysForOrder(order);
    const updated = current.includes(itemKey)
      ? current.filter((k) => k !== itemKey)
      : [...current, itemKey];
    setSelectedItemKeysByOrder((prev) => ({
      ...prev,
      [order.id]: updated,
    }));
  };

  const toggleSelectAllInOrder = (order: Order) => {
    const allKeys = order.items.map(
      (i) => `${i.product?.id || (i as any).productId || (i as any).id}-${i.selectedSize || (i as any).size || "Standard"}`
    );
    const current = getSelectedKeysForOrder(order);
    const isAll = current.length === allKeys.length;

    setSelectedItemKeysByOrder((prev) => ({
      ...prev,
      [order.id]: isAll ? [] : allKeys,
    }));
  };

  // Re-order selected items within an order
  const handleReorderOrder = (order: Order) => {
    const selectedKeys = getSelectedKeysForOrder(order);
    const itemsToReorder = order.items.filter((item) => {
      const key = `${item.product?.id || (item as any).productId || (item as any).id}-${item.selectedSize || (item as any).size || "Standard"}`;
      return selectedKeys.includes(key);
    });

    if (itemsToReorder.length === 0) {
      toast.error("Please select at least 1 item to re-order.");
      return;
    }

    let addedCount = 0;
    itemsToReorder.forEach((item) => {
      const productName = item.product?.name || (item as any).name || "Handcrafted Yoruba Fila";
      const productSlug = item.product?.slug || (item as any).slug || "fila";
      const productImage = item.product?.images?.[0] || (item as any).image || "";
      const productPrice = item.product?.price || (item as any).price || order.total / (item.quantity || 1);
      const size = item.selectedSize || (item as any).size || "58";

      const prod: Product = item.product || {
        id: (item as any).productId || (item as any).id || "prod-item",
        name: productName,
        slug: productSlug,
        description: "Handcrafted authentic Yoruba Fila cap.",
        images: productImage ? [productImage] : [],
        price: productPrice,
        sizes: [size],
        colors: [],
        featured: false,
        stock: 10,
        rating: 5,
        reviews: [],
        collection: { name: "Heritage", slug: "heritage" },
      };

      for (let q = 0; q < (item.quantity || 1); q++) {
        addToCart(prod, size);
      }
      addedCount += item.quantity || 1;
    });

    toast.success(`Added ${addedCount} ${addedCount === 1 ? "cap" : "caps"} to your shopping bag!`);
    openDrawer();
  };

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "paid":
        return {
          label: "Verified",
          className: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
        };
      case "crafting":
        return {
          label: "In Handcrafting",
          className: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Sparkles,
        };
      case "shipped":
        return {
          label: "Dispatched",
          className: "bg-blue-50 text-blue-700 border-blue-200",
          icon: Truck,
        };
      case "delivered":
        return {
          label: "Delivered",
          className: "bg-slate-100 text-slate-800 border-slate-300",
          icon: CheckCircle2,
        };
      case "cancelled":
        return {
          label: "Cancelled",
          className: "bg-rose-50 text-rose-700 border-rose-200",
          icon: AlertCircle,
        };
      default:
        return {
          label: status.toUpperCase(),
          className: "bg-slate-50 text-slate-600 border-slate-200",
          icon: Clock,
        };
    }
  };

  const counts = useMemo(() => {
    return {
      all: orders.length,
      active: orders.filter((o) => ["pending", "paid", "crafting", "shipped"].includes(o.status)).length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (statusFilter === "active") {
      list = list.filter((o) => ["pending", "paid", "crafting", "shipped"].includes(o.status));
    } else if (statusFilter === "delivered") {
      list = list.filter((o) => o.status === "delivered");
    } else if (statusFilter === "cancelled") {
      list = list.filter((o) => o.status === "cancelled");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((o) => {
        const orderNum = (o.orderNumber || o.id).toLowerCase();
        const itemNames = o.items.map((i) => (i.product?.name || (i as any).name || "").toLowerCase()).join(" ");
        return orderNum.includes(q) || itemNames.includes(q);
      });
    }

    return list;
  }, [orders, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#000000] mx-auto" />
        <p className="text-xs text-slate-500 mt-3 font-medium">Retrieving orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Header & Controls */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold font-serif text-[#000000]">
              My Orders ({orders.length})
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review order milestones, receipts, and easily re-order your favorite Yoruba caps.
            </p>
          </div>

          <Link
            href="/products"
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#FED501]" />
            <span>Shop Catalog</span>
          </Link>
        </div>

        {orders.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2 border-t border-slate-100">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap",
                  statusFilter === "all"
                    ? "bg-[#000000] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                All ({counts.all})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap",
                  statusFilter === "active"
                    ? "bg-amber-700 text-white"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                )}
              >
                Active ({counts.active})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("delivered")}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap",
                  statusFilter === "delivered"
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                )}
              >
                Delivered ({counts.delivered})
              </button>

              {counts.cancelled > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("cancelled")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap",
                    statusFilter === "cancelled"
                      ? "bg-rose-700 text-white"
                      : "bg-rose-50 text-rose-800 hover:bg-rose-100"
                  )}
                >
                  Cancelled ({counts.cancelled})
                </button>
              )}
            </div>

            {/* Compact Search Bar */}
            <div className="relative sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#000000]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <Package className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No Orders Placed Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your custom-tailored Yoruba caps will appear here once you place an order.
          </p>
          <Link
            href="/products"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#000000] text-white text-xs font-bold transition-all shadow-xs mt-2"
          >
            Explore Catalog
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-2">
          <Package className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No matching orders</h4>
          <p className="text-xs text-slate-500">
            No orders found for this search. Try resetting filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            const BadgeIcon = badge.icon;
            const orderNum = order.orderNumber || order.id.slice(0, 8).toUpperCase();
            const firstItem = order.items[0];
            const firstItemSlug = firstItem?.product?.slug || (firstItem as any)?.slug || "";
            const isReviewed = Boolean(reviewedProducts[firstItemSlug]);
            const userRating = reviewedProducts[firstItemSlug] || 5;

            // Item-level selection state for this order
            const selectedKeys = getSelectedKeysForOrder(order);
            const isAllSelected = selectedKeys.length === order.items.length;
            const selectedCount = selectedKeys.length;

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 shadow-xs space-y-4 transition-all"
              >
                {/* Header Row (No order-wide checkbox clutter) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#000000]">
                        #{orderNum}
                      </span>
                      <span className="text-xs text-slate-300">&bull;</span>
                      <time className="text-xs text-slate-500">
                        {new Date(order.createdAt || Date.now()).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border",
                        badge.className
                      )}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                  </div>
                </div>

                {/* Items Section (With Individual Selection for Multi-Item Orders) */}
                <div className="space-y-2">
                  {order.items.length > 1 && (
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[11px] text-slate-500">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-[#000000] select-none group">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={() => toggleSelectAllInOrder(order)}
                          className="w-3.5 h-3.5 rounded-sm accent-[#000000] cursor-pointer"
                        />
                        <span className="group-hover:underline">Select All ({order.items.length})</span>
                      </label>
                      <span className="text-slate-400">
                        {selectedCount} of {order.items.length} selected
                      </span>
                    </div>
                  )}

                  {order.items.map((item, idx) => {
                    const itemKey = `${item.product?.id || (item as any).productId || (item as any).id}-${item.selectedSize || (item as any).size || "Standard"}`;
                    const isItemSelected = selectedKeys.includes(itemKey);
                    const productName = item.product?.name || (item as any).name || "Handcrafted Yoruba Cap";
                    const productSlug = item.product?.slug || (item as any).slug || "";
                    const productImage = item.product?.images?.[0] || (item as any).image;
                    const productPrice = item.product?.price || (item as any).price || 0;
                    const selectedSize = item.selectedSize || (item as any).size;

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-between gap-3 p-1.5 rounded-xl transition-all",
                          order.items.length > 1
                            ? isItemSelected
                              ? "bg-slate-50/60"
                              : "opacity-50"
                            : ""
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Individual Item Checkbox (Shown when order has multiple items) */}
                          {order.items.length > 1 && (
                            <label className="cursor-pointer p-1 -m-1 shrink-0" title={isItemSelected ? "Unselect item" : "Select item"}>
                              <input
                                type="checkbox"
                                checked={isItemSelected}
                                onChange={() => toggleItemInOrder(order, itemKey)}
                                className="w-4 h-4 rounded-md accent-[#000000] cursor-pointer"
                              />
                            </label>
                          )}

                          <Link
                            href={productSlug ? `/products/${productSlug}` : "/products"}
                            className="relative w-12 h-12 rounded-xl overflow-hidden border bg-slate-900 shrink-0 hover:opacity-90 transition-opacity"
                          >
                            <ImageWithFallback
                              src={productImage}
                              alt={productName}
                              fill
                              className="object-cover"
                              fallbackTitle={productName}
                              fallbackVariant="sm"
                            />
                          </Link>
                          <div className="min-w-0">
                            <Link
                              href={productSlug ? `/products/${productSlug}` : "/products"}
                              className="text-xs font-bold text-slate-900 hover:underline line-clamp-1 block"
                            >
                              {productName}
                            </Link>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Size: <span className="font-semibold text-slate-700">{formatSizeLabel(selectedSize)}</span> &bull; Qty: {item.quantity}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-[#000000] shrink-0">
                          ₦{(productPrice * item.quantity).toLocaleString("en-NG")}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Delivery Destination Summary Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                  <div className="flex items-start gap-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-slate-400 font-semibold mr-1.5">Deliver to:</span>
                      <span className="font-medium text-slate-800">
                        {order.address?.address
                          ? `${order.address.address}, ${order.address.city}, ${order.address.state}`
                          : "Standard Delivery Address"}
                      </span>
                    </div>
                  </div>

                  {["pending", "paid", "crafting"].includes(order.status) ? (
                    <button
                      type="button"
                      onClick={() => setActiveAddressOrder(order)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#000000] hover:text-slate-700 hover:underline shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-[#FED501]" />
                      <span>Change Address</span>
                    </button>
                  ) : order.status === "shipped" || order.status === "delivered" ? (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                      Dispatched
                    </span>
                  ) : null}
                </div>

                {/* Footer Row: Total & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-xs">
                    <span className="text-slate-500">Order Total: </span>
                    <span className="font-bold text-[#000000] text-sm">
                      ₦{order.total.toLocaleString("en-NG")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 0. Eligible for Address Change (pending, paid, crafting) */}
                    {["pending", "paid", "crafting"].includes(order.status) && (
                      <button
                        type="button"
                        onClick={() => setActiveAddressOrder(order)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Update shipping address"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#000000]" />
                        <span>Change Address</span>
                      </button>
                    )}

                    {/* 1. Pending: Pay Now & Cancel */}
                    {order.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleResumePayment(order)}
                          disabled={resumingOrderId === order.id}
                          className="px-3.5 py-1.5 rounded-xl bg-[#000000] hover:bg-black text-[#FED501] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {resumingOrderId === order.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FED501]" />
                          ) : (
                            <CreditCard className="w-3.5 h-3.5 text-[#FED501]" />
                          )}
                          <span>Complete Payment</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveCancelOrder(order)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {/* 2. Paid: Cancel option */}
                    {order.status === "paid" && (
                      <button
                        type="button"
                        onClick={() => setActiveCancelOrder(order)}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}

                    {/* 3. Delivered: Re-order & Review */}
                    {order.status === "delivered" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReorderOrder(order)}
                          disabled={order.items.length > 1 && selectedCount === 0}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Add selected items to bag"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#000000]" />
                          <span>
                            {order.items.length > 1
                              ? selectedCount > 0
                                ? `Re-order Selected (${selectedCount})`
                                : "Select items to re-order"
                              : "Re-order Cap"}
                          </span>
                        </button>

                        {isReviewed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Reviewed ({userRating}★)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveReviewItem({
                                product: {
                                  name: firstItem?.product?.name || (firstItem as any)?.name,
                                  slug: firstItemSlug,
                                  image: firstItem?.product?.images?.[0] || (firstItem as any)?.image,
                                  price: firstItem?.product?.price || (firstItem as any)?.price,
                                  size: firstItem?.selectedSize || (firstItem as any)?.size,
                                },
                                orderNumber: orderNum,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Star className="w-3 h-3 fill-[#FED501] text-[#FED501]" />
                            <span>Review</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* 4. Universal Track / Receipt */}
                    <Link
                      href={`/track-order?order=${encodeURIComponent(orderNum)}`}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Track &amp; Receipt
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {activeReviewItem && (
        <ReviewModal
          isOpen={Boolean(activeReviewItem)}
          onClose={() => setActiveReviewItem(null)}
          product={activeReviewItem.product}
          orderNumber={activeReviewItem.orderNumber}
          customerName={customer?.name}
          customerEmail={customer?.email}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* Cancel Order Modal */}
      {activeCancelOrder && (
        <CancelOrderModal
          isOpen={Boolean(activeCancelOrder)}
          onClose={() => setActiveCancelOrder(null)}
          orderId={activeCancelOrder.id}
          orderNumber={activeCancelOrder.orderNumber || activeCancelOrder.id.slice(0, 8).toUpperCase()}
          total={activeCancelOrder.total}
          customerEmail={customer?.email || activeCancelOrder.customer?.email}
          isPaid={activeCancelOrder.status === "paid"}
          onSuccess={handleCancelSuccess}
        />
      )}

      {/* Change Delivery Address Modal */}
      {activeAddressOrder && (
        <ChangeAddressModal
          isOpen={Boolean(activeAddressOrder)}
          onClose={() => setActiveAddressOrder(null)}
          order={activeAddressOrder}
          customerEmail={customer?.email || activeAddressOrder.customer?.email}
          onSuccess={handleAddressUpdateSuccess}
        />
      )}
    </div>
  );
}
