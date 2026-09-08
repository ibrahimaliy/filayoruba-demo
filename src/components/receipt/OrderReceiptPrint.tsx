import React from "react";
import { Order } from "@/types/order";
import { formatSizeLabel } from "@/lib/sizing";
import { Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";

interface OrderReceiptPrintProps {
  order: Order;
}

export default function OrderReceiptPrint({ order }: OrderReceiptPrintProps) {
  const orderNum = order.orderNumber || order.id;
  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  return (
    <div className="hidden print:block w-full max-w-2xl mx-auto bg-white text-[#000000] p-8 border border-slate-200 rounded-2xl shadow-none">
      {/* 1. Header Banner */}
      <div className="bg-[#000000] text-white p-6 rounded-xl text-center border-b-4 border-[#FED501] mb-6 flex flex-col items-center">
        <div className="mb-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden isolate shrink-0">
            <img
              src="/images/fallback%20logo/fallback%20logo.jpg"
              alt="Fìlà Yorùbá"
              className="w-full h-full object-cover rounded-full scale-[1.7]"
              loading="eager"
            />
          </div>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-[#FED501] font-semibold mt-1">
          Luxury Yoruba Fila Artisan Craft &bull; Official Proof of Purchase
        </p>
      </div>

      {/* 2. Customer Salutation */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#000000]">
          Thank you for your order, {order.customer?.firstName || "Valued Customer"}!
        </h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Your payment has been verified via Paystack. Your authentic Yoruba Fila cap has been queued for hand-tailoring and quality certification.
        </p>
      </div>

      {/* 3. Order Meta Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
            Order Number
          </span>
          <span className="font-mono font-bold text-[#000000] text-sm">
            {orderNum}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
            Date Placed
          </span>
          <span className="font-semibold text-slate-800">{formattedDate}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
            Customer
          </span>
          <span className="font-semibold text-slate-800">
            {order.customer?.firstName || "Valued"} {order.customer?.lastName || "Customer"}
          </span>
          {order.customer?.email && (
            <span className="text-[11px] text-slate-500 block">
              {order.customer.email}
            </span>
          )}
          {order.customer?.phone && (
            <span className="text-[11px] text-slate-500 block">
              {order.customer.phone}
            </span>
          )}
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
            Delivery Destination
          </span>
          <span className="font-semibold text-slate-800 block">
            {order.address?.address || "In-Store / Destination Pending"}
          </span>
          <span className="text-slate-600 block">
            {[order.address?.city, order.address?.state].filter(Boolean).join(", ")}
          </span>
          <span className="text-[10px] text-slate-500 uppercase font-bold mt-1 block">
            Payment: {order.paymentMethod || "Paystack"} (Paid)
          </span>
        </div>
      </div>

      {/* 4. Ordered Items Breakdown */}
      <table className="w-full text-xs border-collapse mb-6">
        <thead>
          <tr className="border-b-2 border-slate-300 text-[10px] uppercase tracking-wider text-slate-500 text-left">
            <th className="py-2">Item Description</th>
            <th className="py-2 text-center">Fila Size</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Unit Price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {order.items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-3 font-semibold text-slate-800">
                {item.product.name}
              </td>
              <td className="py-3 text-center text-slate-600 font-mono">
                {formatSizeLabel(item.selectedSize)}
              </td>
              <td className="py-3 text-center text-slate-800 font-bold">
                {item.quantity}
              </td>
              <td className="py-3 text-right text-slate-600 font-mono">
                ₦{item.product.price.toLocaleString("en-NG")}
              </td>
              <td className="py-3 text-right font-bold text-[#000000] font-mono">
                ₦{(item.product.price * item.quantity).toLocaleString("en-NG")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 5. Financial Summary */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono font-semibold">
              ₦{order.subtotal.toLocaleString("en-NG")}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Nationwide Dispatch</span>
            <span className="font-mono font-semibold">
              {order.shipping === 0
                ? "Complimentary"
                : `₦${order.shipping.toLocaleString("en-NG")}`}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold text-[#000000] pt-2 border-t border-slate-300">
            <span>Total Paid</span>
            <span className="font-mono text-[#000000]">
              ₦{order.total.toLocaleString("en-NG")}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Artisan Seal & Terms */}
      <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">
          Ancestral Weaving Lineage &bull; Oyo Narrow-Loom Certified
        </p>
        <p>
          Each Fìlà Yorùbá cap is handwoven and molded. Thank you for preserving indigenous Yoruba textile heritage.
        </p>
        <p className="text-[9px] text-slate-400">
          Need support? Email demo@filayoruba.com or visit /track-order
        </p>
      </div>
    </div>
  );
}
