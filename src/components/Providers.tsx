"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { useState } from "react";
import { ToastProvider } from "./ui/Toast";
import { triggerGlobalToast } from "@/lib/utils/toastTrigger";
import { ConfirmProvider } from "./ui/Confirm";
import { MessageType } from "@/lib/constants/messageType";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: 1,
      },
    },
    queryCache: new QueryCache({
      onError: (err: Error, query) => {
        const meta = query.meta as { errorMessage?: string; silent?: boolean } | undefined;
        if (meta?.silent) return;
        const message = meta?.errorMessage || err.message || "Error al cargar datos";
        triggerGlobalToast(message, MessageType.DANGER);
      },
    }),
    mutationCache: new MutationCache({
      onSuccess: (data, variables, context, mutation) => {
        const meta = mutation.meta as { successMessage?: string; silent?: boolean } | undefined;
        if (meta?.silent) return;
        if (meta?.successMessage) {
          triggerGlobalToast(meta.successMessage, MessageType.SUCCESS);
        }
      },
      onError: (err: Error, variables, context, mutation) => {
        const meta = mutation.meta as { errorMessage?: string; silent?: boolean } | undefined;
        if (meta?.silent) return;
        const message = meta?.errorMessage || err.message || "Ha ocurrido un error";
        triggerGlobalToast(message, MessageType.DANGER);
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
        <ConfirmProvider>
          {children}
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
