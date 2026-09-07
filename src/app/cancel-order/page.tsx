import { Suspense } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, ShieldAlert } from "lucide-react";
import CancelOrderPortalClient from "@/components/orders/CancelOrderPortalClient";

export const metadata = {
  title: "Order Cancellation Portal | Fìlà Yorùbá",
  description: "Self-service order cancellation portal for Fìlà Yorùbá patrons. Cancel eligible orders with automatic inventory restoration and full Paystack refunds.",
};

export default function CancelOrderPage() {
  return (
    <main className="container mx-auto px-4 py-14 sm:py-20 min-h-[80vh]">
      <div className="max-w-3xl mx-auto mb-10 text-center">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-black mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
        </Link>
        <span className="block text-xs uppercase tracking-widest font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200/80 w-fit mx-auto mb-3">
          Patron Self-Service
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#000000]">
          Cancel Your Fìlà Order
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Need to make a change or cancel? Review our artisanal policy below and cancel eligible orders with instant inventory release and 100% full refund.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="max-w-xl mx-auto rounded-3xl border bg-white p-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#000000]" />
            <p className="mt-3 text-xs text-muted-foreground">Loading cancellation portal...</p>
          </div>
        }
      >
        <CancelOrderPortalClient />
      </Suspense>
    </main>
  );
}
