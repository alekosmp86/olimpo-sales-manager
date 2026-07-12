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

interface DeliverPayload {
  saleId: string;
  overrides?: DeliveryItemOverride[];
}

interface DeliverResult {
  ok: boolean;
}

export function withStockDeliveryDropdown(DropdownComponent: typeof DeliveryDropdown) {
  return function StockDeliveryDropdown(
    props: React.ComponentProps<typeof DeliveryDropdown> & { sale: Sale }
  ) {
    const { sale, ...restProps } = props;
    const queryClient = useQueryClient();
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
      },
    });

    async function handleBeforeChange(newValue: any): Promise<boolean> {
      if (newValue !== DeliveryStatus.DELIVERED) return true;

      try {
        await deliverMutation.mutateAsync({ saleId: sale.id });
        return true;
      } catch (err: any) {
        if (err.type === StockErrorType.UNRESOLVED_ITEMS) {
          setUnresolvedItems(err.unresolvedItems);
          return new Promise<boolean>((resolve) => {
            setResolvePromise({ resolve });
          });
        }
        alert(err.message || "Error al procesar la entrega.");
        return false;
      }
    }

    async function handleConfirmOverrides(overrides: DeliveryItemOverride[]) {
      try {
        await deliverMutation.mutateAsync({ saleId: sale.id, overrides });
        setUnresolvedItems(null);
        resolvePromise?.resolve(true);
        setResolvePromise(null);
      } catch (err: any) {
        alert(err.message || "Error al confirmar entrega.");
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

