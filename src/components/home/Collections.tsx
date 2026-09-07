import { listCollections } from "@/server/services/collection.service";
import { listProducts } from "@/server/services/product.service";
import CollectionsClient from "./CollectionsClient";

export default async function Collections() {
  const [collections, products] = await Promise.all([
    listCollections().catch(() => []),
    listProducts().catch(() => []),
  ]);

  if (!collections || collections.length === 0) {
    return null;
  }

  const productCounts: Record<string, number> = {};
  const fallbackImages: Record<string, string> = {};

  for (const col of collections) {
    const matched = products.filter((p) => p.collection?.slug === col.slug);
    productCounts[col.slug] = matched.length;
    if (matched[0]?.images?.[0]) {
      fallbackImages[col.slug] = matched[0].images[0];
    }
  }

  return (
    <CollectionsClient
      collections={collections}
      productCounts={productCounts}
      fallbackImages={fallbackImages}
    />
  );
}
