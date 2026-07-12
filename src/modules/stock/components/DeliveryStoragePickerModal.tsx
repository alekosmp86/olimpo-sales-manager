"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { useStorages } from "@/modules/stock/hooks/useStorages";
import type { UnresolvedDeliveryItem, DeliveryItemOverride } from "@/modules/stock/types";
import { UnresolvedReason } from "@/modules/stock/constants";
import styles from "./DeliveryStoragePickerModal.module.css";

interface DeliveryStoragePickerModalProps {
  sale: any;
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
  const { storages } = useStorages();
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    unresolvedItems.forEach((item) => {
      initial[item.saleItemId] = "";
    });
    return initial;
  });

  const activeStorages = storages.filter((storage) => storage.isActive);

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
            <div
              key={item.saleItemId}
              className={styles.itemCard}
            >
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
                <select
                  id={`select-storage-${item.saleItemId}`}
                  value={selections[item.saleItemId] || ""}
                  onChange={(event) => handleSelect(item.saleItemId, event.target.value)}
                  className={styles.select}
                >
                  <option value="">-- Elegir depósito --</option>
                  {activeStorages.map((storage) => (
                    <option key={storage.id} value={storage.id}>
                      {storage.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
