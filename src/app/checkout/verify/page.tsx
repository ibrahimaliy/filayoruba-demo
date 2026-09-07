"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

function VerifyPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const [status, setStatus] = useState<"loading" | "success" | "failed">(() =>
    !reference ? "failed" : "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string>(() =>
    !reference ? "No transaction reference found in payment callback." : ""
  );

  const isVerifyingRef = useRef(false);
  const hasVerifiedRef = useRef(false);

  const clearPurchasedItems = useCartStore((state) => state.clearPurchasedItems);
  const clearCart = useCartStore((state) => state.clearCart);
  const clearCheckout = useCheckoutStore((state) => state.clearCheckout);

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      setErrorMessage("No transaction reference found in payment callback.");
      return;
    }

    if (isVerifyingRef.current || hasVerifiedRef.current) {
      return;
    }
    isVerifyingRef.current = true;

    async function verify() {
      try {
        const response = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference!)}`);
        const data = await response.json();

        if (response.ok && data.success) {
          hasVerifiedRef.current = true;
          setStatus("success");
          toast.success("Payment verified successfully!");

          // Broadcast payment confirmation to any open track-order tabs immediately
          if (typeof window !== "undefined") {
            try {
              const bc = new BroadcastChannel("filayoruba_order_sync");
              bc.postMessage({
                action: "ORDER_PAID",
                orderId: data.orderId,
                orderNumber: data.orderNumber || data.orderId,
                reference: data.reference,
              });
              setTimeout(() => bc.close(), 1000);
            } catch {}

            window.dispatchEvent(
              new CustomEvent("filayoruba:order-paid", {
                detail: {
                  orderId: data.orderId,
                  orderNumber: data.orderNumber || data.orderId,
                  reference: data.reference,
                },
              })
            );
          }

          // Clear purchased cart items and checkout forms
          if (data.items && data.items.length > 0) {
            clearPurchasedItems(data.items);
          } else {
            clearCart();
          }
          clearCheckout();

          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem("filayoruba_pending_checkout");
              localStorage.removeItem("tradedge_pending_checkout");
              localStorage.removeItem("filayoruba-cart");
            } catch {}
          }

          // Redirect to success page (replace history state so back navigation doesn't reload expired Paystack session)
          setTimeout(() => {
            const emailParam = data.email ? `&email=${encodeURIComponent(data.email)}` : "";
            router.replace(
              `/checkout/success?orderId=${encodeURIComponent(data.orderId)}&orderNumber=${encodeURIComponent(data.orderNumber || data.orderId)}&amount=${encodeURIComponent(data.amount)}&reference=${encodeURIComponent(data.reference)}${emailParam}`
            );
          }, 800);
        } else {
          hasVerifiedRef.current = true;
          setStatus("failed");
          setErrorMessage(data.message || "Payment verification could not be confirmed.");
        }
      } catch {
        isVerifyingRef.current = false;
        setStatus("failed");
        setErrorMessage("Network error occurred while verifying payment.");
      }
    }

    verify();
  }, [reference, clearPurchasedItems, clearCart, clearCheckout, router]);

  return (
    <div className="mx-auto max-w-lg rounded-3xl border bg-white p-8 sm:p-12 shadow-sm text-center">
      {status === "loading" && (
        <div className="space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#000000]/10 text-[#000000]">
            <Loader2 className="h-10 w-10 animate-spin text-[#FED501]" />
          </div>
          <h1 className="text-3xl font-bold text-[#000000]">
            Verifying Payment
          </h1>
          <p className="text-sm text-muted-foreground">
            Please wait while we confirm your transaction with Paystack...
          </p>
          <div className="text-xs text-slate-400 font-mono">
            Ref: {reference || "Pending"}
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-[#000000]">
            Payment Confirmed!
          </h1>
          <p className="text-sm text-muted-foreground">
            Your transaction was successful. Redirecting to your order confirmation...
          </p>
        </div>
      )}

      {status === "failed" && (
        <div className="space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-red-700">
            Payment Incomplete
          </h1>
          <p className="text-sm text-slate-600">
            {errorMessage || "We could not verify your payment. Your card was not charged or the transaction was cancelled."}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/checkout"
              className={cn(buttonVariants({ size: "lg" }), "bg-[#000000] hover:bg-[#1A1A1A] text-white")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Checkout
            </Link>
            <Link
              href="/contact"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Contact Support
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPaymentPage() {
  return (
    <main className="container mx-auto px-4 py-24 min-h-[70vh] flex items-center justify-center">
      <Suspense
        fallback={
          <div className="mx-auto max-w-lg rounded-3xl border bg-white p-12 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#000000]" />
            <p className="mt-4 text-sm text-muted-foreground">Loading verification...</p>
          </div>
        }
      >
        <VerifyPaymentContent />
      </Suspense>
    </main>
  );
}
