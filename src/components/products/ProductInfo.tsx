"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import { useCartStore } from "@/store/cart-store";
import { useCartDrawerStore } from "@/store/cart-drawer-store";
import SizeSelector from "./SizeSelector";
import { formatSizeLabel } from "@/lib/sizing";
import { toast } from "sonner";
import {
  ShoppingBag,
  Sparkles,
  Truck,
  ShieldCheck,
  ChevronDown,
  Lock,
  ArrowRight,
} from "lucide-react";
import ShareProductButton from "@/components/share/ShareProductButton";

interface ProductInfoProps {
  product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || "M");
  const [openAccordion, setOpenAccordion] = useState<string | null>("details");

  const addToCart = useCartStore((state) => state.addToCart);
  const items = useCartStore((state) => state.items);
  const openDrawer = useCartDrawerStore((state) => state.open);

  const cartItem = items.find(
    (item) => item.product.id === product.id && item.selectedSize === selectedSize
  );
  const itemQuantity = cartItem?.quantity ?? 0;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const reviewCount = product.reviews?.length || 0;
  const ratingScore = product.rating || 5.0;

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a cap size before adding to cart.");
      return;
    }

    addToCart(product, selectedSize);
    toast.success(`${product.name} (${formatSizeLabel(selectedSize)}) added to your cart.`);
    openDrawer();
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* 1. Category & Subtitle */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#FED501] mb-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{product.collection?.name || "Yoruba Heritage Collection"}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#000000] tracking-tight leading-tight">
          {product.name}
        </h1>

        {/* Rating and Reviews anchor */}
        <div className="flex items-center gap-3 mt-2.5">
          <div className="flex items-center gap-1 text-[#FED501]">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className="text-sm">
                {i < Math.round(ratingScore) ? "★" : "☆"}
              </span>
            ))}
          </div>
          <span className="text-xs font-bold text-[#000000]">{ratingScore.toFixed(1)}</span>
          <span className="text-xs text-slate-300">&bull;</span>
          <a
            href="#reviews"
            className="text-xs font-medium text-slate-500 hover:text-[#000000] underline transition-colors"
          >
            {reviewCount} {reviewCount === 1 ? "customer review" : "customer reviews"}
          </a>
        </div>
      </div>

      {/* 2. Price & Inventory State */}
      <div className="flex items-baseline justify-between border-y border-slate-100 py-4">
        <div>
          <span className="text-3xl font-extrabold text-[#000000] tracking-tight">
            ₦{product.price.toLocaleString("en-NG")}
          </span>
          <span className="text-xs text-slate-400 block mt-0.5">
            Taxes included &bull; Fast nationwide dispatch
          </span>
        </div>

        {/* Stock Badge */}
        <div>
          {isOutOfStock ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Only {product.stock} left in stock
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              In Stock &bull; Ready to Ship
            </span>
          )}
        </div>
      </div>

      {/* 3. Short Description */}
      {product.description && (
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {product.description}
        </p>
      )}

      {/* 4. Size Selector */}
      {product.sizes?.length > 0 && (
        <SizeSelector
          sizes={product.sizes}
          selected={selectedSize}
          onChange={setSelectedSize}
        />
      )}

      {/* 5. Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="flex-1 py-4 px-6 rounded-2xl bg-[#000000] hover:bg-[#1A1A1A] text-white font-bold text-sm transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
        >
          <ShoppingBag className="w-4 h-4 text-[#FED501]" />
          <span>
            {isOutOfStock
              ? "Currently Unavailable"
              : `Add to Shopping Bag ${itemQuantity > 0 ? `(${itemQuantity})` : ""}`}
          </span>
        </button>

        <ShareProductButton
          product={product}
          selectedSize={selectedSize}
          variant="button"
          buttonText="Share"
          className="py-4 px-5 rounded-2xl text-sm justify-center"
        />
      </div>

      {/* 6. Luxury Trust Assurances */}
      <div className="grid grid-cols-2 gap-3 py-4 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FED501] shrink-0" />
          <span>100% Authentic Aso-Oke</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#000000] shrink-0" />
          <span>Nationwide Dispatch</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Master Artisan Quality</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Secure Paystack Checkout</span>
        </div>
      </div>

      {/* 7. Classy Collapsible Details */}
      <div className="border-t border-slate-200 divide-y divide-slate-100">
        {/* Item 1: Artisan Fabric & Details */}
        <div>
          <button
            type="button"
            onClick={() => toggleAccordion("details")}
            className="w-full py-4 flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-[#000000] hover:text-[#FED501] transition-colors cursor-pointer"
          >
            <span>Artisan Craftsmanship & Fabric</span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                openAccordion === "details" ? "rotate-180 text-[#000000]" : ""
              }`}
            />
          </button>
          {openAccordion === "details" && (
            <div className="pb-4 text-xs text-slate-600 space-y-2 leading-relaxed animate-in fade-in duration-200">
              <p>
                Each Fila is individually woven on traditional Nigerian looms using premium Aso-Oke yarns. Hand-finished with structured geometric folds that hold their form through weddings, celebrations, and formal ceremonies.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
                <li>Material: 100% Cotton & Metallic Handwoven Aso-Oke</li>
                <li>Fit: Standard Gobi / Abeti-Aja fold structure</li>
                <li>Origin: Crafted in Oyo State, Nigeria</li>
              </ul>
            </div>
          )}
        </div>

        {/* Item 2: Delivery & Shipping Timeline */}
        <div>
          <button
            type="button"
            onClick={() => toggleAccordion("shipping")}
            className="w-full py-4 flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-[#000000] hover:text-[#FED501] transition-colors cursor-pointer"
          >
            <span>Delivery & Packaging</span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                openAccordion === "shipping" ? "rotate-180 text-[#000000]" : ""
              }`}
            />
          </button>
          {openAccordion === "shipping" && (
            <div className="pb-4 text-xs text-slate-600 space-y-2 leading-relaxed animate-in fade-in duration-200">
              <p>
                Packed in our signature Fìlà Yorùbá luxury box to ensure pristine shape upon arrival.
              </p>
              <p>
                <strong>Lagos & South-West:</strong> 1–2 business days.<br />
                <strong>Other Nigerian States:</strong> 2–4 business days.<br />
                <strong>Live Order Tracking:</strong> Track every stage from weaving to dispatch on our Track Order page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}