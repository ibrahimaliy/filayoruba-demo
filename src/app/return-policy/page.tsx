import type { Metadata } from "next";
import Link from "next/link";
import {
  RotateCcw,
  ChevronRight,
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileText,
  Mail,
  Truck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Scissors,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Return & Refund Policy | Fìlà Yorùbá",
  description:
    "Official Return, Refund, and Exchange Policy for Fìlà Yorùbá. Learn about our 14-day return window, exchange criteria, inspection guidelines, and custom order policies.",
  openGraph: {
    title: "Return & Refund Policy • Fìlà Yorùbá | Luxury Yoruba Fila",
    description:
      "Comprehensive guidelines on returns, exchanges, refunds, and damaged item claims for handcrafted Yoruba headwear.",
  },
};

export default function ReturnPolicyPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 py-10 lg:py-16 max-w-4xl space-y-12">
      {/* 1. Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-none"
      >
        <Link href="/" className="hover:text-[#000000] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <span className="font-semibold text-[#000000]">Return & Refund Policy</span>
      </nav>

      {/* 2. Hero Header */}
      <header className="space-y-4 border-b border-slate-200/80 pb-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#000000] text-white text-[11px] font-bold uppercase tracking-wider">
            <RotateCcw className="w-3.5 h-3.5 text-[#FED501]" />
            Official Policy
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100/80 border border-amber-300/60 text-amber-900 text-[10px] font-extrabold uppercase tracking-widest">
            (Please Read)
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#000000] tracking-tight">
          Return and Refund Policy
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          This Refund and Return Policy (&ldquo;Policy&rdquo;) applies to all purchases made through{" "}
          <strong className="font-semibold text-[#000000]">FÌLÀ YORÙBÁ</strong> (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;),
          a business engaged in the design, production, and sale of handcrafted traditional Yorùbá caps
          (&ldquo;Products&rdquo;). By placing an order with us, you (&ldquo;Customer,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;)
          agree to the terms outlined herein.
        </p>
      </header>

      {/* 3. Quick Policy Highlights (4-Pillars Grid) */}
      <section aria-labelledby="highlights-title" className="space-y-4">
        <h2 id="highlights-title" className="text-xs font-bold uppercase tracking-widest text-[#FED501]">
          Policy at a Glance
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#000000]/5 text-[#000000] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#FED501]" />
            </div>
            <h3 className="font-bold text-sm text-[#000000]">14-Day Returns</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Standard non-custom items can be returned within 14 calendar days of delivery.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#000000]/5 text-[#000000] flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-[#FED501]" />
            </div>
            <h3 className="font-bold text-sm text-[#000000]">7-Day Exchanges</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Exchanges permitted for defective items or transit damage within 7 calendar days.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#000000]/5 text-[#000000] flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-[#FED501]" />
            </div>
            <h3 className="font-bold text-sm text-[#000000]">48h Damage Claims</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Report transit defects with photos within 48 hours of package reception.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#000000]/5 text-[#000000] flex items-center justify-center">
              <Scissors className="w-4 h-4 text-[#FED501]" />
            </div>
            <h3 className="font-bold text-sm text-[#000000]">Custom Orders</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bespoke, custom embroidered, and tailored caps are final sale & non-refundable.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Numbered Policy Sections (1 to 6) */}
      <section className="space-y-10 text-slate-700">
        {/* SECTION 1: RETURNS */}
        <article className="space-y-5 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold text-[#FED501] uppercase tracking-wider block">
              Section 1
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#000000] mt-0.5">
              1. Returns
            </h2>
          </div>

          {/* 1.1 Eligibility */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-mono">
                1.1
              </span>
              Eligibility
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-7">
              We accept returns strictly for standard, non-customized items that meet the following conditions:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm pl-7 text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  The return request is made within <strong>14 calendar days</strong> of the original delivery date.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  The item is returned in <strong>unused, undamaged, and resalable condition</strong>, with all original packaging and labeling intact.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Proof of purchase</strong> (receipt, order confirmation, or order number) is provided.
                </span>
              </li>
            </ul>
          </div>

          {/* 1.2 Non-Eligible Items */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-mono">
                1.2
              </span>
              Non-Eligible Items
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-7">
              Returns shall <strong>not be accepted</strong> under the following circumstances:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm pl-7 text-slate-600">
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>The item was custom-made, altered, embroidered, or tailored to the customer&apos;s specifications.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>The item was marked as &ldquo;Final Sale&rdquo; or &ldquo;Non-Returnable&rdquo; at the time of purchase.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>The item has been used, worn, perfume-scented, or damaged after delivery.</span>
              </li>
            </ul>
          </div>

          {/* 1.3 Return Procedure */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-mono">
                1.3
              </span>
              Return Procedure
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-7">
              To initiate a return, please contact our Customer Care team at{" "}
              <a
                href="mailto:demo@filayoruba.com?subject=Return%20Request%20-%20F%C3%ACl%C3%A0%20Yor%C3%B9b%C3%A1"
                className="font-bold text-[#000000] underline hover:text-[#FED501] transition-colors"
              >
                demo@filayoruba.com
              </a>{" "}
              with your order number and reason for return. Upon approval, you will receive detailed return instructions.
              Customers are responsible for return shipping costs unless the return is due to an error on our part.
            </p>
          </div>
        </article>

        {/* SECTION 2: REFUNDS */}
        <article className="space-y-5 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold text-[#FED501] uppercase tracking-wider block">
              Section 2
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#000000] mt-0.5">
              2. Refunds
            </h2>
          </div>

          {/* 2.1 Refund Processing */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-mono">
                2.1
              </span>
              Refund Processing
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-7">
              Upon receipt and inspection of the returned item, we will notify you of the approval or rejection of your refund. If approved, a refund will be processed to the original payment method within <strong>10 business days</strong>.
            </p>
          </div>

          {/* 2.2 Partial Refunds */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-mono">
                2.2
              </span>
              Partial Refunds
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-7">
              We reserve the right to issue a partial refund in instances where items are not returned in original condition, are missing parts, or show signs of wear.
            </p>
          </div>

          {/* 2.3 Shipping Fees */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-mono">
                2.3
              </span>
              Shipping Fees
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-7">
              Shipping fees are non-refundable unless the return is due to a fault on our part (e.g., defective or incorrect item).
            </p>
          </div>
        </article>

        {/* SECTION 3: EXCHANGES */}
        <article className="space-y-5 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold text-[#FED501] uppercase tracking-wider block">
              Section 3
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#000000] mt-0.5">
              3. Exchanges
            </h2>
          </div>

          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We permit product exchanges only under the following conditions:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm pl-2 text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>The product was received in defective condition or damaged in transit.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  The exchange request is made within <strong>7 calendar days</strong> of receipt.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>The requested replacement product is available in inventory.</span>
              </li>
            </ul>

            <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Inventory Note:</strong> All exchanges are subject to product availability. We do not guarantee stock levels for replacement items. In the event a replacement cap is out of stock, store credit or a full refund will be provided.
              </span>
            </div>
          </div>
        </article>

        {/* SECTION 4: DAMAGED OR DEFECTIVE GOODS */}
        <article className="space-y-4 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold text-[#FED501] uppercase tracking-wider block">
              Section 4
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#000000] mt-0.5">
              4. Damaged or Defective Goods
            </h2>
          </div>

          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Customers must inspect all products immediately upon delivery. Claims for defective, damaged, or incorrect items must be submitted to us via email within <strong>48 hours of delivery</strong>, along with photographic evidence.
            </p>

            <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/60 text-xs text-red-900 leading-relaxed flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>
                <strong>Strict Inspection Window:</strong> Claims received beyond the 48-hour window may not be eligible for resolution under transit damage warranty.
              </span>
            </div>
          </div>
        </article>

        {/* SECTION 5: CUSTOM ORDERS */}
        <article className="space-y-4 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold text-[#FED501] uppercase tracking-wider block">
              Section 5
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#000000] mt-0.5">
              5. Custom Orders
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            All custom, bespoke, or made-to-order <strong className="text-[#000000]">FÌLÀ YORÙBÁ</strong> caps are non-refundable and non-returnable, except where required by law. This includes caps made to fit specific head measurements, custom embroidery, or specialty fabric choices. Please confirm all details before placing a custom order.
          </p>
        </article>

        {/* SECTION 6: ORDER CANCELLATION TERMS & CONDITIONS */}
        <article className="space-y-5 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold text-[#FED501] uppercase tracking-wider block">
              Section 6
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#000000] mt-0.5">
              6. Order Cancellation Terms &amp; Conditions
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We understand that circumstances may arise where you need to cancel an order. Because our Fìlà headwear is produced in authentic artisanal batches, order cancellations are governed by the following terms:
          </p>

          {/* 6.1 Cancellation Windows */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-mono">
                6.1
              </span>
              Cancellation Eligibility by Fulfillment Milestone
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm pl-7 text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Pending / Unpaid Orders:</strong> May be cancelled immediately by the patron through their Account or Order Tracking portal at any time without fee or penalty.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Paid &amp; Queued Orders:</strong> May be self-cancelled by the customer at any time prior to the commencement of artisan workshop handcrafting. A 100% full refund will be automatically scheduled.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>In Artisan Handcrafting (Crafting):</strong> Once our master weavers have shaped fabric and begun tailoring your bespoke cap, automated self-cancellation is restricted. Patrons must contact Customer Care for case-by-case workshop review.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Dispatched or Delivered Orders:</strong> Orders that have been handed to the logistics courier or delivered cannot be cancelled. Patrons must refer to our 14-day Return &amp; Exchange Policy upon receipt.
                </span>
              </li>
            </ul>
          </div>

          {/* 6.2 Automatic Inventory Restoration */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-mono">
                6.2
              </span>
              Automatic Inventory &amp; Stock Release
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-7">
              Upon successful cancellation of an order by either the patron or store administration, reserved headwear stock is instantly released and restored to the live catalog for other patrons.
            </p>
          </div>

          {/* 6.3 Refund Processing Timelines */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-mono">
                6.3
              </span>
              Refund Timelines for Paid Orders
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-7">
              For paid orders cancelled prior to crafting, the full transaction amount (including shipping fee) is refunded to the original payment method through Paystack within <strong>3 to 5 business days</strong>, depending on your bank&apos;s settlement schedule.
            </p>
          </div>

          {/* 6.4 Cancellation Procedure */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-mono">
                6.4
              </span>
              How to Cancel an Order
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-7">
              Patrons can cancel eligible orders directly via the <Link href="/account/orders" className="font-bold text-[#000000] underline hover:text-[#FED501]">Patron Orders Portal</Link> or the <Link href="/track-order" className="font-bold text-[#000000] underline hover:text-[#FED501]">Track Order</Link> page by verifying their order number and email.
            </p>
          </div>
        </article>

        {/* SECTION 7: MODIFICATIONS TO THIS POLICY */}
        <article className="space-y-4 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold text-[#FED501] uppercase tracking-wider block">
              Section 7
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#000000] mt-0.5">
              7. Modifications to this Policy
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We reserve the right to amend or update this Policy at any time without prior notice. Changes will become effective upon posting on our official website. Continued use of our services following any changes constitutes acceptance of the revised terms.
          </p>
        </article>
      </section>

      {/* 5. Contact Concierge Card */}
      <section className="bg-gradient-to-br from-[#000000] to-[#1F1F1F] text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border border-white/10 relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FED501]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#FED501]">
            <Sparkles className="w-3.5 h-3.5" /> Direct Concierge Contact
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            Need to Initiate a Return or Exchange?
          </h2>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
            For all return, refund, or exchange inquiries, our dedicated patron concierge is at your service. Please provide your order number and photo attachments for speedy processing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-white/60 font-bold block">
              Primary Returns Email
            </span>
            <a
              href="mailto:demo@filayoruba.com?subject=Return%20or%20Exchange%20Inquiry%20-%20F%C3%ACl%C3%A0%20Yor%C3%B9b%C3%A1"
              className="text-sm sm:text-base font-bold text-[#FED501] hover:underline flex items-center gap-1.5"
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span>demo@filayoruba.com</span>
            </a>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-white/60 font-bold block">
              Official Policy URL
            </span>
            <span className="text-sm font-mono text-white/90 font-medium block truncate">
              /return-policy
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3 relative z-10">
          <a
            href="mailto:demo@filayoruba.com?subject=Return%20Request%20[Order%20Number]&body=Hello%20F%C3%ACl%C3%A0%20Yor%C3%B9b%C3%A1%20Concierge,%0D%0A%0D%0AI%20would%20like%20to%20request%20a%20return/exchange%20for%20Order%20Number:%20%0D%0AReason:%20"
            className="px-6 py-3 rounded-xl bg-[#FED501] hover:bg-[#EAB308] text-[#000000] text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Email Customer Care</span>
          </a>

          <Link
            href="/track-order"
            className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 inline-flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>Track Delivery Status</span>
          </Link>

          <Link
            href="/size-guide"
            className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 inline-flex items-center gap-2"
          >
            <span>Fìlà Size Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
