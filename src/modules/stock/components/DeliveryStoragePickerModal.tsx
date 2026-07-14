"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { UnresolvedDeliveryItem, DeliveryItemOverride } from "@/modules/stock/types";
import { UnresolvedItemCard } from "./UnresolvedItemCard";
import styles from "./DeliveryStoragePickerModal.module.css";
import { Sale } from "@/lib/types";

interface DeliveryStoragePickerModalProps {
  sale: Sale;
  unresolvedItems: UnresolvedDeliveryItem[];
  onClose: () => void;
  onConfirm: (overrides: DeliveryItemOverride[]) => void;
}

export function DeliveryStoragePickerModal({
  sale,
  unresolvedItems,
  onClose,
  onConfirm,
}: DeliveryStoragePickerModalProps) {
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    unresolvedItems.forEach((item) => {
      initial[item.saleItemId] = "";
    });
    return initial;
  });

  function handleSelect(saleItemId: string, storageId: string) {
    setSelections((prev) => ({ ...prev, [saleItemId]: storageId }));
  }

  const isAllSelected = unresolvedItems.every((item) => !!selections[item.saleItemId]);

  function handleSave() {
    if (!isAllSelected) return;

    const overrides = Object.entries(selections).map(([saleItemId, storageId]) => ({
      saleItemId,
      storageId,
    }));

    onConfirm(overrides);
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Resolver Origen de Stock"
      size="md"
      bodyClassName={styles.modalBody}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!isAllSelected}>
            Confirmar Entrega
          </Button>
        </>
      }
    >
      <div className={styles.container}>
        <p className={styles.description}>
          Para completar la entrega de la venta a <strong>{sale.clientName}</strong>, debes indicar de qué depósito se retirarán los siguientes productos:
        </p>

        <div className={styles.itemsList}>
          {unresolvedItems.map((item) => (
            <UnresolvedItemCard
              key={item.saleItemId}
              item={item}
              selectedStorageId={selections[item.saleItemId] || ""}
              onSelectStorage={(storageId) => handleSelect(item.saleItemId, storageId)}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
