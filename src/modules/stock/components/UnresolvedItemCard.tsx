"use client";

import { AlertTriangle, AlertCircle } from "lucide-react";
import type { UnresolvedDeliveryItem } from "@/modules/stock/types";
import { UnresolvedReason } from "@/modules/stock/constants";
import { StorageSelector } from "./StorageSelector";
import styles from "./UnresolvedItemCard.module.css";

interface UnresolvedItemCardProps {
  item: UnresolvedDeliveryItem;
  selectedStorageId: string;
  onSelectStorage: (storageId: string) => void;
}

export function UnresolvedItemCard({
  item,
  selectedStorageId,
  onSelectStorage,
}: UnresolvedItemCardProps) {
  return (
    <div className={styles.itemCard}>
      <div className={styles.itemHeader}>
        <span className={styles.productName}>
          {item.productName}
        </span>
        <span className={styles.productQty}>
          Cant: {item.quantity} u.
        </span>
      </div>

      <div className={styles.reasonText}>
        {item.reason === UnresolvedReason.NO_RESERVATION ? (
          <span className={styles.amberText}>
            <AlertTriangle size={14} /> Sin depósito reservado (Venta importada)
          </span>
        ) : (
          <span className={styles.redText}>
            <AlertCircle size={14} /> El depósito reservado no tiene suficiente stock físico
          </span>
        )}
      </div>

      <div className={styles.storageSelectWrapper}>
        <label htmlFor={`select-storage-${item.saleItemId}`} className={styles.selectLabel}>
          Seleccionar depósito de origen:
        </label>
        <StorageSelector
          productId={item.productId}
          selectedStorageId={selectedStorageId}
          onSelectStorage={onSelectStorage}
          saleItemId={item.saleItemId}
        />
      </div>
    </div>
  );
}
