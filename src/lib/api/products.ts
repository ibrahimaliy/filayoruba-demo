import { Product } from "@/types/product";

import { apiFetch } from "./client";

export async function getProducts(): Promise<Product[]> {
  return apiFetch<Product[]>("/api/products");
}

export async function getProduct(slug: string): Promise<Product> {
  return apiFetch<Product>(`/api/products/${encodeURIComponent(slug)}`);
}
