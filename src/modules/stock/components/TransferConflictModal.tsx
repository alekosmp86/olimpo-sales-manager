"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import styles from "./TransferModal.module.css";

export interface ConflictWarning {
  productName: string;
  totalReserved: number;
  transferQuantity: number;
}

interface TransferConflictModalProps {
  conflictWarning: ConflictWarning;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function TransferConflictModal({
  conflictWarning,
  onClose,
  onConfirm,
  isPending,
}: TransferConflictModalProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Advertencia de Reserva"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isPending}>
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
