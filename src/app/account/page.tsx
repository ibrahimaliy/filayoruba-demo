"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import {
  Package,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Sliders,
  ExternalLink,
  MapPin,
  CreditCard,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { Order } from "@/types/order";
import { usePageRestore } from "@/hooks/use-page-restore";
import { formatSizeLabel } from "@/lib/sizing";
import { toast } from "sonner";

export default function AccountOverviewPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<{ name: string; email: string } | null>(null);
  const [resumingOrderId, setResumingOrderId] = useState<string | null>(null);

  // Reset loading status when returning via Back/bfcache
  usePageRestore(() => setResumingOrderId(null));

  useEffect(() => {
    async function fetchAccountData() {
      try {
        const res = await fetch("/api/customer/orders");
        const data = await res.json();
        if (res.ok && data.orders) {
          setOrders(data.orders);
        }

        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionRes.ok && sessionData.authenticated && sessionData.customer) {
          setCustomer({
            name: `${sessionData.customer.firstName || ""} ${sessionData.customer.lastName || ""}`.trim() || sessionData.customer.email.split("@")[0],
            email: sessionData.customer.email,
          });
        }
      } catch (err) {
        console.error("Error fetching account data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAccountData();
  }, []);

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

  const activeOrders = orders.filter(
    (o) =>
      o.status === "pending" ||
      o.status === "paid" ||
      o.status === "crafting" ||
      o.status === "shipped"
  );
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const latestOrder = orders[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-white border border-slate-200/80 rounded-2xl p-6 animate-pulse" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white border border-slate-200/80 rounded-2xl p-5 animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-white border border-slate-200/80 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Welcome Greeting Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#000000]/60">
            Patron Portal
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#000000] mt-0.5">
            Welcome, {customer?.name || "Esteemed Patron"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {customer?.email} &bull; Authentic Oyo Yoruba Craftsmanship
          </p>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-semibold transition-all shadow-xs shrink-0 self-start sm:self-center"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-[#FED501]" />
          <span>Explore Catalog</span>
        </Link>
      </div>

      {/* 2. Key Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Orders
            </span>
            <Package className="w-4 h-4 text-[#000000]" />
          </div>
          <p className="text-2xl font-bold text-[#000000]">{orders.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {deliveredOrders.length} delivered
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              In Progress
            </span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{activeOrders.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {activeOrders.length > 0 ? "Crafting or in transit" : "No active orders"}
          </span>
        </div>

        <Link
          href="/account/profile"
          className="bg-white border border-slate-200/80 hover:border-[#000000] rounded-2xl p-5 shadow-xs transition-colors group block"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cap Measurement
            </span>
            <Sliders className="w-4 h-4 text-[#000000] group-hover:text-[#FED501] transition-colors" />
          </div>
          <p className="text-lg font-bold text-[#000000]">Saved Profile</p>
          <span className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-[#000000]">
            Manage head size &amp; address <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>

      {/* 3. Latest Order Spotlight (Clean, No-Noise) */}
      {latestOrder ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-[#000000]">Latest Order</h2>
              <span className="font-mono text-xs font-semibold text-slate-500">
                #{latestOrder.orderNumber || latestOrder.id.slice(0, 8).toUpperCase()}
              </span>
            </div>

            <Link
              href="/account/orders"
              className="text-xs font-semibold text-[#000000] hover:text-[#FED501] transition-colors flex items-center gap-1"
            >
              <span>All Orders ({orders.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border bg-slate-900 shrink-0">
                <ImageWithFallback
                  src={latestOrder.items[0]?.product?.images?.[0] || (latestOrder.items[0] as any)?.image}
                  alt={latestOrder.items[0]?.product?.name || (latestOrder.items[0] as any)?.name || "Product"}
                  fill
                  className="object-cover"
                  fallbackTitle={latestOrder.items[0]?.product?.name || (latestOrder.items[0] as any)?.name}
                  fallbackVariant="sm"
                />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-900 line-clamp-1">
                  {latestOrder.items.map((i) => `${i.quantity}x ${i.product?.name || (i as any).name || "Handcrafted Cap"}`).join(", ")}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Placed on {new Date(latestOrder.createdAt || Date.now()).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })} &bull; Total: <strong>₦{latestOrder.total.toLocaleString("en-NG")}</strong>
                </p>
                <div className="mt-1">
                  <span className="inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                    Status: {latestOrder.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {latestOrder.status === "pending" && (
                <button
                  type="button"
                  onClick={() => handleResumePayment(latestOrder)}
                  disabled={resumingOrderId === latestOrder.id}
                  className="px-3.5 py-1.5 rounded-xl bg-[#000000] hover:bg-black text-[#FED501] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {resumingOrderId === latestOrder.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FED501]" />
                  ) : (
                    <CreditCard className="w-3.5 h-3.5 text-[#FED501]" />
                  )}
                  <span>Pay Now</span>
                </button>
              )}

              <Link
                href={`/track-order?order=${encodeURIComponent(latestOrder.orderNumber || latestOrder.id)}`}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Track Order</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-2">
          <Package className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No Orders Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Explore our royal collection of hand-woven Aso-Oke and ceremonial Yoruba Fila caps.
          </p>
        </div>
      )}

      {/* 4. Simple Quick Actions Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/account/orders"
          className="bg-white border border-slate-200/80 hover:border-[#000000] rounded-2xl p-5 shadow-xs transition-all group flex items-start justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-[#000000] text-[#000000] group-hover:text-white flex items-center justify-center transition-colors mb-2.5">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#000000]">Order History</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              View all past receipts, track shipments, and re-order previous caps.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-[#000000] transition-all" />
        </Link>

        <Link
          href="/account/profile"
          className="bg-white border border-slate-200/80 hover:border-[#000000] rounded-2xl p-5 shadow-xs transition-all group flex items-start justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-[#FED501] text-[#000000] flex items-center justify-center transition-colors mb-2.5">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#000000]">Profile &amp; Head Size</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Save your custom circumference and delivery addresses for quick checkout.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-[#000000] transition-all" />
        </Link>
      </div>
    </div>
  );
}
