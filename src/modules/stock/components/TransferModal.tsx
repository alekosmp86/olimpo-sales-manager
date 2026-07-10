"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { StorageDTO } from "@/modules/stock/types";
import { useStorages } from "@/modules/stock/hooks/useStorages";
import { useStockLines } from "@/modules/stock/hooks/useStockLines";
import { handleResponse } from "@/lib/utils/apiUtils";

interface TransferModalProps {
  fromStorage: StorageDTO;
  onClose: () => void;
}

export function TransferModal({ fromStorage, onClose }: TransferModalProps) {
  const queryClient = useQueryClient();
  const { storages } = useStorages();
  const { data: stockLines = [] } = useStockLines(fromStorage.id);

  const [productId, setProductId] = useState("");
  const [toStorageId, setToStorageId] = useState("");
  const [quantityStr, setQuantityStr] = useState("1");
  const [notes, setNotes] = useState("");

  const [conflictWarning, setConflictWarning] = useState<{
    productName: string;
    totalReserved: number;
    transferQuantity: number;
  } | null>(null);

  // Filter out the source storage from destinations
  const destinationStorages = useMemo(() => {
    return storages.filter((s) => s.id !== fromStorage.id && s.isActive);
  }, [storages, fromStorage.id]);

  // Only products with physical quantity > 0 can be transferred
  const transferrableLines = useMemo(() => {
    return stockLines.filter((l) => l.quantity > 0);
  }, [stockLines]);

  // Sync selected product once stockLines are loaded
  useMemo(() => {
    if (transferrableLines.length > 0 && !productId) {
      setProductId(transferrableLines[0].productId);
    }
  }, [transferrableLines, productId]);

  // Sync selected destination once destinations are loaded
  useMemo(() => {
    if (destinationStorages.length > 0 && !toStorageId) {
      setToStorageId(destinationStorages[0].id);
    }
  }, [destinationStorages, toStorageId]);

  const selectedLine = useMemo(() => {
    return transferrableLines.find((l) => l.productId === productId);
  }, [transferrableLines, productId]);

  const transferMutation = useMutation({
    mutationFn: (data: {
      fromStorageId: string;
      toStorageId: string;
      productId: string;
      quantity: number;
      force?: boolean;
      notes?: string;
    }) =>
      fetch("/api/stock/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (r) => {
        if (r.status === 409) {
          const errData = await r.json();
          if (errData.error === "RESERVATION_CONFLICT") {
            throw { type: "RESERVATION_CONFLICT", conflict: errData.conflict };
          }
          throw new Error(errData.error || "Conflict occurred");
        }
        return handleResponse<{ ok: boolean }>(r);
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      onClose();
    },
    onError: (err: any) => {
      if (err.type === "RESERVATION_CONFLICT") {
        setConflictWarning(err.conflict);
      } else {
        alert(err.message || "Error al realizar la transferencia.");
      }
    },
    meta: {
      successMessage: "Transferencia realizada con éxito",
    },
  });

  const quantity = parseInt(quantityStr, 10) || 0;
  const maxQuantity = selectedLine?.quantity ?? 0;
  const isValid =
    productId &&
    toStorageId &&
    quantity > 0 &&
    quantity <= maxQuantity &&
    !transferMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    transferMutation.mutate({
      fromStorageId: fromStorage.id,
      toStorageId,
      productId,
      quantity,
      force: false,
      notes: notes.trim() || undefined,
    });
  }

  function handleConfirmConflict() {
    if (!isValid) return;

    transferMutation.mutate({
      fromStorageId: fromStorage.id,
      toStorageId,
      productId,
      quantity,
      force: true,
      notes: notes.trim() || undefined,
    });
  }

  if (conflictWarning) {
    return (
      <Modal
        isOpen={true}
        onClose={() => setConflictWarning(null)}
        title="Advertencia de Reserva"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConflictWarning(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmConflict} loading={transferMutation.isPending}>
              Confirmar Transferencia
            </Button>
          </>
        }
      >
        <div style={{ color: "var(--color-text)", fontSize: "var(--text-sm)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <p style={{ fontWeight: "var(--weight-semibold)" }}>
            El depósito origen tiene reservas activas para este producto.
          </p>
          <p>
            Producto: <strong>{conflictWarning.productName}</strong>
          </p>
          <p>
            Stock Reservado: <strong>{conflictWarning.totalReserved} un.</strong>
          </p>
          <p>
            Cantidad a Transferir: <strong>{conflictWarning.transferQuantity} un.</strong>
          </p>
          <p style={{ color: "var(--color-amber-text)" }}>
            Si continúas, las ventas asociadas deberán resolver el depósito de origen alternativo al momento de marcarse como Entregadas.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Transferir desde: ${fromStorage.name}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid}
            loading={transferMutation.isPending}
          >
            Transferir
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {transferrableLines.length === 0 ? (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textAlign: "center", padding: "var(--space-4)" }}>
            No hay productos con stock en este depósito para transferir.
          </p>
        ) : (
          <>
            <div>
              <label htmlFor="transfer-product" style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", marginBottom: "var(--space-1)" }}>
                Producto a transferir
              </label>
              <select
                id="transfer-product"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--space-2) var(--space-3)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--text-sm)",
                }}
              >
                {transferrableLines.map((l) => (
                  <option key={l.productId} value={l.productId}>
                    {l.product.name} {l.product.dimension.label} (Físico: {l.quantity} un.)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="transfer-destination" style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", marginBottom: "var(--space-1)" }}>
                Depósito destino
              </label>
              {destinationStorages.length === 0 ? (
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-red-text)" }}>
                  No hay otros depósitos activos disponibles. Cree uno primero.
                </p>
              ) : (
                <select
                  id="transfer-destination"
                  value={toStorageId}
                  onChange={(e) => setToStorageId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "var(--space-2) var(--space-3)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  {destinationStorages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="transfer-quantity" style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", marginBottom: "var(--space-1)" }}>
                Cantidad a transferir (Máx: {maxQuantity})
              </label>
              <input
                id="transfer-quantity"
                type="number"
                min="1"
                max={maxQuantity}
                value={quantityStr}
                onChange={(e) => setQuantityStr(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--space-2) var(--space-3)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--text-sm)",
                }}
              />
            </div>

            <div>
              <label htmlFor="transfer-notes" style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", marginBottom: "var(--space-1)" }}>
                Notas / Motivo de la transferencia
              </label>
              <textarea
                id="transfer-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opcional. Ej: Abastecimiento de depósito"
                style={{
                  width: "100%",
                  height: "60px",
                  padding: "var(--space-2) var(--space-3)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--text-sm)",
                  resize: "none",
                }}
              />
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
