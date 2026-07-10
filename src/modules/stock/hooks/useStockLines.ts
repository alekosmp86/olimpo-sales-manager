"use client";

import { useQuery } from "@tanstack/react-query";
import { handleResponse } from "@/lib/utils/apiUtils";
import type { StockLineDTO, StorageAvailability } from "@/modules/stock/types";

/** Returns all stock lines for a given storage (for the stock dashboard). */
export function useStockLines(storageId: string | null) {
  return useQuery<StockLineDTO[]>({
    queryKey: ["stock", "lines", storageId],
    queryFn: ({ signal }) =>
      fetch(`/api/stock/stock-lines?storageId=${storageId}`, { signal }).then((r) =>
        handleResponse<StockLineDTO[]>(r)
      ),
    enabled: !!storageId,
  });
}

/** Returns storages that have physical stock for a given product (for the picker). */
export function useStoragesForProduct(productId: string | null) {
  return useQuery<StorageAvailability[]>({
    queryKey: ["stock", "lines", "product", productId],
    queryFn: ({ signal }) =>
      fetch(`/api/stock/stock-lines?productId=${productId}`, { signal }).then((r) =>
        handleResponse<StorageAvailability[]>(r)
      ),
    enabled: !!productId,
    staleTime: 5000, // short stale time — stock changes frequently
  });
}
