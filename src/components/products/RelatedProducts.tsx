import ProductCard from "./ProductCard";
import { listProductsByCollection } from "@/server/services/product.service";
import { Sparkles } from "lucide-react";

interface RelatedProductsProps {
  collectionSlug: string;
  currentProductId: string;
}

export default async function RelatedProducts({
  collectionSlug,
  currentProductId,
}: RelatedProductsProps) {
  const collectionProducts = await listProductsByCollection(collectionSlug);
  const related = collectionProducts
    .filter(
      (product) =>
        product.collection.slug === collectionSlug &&
        product.id !== currentProductId
    )
    .slice(0, 4);

  if (!related.length) {
    return null;
  }

  return (
    <section className="mt-24 pt-16 border-t border-slate-200">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#FED501] mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Curated Complements
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#000000] tracking-tight">
          Complete Your Ceremonial Attire
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Explore handcrafted caps from the same authentic Yoruba weaving collection.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
