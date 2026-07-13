"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Sale } from "@/lib/types";
import { handleResponse } from "@/lib/utils/apiUtils";
import { DeliveryStatus, PaymentStatus } from "@/lib/constants/statuses";

/**
 * Encapsulates all data-fetching and mutation logic for the sales list.
 * Utilizes query caching and optimistic updates to keep UI interactions
 * instant, rolling back to the original cached snapshot on failures.
 */
export function useSales(year: number, month: number, search: string) {
  const queryClient = useQueryClient();
  const queryKey = ["sales", { year, month, search }];

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey,
    queryFn: ({ signal }) => {
      const params = new URLSearchParams();
      params.set("year", year.toString());
      params.set("month", (month + 1).toString());
      if (search) {
        params.set("search", search);
      }
      return fetch(`/api/sales?${params.toString()}`, { signal }).then((response) =>
        handleResponse<Sale[]>(response)
      );
    },
  });

  const createMutation = useMutation<
    Sale,
    Error,
    string,
    { previousSales: Sale[] | undefined; tempId: string }
  >({
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
    onMutate: async (dateStr) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSales = queryClient.getQueryData<Sale[]>(queryKey);

      const tempId = `temp-${Date.now()}`;
      const tempSale: Sale = {
        id: tempId,
        date: dateStr,
        clientName: "",
        phone: "",
        address: "",
        items: [],
        deliveryStatus: DeliveryStatus.NOT_DELIVERED,
        paymentStatus: PaymentStatus.NOT_PAID,
        comments: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Sale[]>(queryKey, (old) =>
        old ? [...old, tempSale] : [tempSale]
      );

      return { previousSales, tempId };
    },
    onSuccess: (newSale, variables, context) => {
      queryClient.setQueryData<Sale[]>(queryKey, (old) =>
        old?.map((sale) => (sale.id === context?.tempId ? newSale : sale))
      );
    },
    onError: (err, variables, context) => {
      if (context?.previousSales) {
        queryClient.setQueryData(queryKey, context.previousSales);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
    meta: {
      successMessage: "Venta creada con éxito",
      errorMessage: "Error al crear la venta",
    },
  });

  const updateMutation = useMutation<
    Sale,
    Error,
    { id: string; data: Record<string, unknown> },
    { previousSales: Sale[] | undefined }
  >({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetch(`/api/sales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((response) => handleResponse<Sale>(response)),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSales = queryClient.getQueryData<Sale[]>(queryKey);

      queryClient.setQueryData<Sale[]>(queryKey, (old) =>
        old?.map((sale) => (sale.id === id ? { ...sale, ...data } : sale))
      );

      return { previousSales };
    },
    onSuccess: (updatedSale) => {
      queryClient.setQueryData<Sale[]>(queryKey, (old) =>
        old?.map((sale) => (sale.id === updatedSale.id ? updatedSale : sale))
      );
    },
    onError: (err, variables, context) => {
      if (context?.previousSales) {
        queryClient.setQueryData(queryKey, context.previousSales);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
    meta: {
      successMessage: "Venta guardada con éxito",
      errorMessage: "Error al guardar la venta",
    },
  });

  const deleteMutation = useMutation<void, Error, string[], { previousSales: Sale[] | undefined }>({
    mutationFn: (ids: string[]) =>
      fetch("/api/sales", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      }).then((response) => handleResponse<void>(response)),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSales = queryClient.getQueryData<Sale[]>(queryKey);

      const idSet = new Set(ids);
      queryClient.setQueryData<Sale[]>(queryKey, (old) =>
        old?.filter((sale) => !idSet.has(sale.id))
      );

      return { previousSales };
    },
    onError: (err, variables, context) => {
      if (context?.previousSales) {
        queryClient.setQueryData(queryKey, context.previousSales);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
    meta: {
      successMessage: "Venta(s) eliminada(s) con éxito",
      errorMessage: "Error al eliminar la(s) venta(s)",
    },
  });

  const duplicateMutation = useMutation<
    Sale,
    Error,
    string,
    { previousSales: Sale[] | undefined; tempId: string }
  >({
    mutationFn: (id) =>
      fetch(`/api/sales/${id}/duplicate`, {
        method: "POST",
      }).then((response) => handleResponse<Sale>(response)),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSales = queryClient.getQueryData<Sale[]>(queryKey);

      const sourceSale = previousSales?.find((s) => s.id === id);
      const tempId = `temp-${Date.now()}`;
      const tempSale: Sale = sourceSale
        ? { ...sourceSale, id: tempId }
        : {
            id: tempId,
            date: new Date().toISOString().split("T")[0],
            clientName: "Duplicando...",
            phone: "",
            address: "",
            items: [],
            deliveryStatus: DeliveryStatus.NOT_DELIVERED,
            paymentStatus: PaymentStatus.NOT_PAID,
            comments: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

      queryClient.setQueryData<Sale[]>(queryKey, (old) =>
        old ? [...old, tempSale] : [tempSale]
      );

      return { previousSales, tempId };
    },
    onSuccess: (newSale, variables, context) => {
      queryClient.setQueryData<Sale[]>(queryKey, (old) =>
        old?.map((sale) => (sale.id === context?.tempId ? newSale : sale))
      );
    },
    onError: (err, variables, context) => {
      if (context?.previousSales) {
        queryClient.setQueryData(queryKey, context.previousSales);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
    meta: {
      successMessage: "Venta duplicada con éxito",
      errorMessage: "Error al duplicar la venta",
    },
  });

  return { sales, isLoading, createMutation, updateMutation, deleteMutation, duplicateMutation };
}
