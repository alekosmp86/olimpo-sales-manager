"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { StorageDTO } from "@/modules/stock/types";
import { useStorages } from "@/modules/stock/hooks/useStorages";
import { useStockLines } from "@/modules/stock/hooks/useStockLines";
import { handleResponse } from "@/lib/utils/apiUtils";
import styles from "./TransferModal.module.css";
import { StockErrorType } from "../constants";

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
    return storages.filter((storage) => storage.id !== fromStorage.id && storage.isActive);
  }, [storages, fromStorage.id]);

  // Only products with physical quantity > 0 can be transferred
  const transferrableLines = useMemo(() => {
    return stockLines.filter((line) => line.quantity > 0);
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
    return transferrableLines.find((line) => line.productId === productId);
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
    productId &&
    toStorageId &&
    quantity > 0 &&
    quantity <= maxQuantity &&
    !transferMutation.isPending;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
        <div className={styles.warningContainer}>
          <p className={styles.warningBold}>
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
          <p className={styles.warningAlert}>
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
                value={productId}
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
                  value={toStorageId}
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
