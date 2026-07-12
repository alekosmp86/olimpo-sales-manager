"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { StorageDTO } from "@/modules/stock/types";
import { useStorages } from "@/modules/stock/hooks/useStorages";
import { useStockLines } from "@/modules/stock/hooks/useStockLines";
import { handleResponse } from "@/lib/utils/apiUtils";
import { StockErrorType } from "../constants";
import { TransferConflictModal } from "./TransferConflictModal";
import type { ConflictWarning } from "./TransferConflictModal";
import styles from "./TransferModal.module.css";

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
  const [conflictWarning, setConflictWarning] = useState<ConflictWarning | null>(null);

  // Filter out the source storage from destinations
  const destinationStorages = useMemo(() => {
    return storages.filter((storage) => storage.id !== fromStorage.id && storage.isActive);
  }, [storages, fromStorage.id]);

  // Only products with physical quantity > 0 can be transferred
  const transferrableLines = useMemo(() => {
    return stockLines.filter((line) => line.quantity > 0);
  }, [stockLines]);

  // Derive selection values, defaulting to the first option if none is selected or selection is invalid
  const hasSelectedProduct = useMemo(() => {
    return transferrableLines.some((line) => line.productId === productId);
  }, [transferrableLines, productId]);

  const currentProductId = hasSelectedProduct ? productId : (transferrableLines[0]?.productId ?? "");

  const hasSelectedDestination = useMemo(() => {
    return destinationStorages.some((storage) => storage.id === toStorageId);
  }, [destinationStorages, toStorageId]);

  const currentToStorageId = hasSelectedDestination ? toStorageId : (destinationStorages[0]?.id ?? "");

  const selectedLine = useMemo(() => {
    return transferrableLines.find((line) => line.productId === currentProductId);
  }, [transferrableLines, currentProductId]);

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
      }).then(async (response) => {
        if (response.status === 409) {
          const errData = await response.json();
          if (errData.error === StockErrorType.RESERVATION_CONFLICT) {
            throw { type: StockErrorType.RESERVATION_CONFLICT, conflict: errData.conflict };
          }
          throw new Error(errData.error || "Conflict occurred");
        }
        return handleResponse<{ ok: boolean }>(response);
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      onClose();
    },
    onError: (err: any) => {
      if (err.type === StockErrorType.RESERVATION_CONFLICT) {
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
    currentProductId &&
    currentToStorageId &&
    quantity > 0 &&
    quantity <= maxQuantity &&
    !transferMutation.isPending;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    transferMutation.mutate({
      fromStorageId: fromStorage.id,
      toStorageId: currentToStorageId,
      productId: currentProductId,
      quantity,
      force: false,
      notes: notes.trim() || undefined,
    });
  }

  function handleConfirmConflict() {
    if (!isValid) return;

    transferMutation.mutate({
      fromStorageId: fromStorage.id,
      toStorageId: currentToStorageId,
      productId: currentProductId,
      quantity,
      force: true,
      notes: notes.trim() || undefined,
    });
  }

  if (conflictWarning) {
    return (
      <TransferConflictModal
        conflictWarning={conflictWarning}
        onClose={() => setConflictWarning(null)}
        onConfirm={handleConfirmConflict}
        isPending={transferMutation.isPending}
      />
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
      <form onSubmit={handleSubmit} className={styles.form}>
        {transferrableLines.length === 0 ? (
          <p className={styles.emptyStateText}>
            No hay productos con stock en este depósito para transferir.
          </p>
        ) : (
          <>
            <div>
              <label htmlFor="transfer-product" className={styles.label}>
                Producto a transferir
              </label>
              <select
                id="transfer-product"
                value={currentProductId}
                onChange={(event) => setProductId(event.target.value)}
                className={styles.select}
              >
                {transferrableLines.map((line) => (
                  <option key={line.productId} value={line.productId}>
                    {line.product.name} {line.product.dimension.label} (Físico: {line.quantity} un.)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="transfer-destination" className={styles.label}>
                Depósito destino
              </label>
              {destinationStorages.length === 0 ? (
                <p className={styles.errorText}>
                  No hay otros depósitos activos disponibles. Cree uno primero.
                </p>
              ) : (
                <select
                  id="transfer-destination"
                  value={currentToStorageId}
                  onChange={(event) => setToStorageId(event.target.value)}
                  className={styles.select}
                >
                  {destinationStorages.map((storage) => (
                    <option key={storage.id} value={storage.id}>
                      {storage.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="transfer-quantity" className={styles.label}>
                Cantidad a transferir (Máx: {maxQuantity})
              </label>
              <input
                id="transfer-quantity"
                type="number"
                min="1"
                max={maxQuantity}
                value={quantityStr}
                onChange={(event) => setQuantityStr(event.target.value)}
                className={styles.input}
              />
            </div>

            <div>
              <label htmlFor="transfer-notes" className={styles.label}>
                Notas / Motivo de la transferencia
              </label>
              <textarea
                id="transfer-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Opcional. Ej: Abastecimiento de depósito"
                className={styles.textarea}
              />
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
