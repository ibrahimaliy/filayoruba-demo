import { useQuery } from "@tanstack/react-query";

import { getCollections } from "@/lib/api/collections";

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: getCollections,
    staleTime: 0,
    refetchOnMount: "always",
  });
}