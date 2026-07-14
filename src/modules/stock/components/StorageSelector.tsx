"use client";

import { useStoragesForProduct } from "@/modules/stock/hooks/useStockLines";
import { Select } from "@/components/ui/Select";
import { StorageOption } from "./StorageOption";

interface StorageSelectorProps {
  productId: string;
  selectedStorageId: string;
  onSelectStorage: (storageId: string) => void;
  saleItemId: string;
}

export function StorageSelector({
  productId,
  selectedStorageId,
  onSelectStorage,
  saleItemId,
}: StorageSelectorProps) {
  const { data: availabilities = [], isLoading } = useStoragesForProduct(productId);

  const selectOptions = availabilities.map((availability) => ({
    value: availability.storageId,
    label: (
      <StorageOption
        storageName={availability.storageName}
        available={availability.available}
        quantity={availability.quantity}
      />
    ),
  }));

  const hasNoStock = availabilities.length === 0;

  if (isLoading) {
    return (
      <Select
        id={`select-storage-${saleItemId}`}
        value=""
        onChange={() => {}}
        options={[]}
        placeholder="Cargando depósitos..."
        disabled
      />
    );
  }

  if (hasNoStock) {
    return (
      <Select
        id={`select-storage-${saleItemId}`}
        value=""
        onChange={() => {}}
        options={[]}
        placeholder="Sin stock disponible en ningún depósito"
        disabled
      />
    );
  }

  return (
    <Select
      id={`select-storage-${saleItemId}`}
      value={selectedStorageId}
      onChange={onSelectStorage}
      options={selectOptions}
      placeholder="-- Elegir depósito --"
    />
  );
}
