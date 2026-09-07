import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import { getFeaturedProducts } from "@/server/services/product.service";
import { Sparkles, ArrowRight } from "lucide-react";

export default async function FeaturedProducts() {
  const featuredProducts = await getFeaturedProducts().catch(() => []);

  if (!featuredProducts || featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-20 lg:py-28 bg-[#FAF9F6]">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#FED501] mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Iconic Headwear
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#000000] tracking-tight">
              Featured Masterpieces
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-lg">
              Individually crafted by master Yoruba weavers using authentic Aso-Oke yarns and royal velvet.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#000000] hover:text-[#FED501] transition-colors group self-start md:self-auto"
          >
            <span>Explore All Caps</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {featuredProducts.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
