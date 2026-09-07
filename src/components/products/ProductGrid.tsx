"use client";

import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import { useProducts } from "@/hooks/use-products";
import { useProductFilterStore } from "@/store/product-filter-store";

export default function ProductGrid() {
  const { data, isLoading, isError } = useProducts();

  const search = useProductFilterStore(
    (state) => state.search
  );

  const collection = useProductFilterStore(
    (state) => state.collection
  );

  const sort = useProductFilterStore(
    (state) => state.sort
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-6 lg:gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20 text-center">
        <p className="text-destructive">
          We couldn&apos;t load products. Please try again.
        </p>
      </div>
    );
  }

  const filteredProducts = [...(data ?? [])]
    .filter((product) => {
      const matchesSearch =
        !search ||
        product.name
          .toLowerCase()
          .includes(search.toLowerCase());

      const targetSlug = (collection || "").trim().toLowerCase();
      const productColSlug = (product.collection?.slug || "").trim().toLowerCase();
      const productColName = (product.collection?.name || "").trim().toLowerCase();

      const matchesCollection =
        !targetSlug ||
        productColSlug === targetSlug ||
        productColName === targetSlug;

      return (
        matchesSearch &&
        matchesCollection
      );
    })
    .sort((a, b) => {
      switch (sort) {
        case "price-low":
          return a.price - b.price;

        case "price-high":
          return b.price - a.price;

        case "name":
          return a.name.localeCompare(b.name);

        default:
          return 0;
      }
    });

  return (
    <div>
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-6 lg:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <h2 className="text-2xl font-semibold">
            No products found
          </h2>

          <p className="mt-2 text-muted-foreground">
            Try a different search or collection.
          </p>
        </div>
      )}
    </div>
  );
}
