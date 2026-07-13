"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeliveryDropdown } from "@/components/sales/StatusDropdown";
import { DeliveryStoragePickerModal } from "../DeliveryStoragePickerModal";
import type { UnresolvedDeliveryItem, DeliveryItemOverride } from "@/modules/stock/types";
import { DeliveryStatus } from "@/lib/constants/statuses";
import { handleResponse } from "@/lib/utils/apiUtils";
import { Sale } from "@/lib/types";
import { StockErrorType } from "../../constants";
import { useConfirm } from "@/components/ui/Confirm";

interface DeliverPayload {
  saleId: string;
  overrides?: DeliveryItemOverride[];
}

interface DeliverResult {
  ok: boolean;
}

interface UnresolvedItemsError {
  type: typeof StockErrorType.UNRESOLVED_ITEMS;
  unresolvedItems: UnresolvedDeliveryItem[];
}

function isUnresolvedItemsError(err: unknown): err is UnresolvedItemsError {
  return (
    err !== null &&
    typeof err === "object" &&
    "type" in err &&
    err.type === StockErrorType.UNRESOLVED_ITEMS
  );
}

export function withStockDeliveryDropdown(DropdownComponent: typeof DeliveryDropdown) {
  return function StockDeliveryDropdown(
    props: React.ComponentProps<typeof DeliveryDropdown> & { sale: Sale }
  ) {
    const { sale, ...restProps } = props;
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const [unresolvedItems, setUnresolvedItems] = useState<UnresolvedDeliveryItem[] | null>(null);
    const [resolvePromise, setResolvePromise] = useState<{
      resolve: (value: boolean) => void;
    } | null>(null);

    const deliverMutation = useMutation({
      mutationFn: (data: DeliverPayload) =>
        fetch("/api/stock/deliver", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }).then(async (response) => {
          if (response.status === 409) {
            const errData = await response.json();
            if (errData.unresolvedItems) {
              throw { type: StockErrorType.UNRESOLVED_ITEMS, unresolvedItems: errData.unresolvedItems };
            }
            throw new Error(errData.error || "Conflict occurred");
          }
          return handleResponse<DeliverResult>(response);
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["stock"] });
        queryClient.invalidateQueries({ queryKey: ["sales"] });
      },
    });

    async function handleBeforeChange(newValue: DeliveryStatus): Promise<boolean> {
      if (newValue !== DeliveryStatus.DELIVERED) return true;

      try {
        await deliverMutation.mutateAsync({ saleId: sale.id });
        return true;
      } catch (err: unknown) {
        if (isUnresolvedItemsError(err)) {
          setUnresolvedItems(err.unresolvedItems);
          return new Promise<boolean>((resolve) => {
            setResolvePromise({ resolve });
          });
        }
        const message = err instanceof Error ? err.message : "Error al procesar la entrega.";
        confirm({
          title: "Error",
          message,
          onlyConfirm: true,
          type: "danger",
        });
        return false;
      }
    }

    async function handleConfirmOverrides(overrides: DeliveryItemOverride[]) {
      try {
        await deliverMutation.mutateAsync({ saleId: sale.id, overrides });
        setUnresolvedItems(null);
        resolvePromise?.resolve(true);
        setResolvePromise(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error al confirmar entrega.";
        confirm({
          title: "Error",
          message,
          onlyConfirm: true,
          type: "danger",
        });
      }
    }

    return (
      <>
        <DropdownComponent
          {...restProps}
          onBeforeChange={handleBeforeChange}
          disabled={props.disabled || deliverMutation.isPending}
        />
        {unresolvedItems && resolvePromise && (
          <DeliveryStoragePickerModal
            sale={sale}
            unresolvedItems={unresolvedItems}
            onClose={() => {
              setUnresolvedItems(null);
              resolvePromise.resolve(false);
              setResolvePromise(null);
            }}
            onConfirm={handleConfirmOverrides}
          />
        )}
      </>
    );
  };
}

