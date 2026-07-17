"use client";

import React from "react";
import { ProductsModal } from "@/components/sales/products-modal/ProductsModal";
import { StoragePickerSlot } from "./StoragePickerSlot";

export function withStockProductsModal(ModalComponent: typeof ProductsModal) {
  return function StockProductsModal(
    props: React.ComponentProps<typeof ProductsModal>,
  ) {
    return (
      <ModalComponent
        {...props}
        renderItemExtras={(item, onChange) => (
          <StoragePickerSlot
            productId={item.productId}
            value={item.storageId}
            onChange={onChange}
          />
        )}
      />
    );
  };
}
