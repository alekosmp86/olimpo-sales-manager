"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { useState } from "react";
import { ToastProvider, triggerGlobalToast, ToastType } from "./ui/Toast";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: 1,
      },
    },
    queryCache: new QueryCache({
      onError: (err: any, query) => {
        const meta = query.meta as { errorMessage?: string; silent?: boolean } | undefined;
        if (meta?.silent) return;
        const message = meta?.errorMessage || err.message || "Error al cargar datos";
        triggerGlobalToast(message, ToastType.ERROR);
      },
    }),
    mutationCache: new MutationCache({
      onSuccess: (data, variables, context, mutation) => {
        const meta = mutation.meta as { successMessage?: string; silent?: boolean } | undefined;
        if (meta?.silent) return;
        if (meta?.successMessage) {
          triggerGlobalToast(meta.successMessage, ToastType.SUCCESS);
        }
      },
      onError: (err: any, variables, context, mutation) => {
        const meta = mutation.meta as { errorMessage?: string; silent?: boolean } | undefined;
        if (meta?.silent) return;
        const message = meta?.errorMessage || err.message || "Ha ocurrido un error";
        triggerGlobalToast(message, ToastType.ERROR);
      },
    }),
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}
