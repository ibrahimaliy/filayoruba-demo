"use client";

import Link from "next/link";
import { Product } from "@/types/product";
import { Star, ArrowRight, Sparkles } from "lucide-react";
import WishlistButton from "@/components/wishlist/WishlistButton";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images?.[0] || "";
  const ratingScore = product.rating || 5.0;
  const reviewCount = product.reviews?.length || 0;

  return (
    <div className="group relative flex flex-col rounded-3xl border border-[#E8E1D5] bg-white overflow-hidden shadow-sm hover:shadow-xl hover:border-[#FED501]/70 transition-all duration-300 hover:-translate-y-1">
      {/* Visual Image Stage */}
      <div className="relative aspect-[4/4.5] w-full overflow-hidden bg-[#F8FAFC]">
        {/* Wishlist Button */}
        <div className="absolute right-3.5 top-3.5 z-20">
          <WishlistButton productId={product.id} />
        </div>

        {/* Collection Badge */}
        <div className="absolute left-3.5 top-3.5 z-20">
          <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold text-[#000000] shadow-sm border border-slate-200/60 uppercase tracking-wider">
            {product.collection?.name || "Yoruba Fila"}
          </span>
        </div>

        {/* Main Product Image */}
        <Link href={`/products/${product.slug}`} className="block w-full h-full cursor-pointer">
          <ImageWithFallback
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
            fallbackTitle={product.name}
            fallbackSubtitle={product.collection?.name || "Yoruba Fila"}
            fallbackBadge="Ceremonial Cap"
            fallbackVariant="md"
          />
        </Link>
      </div>

      {/* Product Content Details */}
      <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
        <div className="space-y-2">
          {/* Rating Summary */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center text-[#FED501]">
              <Star className="w-3.5 h-3.5 fill-[#FED501]" />
            </div>
            <span className="font-bold text-[#000000] text-[11px]">
              {ratingScore.toFixed(1)}
            </span>
            <span className="text-slate-400 text-[10px]">
              ({reviewCount > 0 ? reviewCount : "New"})
            </span>
          </div>

          {/* Title */}
          <Link href={`/products/${product.slug}`} className="block group-hover:text-[#FED501] transition-colors">
            <h3 className="font-serif font-bold text-sm sm:text-base text-[#000000] leading-snug line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Color / Fabric Subtitle */}
          {product.colors?.length > 0 && (
            <p className="text-[11px] text-slate-500 line-clamp-1">
              {product.colors[0]}
            </p>
          )}
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-base sm:text-lg font-extrabold text-[#000000] tracking-tight">
              ₦{product.price.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block -mt-0.5">
              Sizes XS – 3XL (22″–25″)
            </span>
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="px-3.5 py-2 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm group-hover:bg-[#FED501] group-hover:text-[#000000]"
          >
            <span>View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
