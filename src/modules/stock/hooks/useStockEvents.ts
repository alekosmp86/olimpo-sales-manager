"use client";

import { useQuery } from "@tanstack/react-query";
import { handleResponse } from "@/lib/utils/apiUtils";
import type { StockEventDTO } from "@/modules/stock/types";

interface StockEventsResponse {
  events: StockEventDTO[];
  nextCursor: string | null;
}

export function useStockEvents(params?: { storageId?: string; productId?: string; limit?: number }) {
  const { storageId, productId, limit = 50 } = params ?? {};

  const search = new URLSearchParams();
  if (storageId) search.set("storageId", storageId);
  if (productId) search.set("productId", productId);
  search.set("limit", String(limit));

  return useQuery<StockEventsResponse>({
    queryKey: ["stock", "events", { storageId, productId, limit }],
    queryFn: ({ signal }) =>
      fetch(`/api/stock/events?${search.toString()}`, { signal }).then((response) =>
        handleResponse<StockEventsResponse>(response)
      ),
  });
}
