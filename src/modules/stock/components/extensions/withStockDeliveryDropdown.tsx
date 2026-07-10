"use client";

import React, { useState } from "react";
import { DeliveryDropdown } from "@/components/sales/StatusDropdown";
import { DeliveryStoragePickerModal } from "../DeliveryStoragePickerModal";
import type { UnresolvedDeliveryItem } from "@/modules/stock/types";

export function withStockDeliveryDropdown(DropdownComponent: typeof DeliveryDropdown) {
  return function StockDeliveryDropdown(
    props: React.ComponentProps<typeof DeliveryDropdown> & { sale: any }
  ) {
    const { sale, ...restProps } = props;
    const [unresolvedItems, setUnresolvedItems] = useState<UnresolvedDeliveryItem[] | null>(null);
    const [resolvePromise, setResolvePromise] = useState<{
      resolve: (value: boolean) => void;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleBeforeChange(newValue: any): Promise<boolean> {
      if (newValue !== "DELIVERED") return true;

      setIsLoading(true);
      try {
        const res = await fetch("/api/stock/deliver", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ saleId: sale.id }),
        });

        setIsLoading(false);

        if (res.ok) {
          return true;
        }

        if (res.status === 409) {
          const errData = await res.json();
          if (errData.unresolvedItems) {
            setUnresolvedItems(errData.unresolvedItems);
            return new Promise<boolean>((resolve) => {
              setResolvePromise({ resolve });
            });
          }
        }

        const errData = await res.json();
        alert(errData.error || "Error al procesar la entrega.");
        return false;
      } catch (err) {
        setIsLoading(false);
        console.error(err);
        alert("Error de red al procesar la entrega.");
        return false;
      }
    }

    return (
      <>
        <DropdownComponent {...restProps} onBeforeChange={handleBeforeChange} disabled={props.disabled || isLoading} />
        {unresolvedItems && resolvePromise && (
          <DeliveryStoragePickerModal
            sale={sale}
            unresolvedItems={unresolvedItems}
            onClose={() => {
              setUnresolvedItems(null);
              resolvePromise.resolve(false);
              setResolvePromise(null);
            }}
            onConfirm={(overrides) => {
              setIsLoading(true);
              fetch("/api/stock/deliver", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ saleId: sale.id, overrides }),
              })
                .then(async (r) => {
                  setIsLoading(false);
                  if (r.ok) {
                    setUnresolvedItems(null);
                    resolvePromise.resolve(true);
                    setResolvePromise(null);
                  } else {
                    const err = await r.json();
                    alert(err.error || "Error al confirmar entrega.");
                  }
                })
                .catch((e) => {
                  setIsLoading(false);
                  console.error(e);
                  alert("Error de red al confirmar entrega.");
                });
            }}
          />
        )}
      </>
    );
  };
}
