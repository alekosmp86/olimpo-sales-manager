"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useStorages } from "@/modules/stock/hooks/useStorages";
import type { UnresolvedDeliveryItem, DeliveryItemOverride } from "@/modules/stock/types";

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

  const activeStorages = storages.filter((s) => s.isActive);

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
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          Para completar la entrega de la venta a <strong>{sale.clientName}</strong>, debes indicar de qué depósito se retirarán los siguientes productos:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {unresolvedItems.map((item) => (
            <div
              key={item.saleItemId}
              style={{
                padding: "var(--space-3)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-surface-2)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>
                  {item.productName}
                </span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-bold)", color: "var(--color-primary)" }}>
                  Cant: {item.quantity} u.
                </span>
              </div>

              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                {item.reason === "no_reservation" ? (
                  <span style={{ color: "var(--color-amber-text)" }}>
                    ⚠️ Sin depósito reservado (Venta importada)
                  </span>
                ) : (
                  <span style={{ color: "var(--color-red-text)" }}>
                    ❌ El depósito reservado no tiene suficiente stock físico
                  </span>
                )}
              </div>

              <div style={{ marginTop: "4px" }}>
                <label htmlFor={`select-storage-${item.saleItemId}`} style={{ display: "block", fontSize: "var(--text-xs)", marginBottom: "4px" }}>
                  Seleccionar depósito de origen:
                </label>
                <select
                  id={`select-storage-${item.saleItemId}`}
                  value={selections[item.saleItemId] || ""}
                  onChange={(e) => handleSelect(item.saleItemId, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px",
                    fontSize: "var(--text-sm)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                  }}
                >
                  <option value="">-- Elegir depósito --</option>
                  {activeStorages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
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
