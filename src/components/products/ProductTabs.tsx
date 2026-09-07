"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Product } from "@/types/product";
import ProductReviewsSection from "./ProductReviewsSection";
import { Sparkles, Truck, ShieldCheck, HelpCircle } from "lucide-react";

export default function ProductTabs({
  product,
}: {
  product: Product;
}) {
  const reviewCount = product.reviews?.length || 0;

  return (
    <div className="mt-20">
      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="bg-slate-100/80 p-1.5 rounded-2xl flex flex-wrap gap-2 w-full sm:w-auto h-auto">
          <TabsTrigger
            value="reviews"
            className="rounded-xl px-5 py-2.5 text-xs font-bold data-[state=active]:bg-[#000000] data-[state=active]:text-white transition-all flex items-center gap-2"
          >
            <span>Customer Reviews</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FED501] text-[#000000]">
              {reviewCount}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="description"
            className="rounded-xl px-5 py-2.5 text-xs font-bold data-[state=active]:bg-[#000000] data-[state=active]:text-white transition-all"
          >
            Artisan Details & Heritage
          </TabsTrigger>

          <TabsTrigger
            value="shipping"
            className="rounded-xl px-5 py-2.5 text-xs font-bold data-[state=active]:bg-[#000000] data-[state=active]:text-white transition-all"
          >
            Delivery & Crafting Timeline
          </TabsTrigger>
        </TabsList>

        {/* 1. Reviews Tab */}
        <TabsContent value="reviews" className="mt-8 focus:outline-none">
          <ProductReviewsSection
            productSlug={product.slug}
            productName={product.name}
            initialReviews={product.reviews || []}
            initialRating={product.rating || 5.0}
          />
        </TabsContent>

        {/* 2. Description Tab */}
        <TabsContent value="description" className="mt-8 focus:outline-none">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FED501] uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Traditional Craftsmanship
            </div>
            <h3 className="text-xl font-bold text-[#000000] font-serif">
              About {product.name}
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
              {product.description || "Authentic handcrafted Yoruba Fila cap crafted by master weavers."}
            </p>

            <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="font-bold text-xs text-[#000000]">Premium Aso-Oke</div>
                <div className="text-[11px] text-slate-500 mt-1">100% authentic hand-woven Nigerian ceremonial textile.</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="font-bold text-xs text-[#000000]">Tailored Oyo Fit</div>
                <div className="text-[11px] text-slate-500 mt-1">Rigid structure holds shape through celebrations and ceremonies.</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="font-bold text-xs text-[#000000]">Heritage Stitching</div>
                <div className="text-[11px] text-slate-500 mt-1">Detailed embroidery by indigenous Yoruba master artisans.</div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 3. Shipping Tab */}
        <TabsContent value="shipping" className="mt-8 focus:outline-none">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FED501] uppercase tracking-wider">
              <Truck className="w-4 h-4" /> Dispatch & Delivery Information
            </div>
            <h3 className="text-xl font-bold text-[#000000] font-serif">
              Nationwide & Global Delivery
            </h3>
            
            <div className="space-y-4 max-w-3xl text-sm text-slate-700">
              <p>
                Each Fìlà Yorùbá cap is inspected and packed in our signature luxury presentation box to preserve its geometric fold.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="font-bold text-xs text-[#000000] mb-1">Lagos & South-West Nigeria</div>
                  <div className="text-xs text-slate-600">1 to 2 business days express dispatch.</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="font-bold text-xs text-[#000000] mb-1">Other Nigerian States (Abuja, Port Harcourt, Kano, etc.)</div>
                  <div className="text-xs text-slate-600">2 to 4 business days via verified logistics partners.</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-amber-900 text-xs flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Real-Time Artisan Tracking:</strong> You can track your cap from weaving, embroidery, quality control to dispatch using your Order Number on our <a href="/track-order" className="underline font-bold">Track Order</a> page.
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
