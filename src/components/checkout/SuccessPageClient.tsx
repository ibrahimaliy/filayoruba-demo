"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  Package,
  ShieldCheck,
  Truck,
  XCircle,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CancelOrderModal from "@/components/orders/CancelOrderModal";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";

interface SuccessPageClientProps {
  orderId?: string;
  orderNumber?: string;
  amount?: string;
  reference?: string;
  email?: string;
}

export default function SuccessPageClient({
  orderId,
  orderNumber,
  amount,
  reference,
  email,
}: SuccessPageClientProps) {
  const displayOrderId = orderNumber || (orderId ? orderId.slice(0, 8).toUpperCase() : "FY-ORD-SUCCESS");
  const formattedAmount = amount ? Number(amount).toLocaleString() : null;
  const trackRef = orderNumber || reference || orderId || "";

  const [isCancelled, setIsCancelled] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Defense-in-depth: Ensure cart and checkout session are purged upon landing on order confirmation
  useEffect(() => {
    try {
      useCartStore.getState().clearCart();
      useCheckoutStore.getState().clearCheckout();
      if (typeof window !== "undefined") {
        localStorage.removeItem("filayoruba_pending_checkout");
        localStorage.removeItem("tradedge_pending_checkout");
        localStorage.removeItem("filayoruba-cart");
        localStorage.removeItem("filayoruba-checkout");
      }
    } catch {}
  }, []);

  return (
    <main className="container mx-auto px-4 py-16 sm:py-20 max-w-3xl">
      <div className="rounded-3xl border bg-white p-6 sm:p-12 shadow-sm text-center space-y-6">
        {/* Animated Icon */}
        <div
          className={cn(
            "mx-auto flex h-20 w-20 items-center justify-center rounded-full transition-colors",
            isCancelled ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
          )}
        >
          {isCancelled ? <XCircle className="h-10 w-10" /> : <CheckCircle2 className="h-10 w-10" />}
        </div>

        <div>
          <span
            className={cn(
              "inline-block text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full border mb-3",
              isCancelled
                ? "text-rose-700 bg-rose-50 border-rose-200"
                : "text-emerald-700 bg-emerald-50 border-emerald-200/60"
            )}
          >
            {isCancelled ? "Order Cancelled" : "Payment Confirmed & Recorded"}
          </span>

          <h1 className="text-3xl sm:text-4xl font-bold text-[#000000]">
            {isCancelled ? "Order Successfully Cancelled" : "Thank You For Your Order!"}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {isCancelled
              ? "Your cancellation has been processed. All reserved cap stock has been restored to the catalog, and your full refund has been scheduled via Paystack within 3–5 business days."
              : "Your payment has been successfully verified via Paystack and saved to our master artisan queue. Your handcrafted Yoruba Fila cap will be shaped with utmost precision."}
          </p>
        </div>

        {/* Order Details Badge */}
        <div className="rounded-2xl bg-slate-50 border p-5 sm:p-6 max-w-md mx-auto space-y-3 text-left">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Order Number:</span>
            <span className="font-mono font-bold text-[#000000]">#{displayOrderId}</span>
          </div>

          {reference && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Paystack Ref:</span>
              <span className="font-mono text-xs text-slate-700 truncate max-w-[200px]">{reference}</span>
            </div>
          )}

          {formattedAmount && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-bold text-slate-900">₦{formattedAmount}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full",
                isCancelled
                  ? "text-rose-700 bg-rose-100"
                  : "text-emerald-700 bg-emerald-100/60"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isCancelled ? "bg-rose-600" : "bg-emerald-600"
                )}
              />
              {isCancelled ? "Cancelled & Refund Scheduled" : "Paid & Queued"}
            </span>
          </div>
        </div>

        {/* Cancellation Self-Service Banner */}
        {!isCancelled && (
          <div className="rounded-2xl bg-amber-50/90 border border-amber-200/90 p-4 sm:p-5 max-w-lg mx-auto text-left space-y-3">
            <div className="flex items-start gap-2.5">
              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-amber-900">
                  Need to Cancel or Modify Your Order?
                </h2>
                <p className="text-[11px] sm:text-xs text-amber-800/90 mt-1 leading-relaxed">
                  Under our{" "}
                  <Link
                    href="/return-policy"
                    target="_blank"
                    className="font-bold underline text-amber-950 hover:text-black"
                  >
                    Order Cancellation Policy
                  </Link>
                  , you can self-cancel this order prior to artisan handcrafting for a 100% full refund credited to your bank account within 3–5 business days.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Cancel Order</span>
              </button>
            </div>
          </div>
        )}

        {/* What to expect cards */}
        {!isCancelled && (
          <div className="grid sm:grid-cols-2 gap-4 text-left pt-2">
            <div className="rounded-2xl border p-5 bg-white">
              <div className="flex items-center gap-3 font-semibold text-slate-900 text-sm mb-2">
                <Package className="h-4 w-4 text-[#FED501]" />
                <span>Ceremonial Packaging</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your Fila is enclosed in dust-free packaging to preserve its authentic shape and sharp architectural folds.
              </p>
            </div>

            <div className="rounded-2xl border p-5 bg-white">
              <div className="flex items-center gap-3 font-semibold text-slate-900 text-sm mb-2">
                <ShieldCheck className="h-4 w-4 text-[#FED501]" />
                <span>Real-Time Tracking</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Track weaving progress, quality inspection, and dispatch status anytime in our tracking portal.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-3">
          <Link
            href={`/track-order?ref=${encodeURIComponent(trackRef)}${email ? `&email=${encodeURIComponent(email)}` : ""}`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full sm:w-auto bg-[#000000] hover:bg-[#1A1A1A] text-white px-8 rounded-xl font-bold text-xs"
            )}
          >
            <Truck className="mr-2 h-4 w-4 text-[#FED501]" /> Track Order Status
          </Link>

          <Link
            href="/products"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full sm:w-auto rounded-xl font-bold text-xs"
            )}
          >
            Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <CancelOrderModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          orderId={orderId || orderNumber || ""}
          orderNumber={displayOrderId}
          total={amount ? Number(amount) : 0}
          isPaid={true}
          onSuccess={() => {
            setIsCancelled(true);
            setShowCancelModal(false);
          }}
        />
      )}
    </main>
  );
}
