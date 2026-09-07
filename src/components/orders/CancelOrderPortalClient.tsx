"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Package,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Order } from "@/types/order";
import CancelOrderModal from "@/components/orders/CancelOrderModal";

export default function CancelOrderPortalClient() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get("order") || searchParams.get("ref") || "";

  const [orderQuery, setOrderQuery] = useState(initialOrder);
  const [emailQuery, setEmailQuery] = useState("");
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCancelOrder, setActiveCancelOrder] = useState<Order | null>(null);
  const [cancellationCompleted, setCancellationCompleted] = useState(false);

  useEffect(() => {
    // Check authenticated patron session and recent orders
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data.customer?.email) {
          setEmailQuery((prev) => prev || data.customer.email);
        }
      })
      .catch(() => {});

    fetch("/api/customer/orders")
      .then((res) => res.json())
      .then((data) => {
        if (data?.orders && Array.isArray(data.orders)) {
          const eligible = data.orders.filter(
            (o: Order) => o.status === "pending" || o.status === "paid" || o.status === "crafting"
          );
          setCustomerOrders(eligible);
        }
      })
      .catch(() => {});
  }, []);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) {
      setError("Please enter your Order Number or Paystack Reference.");
      return;
    }

    setLoading(true);
    setError(null);
    setCancellationCompleted(false);

    try {
      const params = new URLSearchParams({ query: orderQuery.trim() });
      if (emailQuery.trim()) {
        params.append("email", emailQuery.trim());
      }

      const res = await fetch(`/api/orders/track?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success && data.order) {
        setFoundOrder(data.order);
      } else {
        setFoundOrder(null);
        setError(data.message || "Order not found. Please verify your order number and email.");
      }
    } catch {
      setFoundOrder(null);
      setError("Network error while searching for your order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Terms & Conditions Callout */}
      <div className="p-5 sm:p-6 rounded-3xl bg-amber-50/90 border border-amber-200/90 text-amber-950 space-y-3">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Cancellation Policy Summary</span>
        </div>

        <ul className="space-y-2 text-xs text-amber-900/90 leading-relaxed pl-1">
          <li className="flex items-start gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Immediate Inventory Restoration:</strong> Reserved Yoruba headwear will be instantly restored to the live catalog upon cancellation.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>100% Full Refund via Paystack:</strong> For paid orders cancelled prior to crafting, the complete payment amount is credited back to your bank account within <strong>3 to 5 business days</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Workshop Crafting Restriction:</strong> Once our master weavers have shaped fabric on the loom (In Crafting), self-cancellation is locked. Please email Customer Care for assistance.
            </span>
          </li>
        </ul>

        <div className="pt-2 text-right">
          <Link
            href="/return-policy"
            target="_blank"
            className="text-[11px] font-bold underline text-amber-950 hover:text-black"
          >
            Read Full Policy Terms →
          </Link>
        </div>
      </div>

      {/* Cancellation Completed Alert */}
      {cancellationCompleted && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-2 text-center animate-scale-up">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-emerald-900">Order Successfully Cancelled</h3>
          <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
            Your cancellation has been finalized. Reserved stock has been returned to the catalog and your full refund has been scheduled via Paystack.
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-block px-5 py-2 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}

      {/* Order Lookup Form */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Search className="w-4 h-4 text-[#FED501]" />
          <span>Lookup Order to Cancel</span>
        </h2>

        <form onSubmit={handleLookup} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="lookup-order" className="text-xs font-bold text-slate-700">
              Order Number or Paystack Reference <span className="text-rose-500">*</span>
            </label>
            <Input
              id="lookup-order"
              placeholder="e.g. FY-2026-9281 or T839218204"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              className="h-11 rounded-xl"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="lookup-email" className="text-xs font-bold text-slate-700">
              Customer Email Address <span className="text-rose-500">*</span>
            </label>
            <Input
              id="lookup-email"
              type="email"
              placeholder="e.g. patron@example.com"
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              className="h-11 rounded-xl"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] font-bold text-white text-xs cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Order Details...
              </>
            ) : (
              "Find Order & Review Cancellation"
            )}
          </Button>
        </form>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Found Order Card */}
        {foundOrder && (
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-mono font-bold text-sm text-[#000000] block">
                  #{foundOrder.orderNumber || foundOrder.id.slice(0, 8).toUpperCase()}
                </span>
                <p className="text-slate-600 mt-0.5">
                  {foundOrder.items.map((i) => `${i.quantity}x ${(i as any).name || (i as any).productName}`).join(", ")}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-bold text-[#000000]">
                    Total: ₦{foundOrder.total.toLocaleString("en-NG")}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Status: {foundOrder.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {foundOrder.status === "cancelled" ? (
                  <span className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold">
                    Already Cancelled
                  </span>
                ) : foundOrder.status === "crafting" ? (
                  <Link
                    href="/contact"
                    className="px-4 py-2 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold hover:bg-amber-200 transition-colors"
                  >
                    Contact Care (On Loom)
                  </Link>
                ) : foundOrder.status === "shipped" || foundOrder.status === "delivered" ? (
                  <Link
                    href="/return-policy"
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    View Return Policy
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveCancelOrder(foundOrder)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel This Order</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Eligible Orders for Signed-in Patrons */}
      {customerOrders.length > 0 && !foundOrder && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#FED501]" />
            <span>Your Active Orders Eligible for Action</span>
          </h2>

          <div className="divide-y divide-slate-100">
            {customerOrders.map((co) => (
              <div
                key={co.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs first:pt-0 last:pb-0"
              >
                <div>
                  <span className="font-mono font-bold text-[#000000] block">
                    #{co.orderNumber || co.id.slice(0, 8).toUpperCase()}
                  </span>
                  <p className="text-slate-600 mt-0.5">
                    Total: ₦{co.total.toLocaleString("en-NG")} • Status:{" "}
                    <span className="font-bold text-slate-900 capitalize">{co.status}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {co.status === "crafting" ? (
                    <Link
                      href="/contact"
                      className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors"
                    >
                      In Crafting (Need Help?)
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveCancelOrder(co)}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Cancel Order</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Cancel Order Modal */}
      {activeCancelOrder && (
        <CancelOrderModal
          isOpen={Boolean(activeCancelOrder)}
          onClose={() => setActiveCancelOrder(null)}
          orderId={activeCancelOrder.id}
          orderNumber={activeCancelOrder.orderNumber || activeCancelOrder.id.slice(0, 8).toUpperCase()}
          total={activeCancelOrder.total}
          customerEmail={emailQuery || (activeCancelOrder.customer as any)?.email}
          isPaid={activeCancelOrder.status === "paid"}
          onSuccess={(updated) => {
            setActiveCancelOrder(null);
            setCancellationCompleted(true);
            setFoundOrder(updated || null);
            setCustomerOrders((prev) => prev.filter((o) => o.id !== updated?.id));
          }}
        />
      )}
    </div>
  );
}
