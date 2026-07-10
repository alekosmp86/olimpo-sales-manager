"use client";

import { useStoragesForProduct } from "@/modules/stock/hooks/useStockLines";
import styles from "./StoragePickerSlot.module.css";

interface StoragePickerSlotProps {
  productId: string;
  value?: string;
  onChange: (storageId: string) => void;
}

export function StoragePickerSlot({ productId, value, onChange }: StoragePickerSlotProps) {
  const { data: availabilities = [], isLoading } = useStoragesForProduct(productId);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <label htmlFor={`picker-loading-${productId}`} className={styles.label}>
          Depósito
        </label>
        <select
          id={`picker-loading-${productId}`}
          disabled
          className={styles.selectLoading}
        >
          <option>Cargando...</option>
        </select>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <label htmlFor={`picker-${productId}`} className={styles.label}>
        Depósito
      </label>
      {availabilities.length === 0 ? (
        <select
          id={`picker-${productId}`}
          disabled
          className={styles.selectNoStock}
        >
          <option value="">Sin stock físico</option>
        </select>
      ) : (
        <select
          id={`picker-${productId}`}
          value={value || (availabilities[0]?.storageId ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className={styles.select}
        >
          {/* Ensure the currently reserved storage is in the list even if it has 0 stock now */}
          {value && !availabilities.some((a) => a.storageId === value) && (
            <option value={value}>Depósito actual (sin stock nuevo)</option>
          )}
          {availabilities.map((a) => (
            <option key={a.storageId} value={a.storageId}>
              {a.storageName} (Disp: {a.available} un.)
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
