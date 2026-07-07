"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Sale } from "@/lib/types";
import { handleResponse } from "@/lib/utils/apiUtils";

/**
 * Encapsulates all data-fetching and mutation logic for the sales list.
 * Each mutation only handles server concerns (invalidation) — per-call
 * callbacks (e.g. newRowId, clearing selection) are passed at call-site.
 */
export function useSales(search: string) {
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ["sales", search],
    queryFn: ({ signal }) =>
      fetch(
        `/api/sales${search ? `?search=${encodeURIComponent(search)}` : ""}`,
        { signal }
      ).then((response) => handleResponse<Sale[]>(response)),
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
      }).then((response) => handleResponse<Sale>(response)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
    meta: {
      successMessage: "Venta creada con éxito",
      errorMessage: "Error al crear la venta",
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetch(`/api/sales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((response) => handleResponse<Sale>(response)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
    meta: {
      successMessage: "Venta guardada con éxito",
      errorMessage: "Error al guardar la venta",
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      fetch("/api/sales", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      }).then((response) => handleResponse<void>(response)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
    meta: {
      successMessage: "Venta(s) eliminada(s) con éxito",
      errorMessage: "Error al eliminar la(s) venta(s)",
    },
  });

  const duplicateMutation = useMutation<Sale, Error, string>({
    mutationFn: (id) =>
      fetch(`/api/sales/${id}/duplicate`, {
        method: "POST",
      }).then((response) => handleResponse<Sale>(response)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
    meta: {
      successMessage: "Venta duplicada con éxito",
      errorMessage: "Error al duplicar la venta",
    },
  });

  return { sales, isLoading, createMutation, updateMutation, deleteMutation, duplicateMutation };
}
