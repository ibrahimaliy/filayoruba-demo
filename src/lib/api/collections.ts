import { Collection } from "@/types/collection";

import { apiFetch } from "./client";

export async function getCollections(): Promise<Collection[]> {
  return apiFetch<Collection[]>("/api/collections");
}
