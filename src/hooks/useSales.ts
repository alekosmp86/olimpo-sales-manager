"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Sale } from "@/lib/types";

/**
 * Encapsulates all data-fetching and mutation logic for the sales list.
 * Each mutation only handles server concerns (invalidation) — per-call
 * callbacks (e.g. newRowId, clearing selection) are passed at call-site.
 */
export function useSales(search: string) {
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ["sales", search],
    queryFn: () =>
      fetch(
        `/api/sales${search ? `?search=${encodeURIComponent(search)}` : ""}`
      ).then((r) => r.json()),
  });

  const createMutation = useMutation<Sale, Error, string>({
    mutationFn: (dateStr) =>
      fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          clientName: "",
          address: "",
          comments: "",
        }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetch(`/api/sales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map((id) => fetch(`/api/sales/${id}`, { method: "DELETE" }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
  });

  return { sales, isLoading, createMutation, updateMutation, deleteMutation };
}
