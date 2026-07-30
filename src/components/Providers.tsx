"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToastProvider } from "./ui/Toast";
import { triggerGlobalToast } from "@/lib/utils/toastTrigger";
import { ConfirmProvider } from "./ui/Confirm";
import { MessageType } from "@/lib/constants/messageType";
import { UnauthorizedError } from "@/lib/utils/apiUtils";

function makeQueryClient(onUnauthorized: () => void) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        // Don't retry on 401 — the session is gone, retrying won't help.
        retry: (failureCount, err) => !(err instanceof UnauthorizedError) && failureCount < 1,
      },
    },
    queryCache: new QueryCache({
      onError: (err: Error, query) => {
        if (err instanceof UnauthorizedError) {
          onUnauthorized();
          return;
        }
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
        if (err instanceof UnauthorizedError) {
          onUnauthorized();
          return;
        }
        const meta = mutation.meta as { errorMessage?: string; silent?: boolean } | undefined;
        if (meta?.silent) return;
        const message = meta?.errorMessage || err.message || "Ha ocurrido un error";
        triggerGlobalToast(message, MessageType.DANGER);
      },
    }),
  });
}
export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleUnauthorized = () => {
    // Clear the session cookie server-side, then redirect to login.
    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      router.push("/login");
    });
  };

  const [queryClient] = useState(() => makeQueryClient(handleUnauthorized));

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
