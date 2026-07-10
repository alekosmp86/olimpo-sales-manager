"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { handleResponse } from "@/lib/utils/apiUtils";
import type { StorageDTO } from "@/modules/stock/types";

export function useStorages() {
  const queryClient = useQueryClient();

  const { data: storages = [], isLoading } = useQuery<StorageDTO[]>({
    queryKey: ["stock", "storages"],
    queryFn: ({ signal }) =>
      fetch("/api/stock/storages", { signal }).then((r) => handleResponse<StorageDTO[]>(r)),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      fetch("/api/stock/storages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => handleResponse<StorageDTO>(r)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stock", "storages"] }),
    meta: { successMessage: "Depósito creado", errorMessage: "Error al crear depósito" },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StorageDTO> }) =>
      fetch(`/api/stock/storages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => handleResponse<StorageDTO>(r)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stock", "storages"] }),
    meta: { successMessage: "Depósito actualizado", errorMessage: "Error al actualizar depósito" },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/stock/storages/${id}`, { method: "DELETE" }).then((r) =>
        handleResponse<{ ok: boolean }>(r)
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stock", "storages"] }),
    meta: { successMessage: "Depósito eliminado", errorMessage: "Error al eliminar depósito" },
  });

  return { storages, isLoading, createMutation, updateMutation, deleteMutation };
}
