"use client";

import { useState } from "react";
import {
  AlertTriangle,
  X,
  Loader2,
  CheckCircle2,
  Package,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  total: number;
  customerEmail?: string;
  isPaid?: boolean;
  onSuccess: (updatedOrder: any) => void;
}

const CANCELLATION_REASONS = [
  "Placed order by mistake / Duplicate",
  "Need to select a different cap size or color",
  "Delivery timeframe does not suit my event schedule",
  "Found another headwear preference",
  "Financial or personal reasons",
  "Other reason",
];

export default function CancelOrderModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  total,
  customerEmail,
  isPaid = false,
  onSuccess,
}: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [notes, setNotes] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [emailInput, setEmailInput] = useState(customerEmail || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!termsAccepted) {
      setErrorMessage("Please accept the Order Cancellation Terms & Conditions to proceed.");
      return;
    }

    if (!selectedReason) {
      setErrorMessage("Please choose a reason for cancelling your order.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/customer/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          reason: selectedReason,
          notes: notes.trim() || undefined,
          email: emailInput.trim() || customerEmail,
          termsAccepted: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to cancel order.");
      }

      toast.success("Order Successfully Cancelled", {
        description: data.message || `Order #${orderNumber} has been cancelled.`,
      });

      onSuccess(data.order);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred while cancelling your order.";
      setErrorMessage(msg);
      toast.error("Cancellation Failed", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 border border-slate-200 shadow-2xl relative animate-scale-up space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-600">
              Patron Self-Service
            </span>
            <h2 id="cancel-modal-title" className="text-xl font-serif font-bold text-[#000000]">
              Cancel Order #{orderNumber}
            </h2>
          </div>
        </div>

        {/* Order Summary & Value */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Package className="w-4 h-4 text-slate-400" />
            <span>Order Value:</span>
          </div>
          <span className="font-bold text-[#000000] text-sm">
            ₦{(total || 0).toLocaleString("en-NG")}
          </span>
        </div>

        {/* Terms and Conditions Highlights Box */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Applicable Terms &amp; Conditions</span>
          </div>
          <ul className="space-y-1.5 text-[11px] sm:text-xs text-amber-900/90 leading-relaxed pl-1">
            <li className="flex items-start gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Inventory Release:</strong> Reserved cap quantities will be immediately restored to the royal catalog.
              </span>
            </li>
            {isPaid ? (
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Full Refund via Paystack:</strong> 100% of your ₦{total.toLocaleString("en-NG")} payment will be refunded to your source bank within <strong>3 to 5 business days</strong>.
                </span>
              </li>
            ) : (
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Pending Order:</strong> No charge was made; this transaction will be voided without fee.
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Irreversible:</strong> Once confirmed, this order cancellation cannot be undone.
              </span>
            </li>
          </ul>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* If email wasn't provided from session, show email input for verification */}
          {!customerEmail && (
            <div className="space-y-1.5">
              <label htmlFor="cancel-email" className="text-xs font-bold text-slate-800">
                Email Used at Checkout <span className="text-rose-500">*</span>
              </label>
              <input
                id="cancel-email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. patron@example.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#000000] bg-white"
              />
            </div>
          )}

          {/* Reason Selector */}
          <div className="space-y-1.5">
            <label htmlFor="cancel-reason" className="text-xs font-bold text-slate-800">
              Reason for Cancellation <span className="text-rose-500">*</span>
            </label>
            <select
              id="cancel-reason"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#000000] bg-white text-slate-800 cursor-pointer"
            >
              {CANCELLATION_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Notes */}
          <div className="space-y-1.5">
            <label htmlFor="cancel-notes" className="text-xs font-bold text-slate-800">
              Additional Details <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="cancel-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell us what could have made your bespoke experience better..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#000000] bg-white text-slate-800 resize-none"
            />
          </div>

          {/* Terms Agreement Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#000000] focus:ring-[#000000] cursor-pointer"
            />
            <span className="text-xs text-slate-700 leading-snug">
              I have read and agree to the{" "}
              <Link
                href="/return-policy"
                target="_blank"
                className="font-bold underline text-[#000000] hover:text-[#FED501]"
              >
                Order Cancellation Terms &amp; Conditions
              </Link>
              , and understand that reserved stock will be returned to inventory.
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Nevermind, Keep My Order
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !termsAccepted}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm Cancellation</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
