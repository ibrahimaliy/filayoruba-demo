"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { usePageRestore } from "@/hooks/use-page-restore";

export default function PaymentStep() {
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset loading status and dismiss persistent redirect toast when returning via Back/bfcache
  usePageRestore(() => setIsProcessing(false));

  const allItems = useCartStore((state) => state.items);
  const items = allItems.filter((item) => item.selected !== false);
  const selectedTotalPrice = useCartStore((state) => state.selectedTotalPrice);
  const subtotal = selectedTotalPrice();

  const customerInfo = useCheckoutStore((state) => state.customerInfo);
  const shippingAddress = useCheckoutStore((state) => state.shippingAddress);
  const shippingCost = useCheckoutStore((state) => state.shippingCost);
  const previousStep = useCheckoutStore((state) => state.previousStep);
  const pendingOrderId = useCheckoutStore((state) => state.pendingOrderId);
  const setPendingOrderId = useCheckoutStore((state) => state.setPendingOrderId);

  const total = subtotal + shippingCost;

  async function handlePayWithPaystack() {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          customer: customerInfo,
          address: shippingAddress,
          shipping: shippingCost,
          orderId: pendingOrderId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.authorizationUrl) {
        throw new Error(data.message || "Failed to initialize payment");
      }

      if (data.orderId) {
        setPendingOrderId(data.orderId);
      }

      const toastId = toast.loading("Redirecting to Paystack secure checkout...");

      // Automatically dismiss the redirect toast and reset isProcessing if user navigates back
      setTimeout(() => {
        setIsProcessing(false);
        toast.dismiss(toastId);
      }, 6000);

      // Cache pending checkout in localStorage so guest customers can recover/resume
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("tradedge_pending_checkout");
          localStorage.setItem(
            "filayoruba_pending_checkout",
            JSON.stringify({
              orderId: data.orderId,
              orderNumber: data.orderNumber || data.orderId,
              reference: data.reference,
              amount: data.amount || total,
              email: customerInfo.email,
              authorizationUrl: data.authorizationUrl,
              createdAt: Date.now(),
              items: items.map((i) => ({
                id: i.product.id,
                size: i.selectedSize,
                quantity: i.quantity,
              })),
            })
          );
        } catch {
          // Non-blocking
        }
      }

      // Redirect customer to Paystack Hosted Checkout
      window.location.assign(data.authorizationUrl);
    } catch (error) {
      console.error("Payment initialization error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect to payment gateway";
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border bg-white p-6 sm:p-8 shadow-sm space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 mb-3 border border-emerald-200/60">
            <Lock className="h-3.5 w-3.5" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
          <h2 className="text-2xl font-bold text-[#000000] mb-2">
            Payment Method
          </h2>
          <p className="text-sm text-muted-foreground">
            Complete your order with secure online payment via Paystack.
          </p>
        </div>

        {/* Amount to Pay Highlight Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-[#000000] to-[#1F1F1F] p-6 text-white text-center sm:text-left sm:flex sm:items-center sm:justify-between shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-300 font-medium">
              Total Amount Payable
            </p>
            <h3 className="text-3xl sm:text-4xl font-bold text-[#FED501] mt-1">
              ₦{total.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              For {customerInfo.firstName} {customerInfo.lastName} • {items.length} product(s)
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center justify-center sm:justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-md px-4 py-2 text-xs font-medium text-white border border-white/20">
              <Sparkles className="h-4 w-4 text-[#FED501]" />
              Paystack Secure Gateway
            </span>
          </div>
        </div>

        {/* Payment Channels Card */}
        <div className="rounded-2xl border p-5 bg-slate-50/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center shadow-xs">
                <CreditCard className="h-5 w-5 text-[#000000]" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-900">
                  Paystack Payment Gateway
                </h4>
                <p className="text-xs text-muted-foreground">
                  Cards (Mastercard, Visa, Verve), Bank Transfer, USSD & Apple Pay
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">Online</span>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t pt-3 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              You will be safely redirected to Paystack&apos;s verified payment portal to complete this transaction.
            </span>
          </div>
        </div>

        {/* Sandbox Test Card Helper */}
        <div className="rounded-2xl border border-amber-300/80 bg-amber-50/80 p-4 text-xs text-amber-900 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Showcase Sandbox Active — Test Payment Card Details</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            This platform is running in <strong>Paystack Test Mode</strong>. You can test order placement and tracking end-to-end without spending actual funds.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] bg-white/80 p-3 rounded-xl border border-amber-200 shadow-2xs">
            <div><span className="text-slate-500 block text-[9.5px] uppercase font-sans font-bold">TEST CARD NUMBER</span> 4084 0840 8408 4081</div>
            <div><span className="text-slate-500 block text-[9.5px] uppercase font-sans font-bold">EXPIRY &amp; CVV</span> 12/28 &amp; 408</div>
            <div><span className="text-slate-500 block text-[9.5px] uppercase font-sans font-bold">OTP / PIN</span> Any 4 digits (e.g. 1234)</div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={previousStep}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Review
          </Button>

          <Button
            type="button"
            size="lg"
            onClick={handlePayWithPaystack}
            disabled={isProcessing}
            className="w-full sm:w-auto bg-[#000000] hover:bg-[#1A1A1A] text-white px-10 py-6 text-base font-semibold shadow-md cursor-pointer disabled:opacity-70"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting to Paystack...
              </>
            ) : (
              `Pay with Paystack • ₦${total.toLocaleString()}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
