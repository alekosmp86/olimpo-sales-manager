"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import type { StorageDTO } from "@/modules/stock/types";
import { useStockLines } from "@/modules/stock/hooks/useStockLines";
import { useConfirm } from "@/components/ui/Confirm";
import styles from "./StorageCard.module.css";
import { CountModal } from "./CountModal";
import { TransferModal } from "./TransferModal";
import { StorageFormModal } from "./StorageFormModal";

interface StorageCardProps {
  storage: StorageDTO;
  onUpdate: (data: Partial<StorageDTO>) => void;
  onDelete: () => void;
}

export function StorageCard({ storage, onUpdate, onDelete }: StorageCardProps) {
  const { data: lines = [], isLoading } = useStockLines(storage.id);
  const [showCount, setShowCount] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const confirm = useConfirm();

  async function handleDelete() {
    const ok = await confirm({
      title: "Eliminar depósito",
      message: `¿Eliminar "${storage.name}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      type: "danger",
    });
    if (ok) onDelete();
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.storageName}>{storage.name}</p>
          {storage.description && (
            <p className={styles.storageDesc}>{storage.description}</p>
          )}
        </div>
        <div style={{ position: "relative" }}>
          <button
            className={styles.menuBtn}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Opciones"
            type="button"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div
              className={styles.menuDropdown}
              onBlur={() => setMenuOpen(false)}
            >
              {[
                { label: "Editar", action: () => { setShowEdit(true); setMenuOpen(false); } },
                { label: "Eliminar", action: () => { setMenuOpen(false); handleDelete(); }, danger: true },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className={[styles.menuItem, item.danger ? styles.danger : ""].filter(Boolean).join(" ")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.stockLines}>
        {isLoading ? (
          <p className={styles.emptyLines}>Cargando stock...</p>
        ) : lines.length === 0 ? (
          <p className={styles.emptyLines}>Sin stock registrado</p>
        ) : (
          lines.map((line) => (
            <div key={line.id} className={styles.stockRow}>
              <span className={styles.productName}>
                {line.product.name} {line.product.dimension.label}
              </span>
              <div className={styles.quantities}>
                {line.reserved > 0 && (
                  <span className={styles.reserved}>{line.reserved} reserv.</span>
                )}
                <div>
                  <span className={styles.qty}>{line.quantity}</span>
                  <span className={styles.qtyLabel}> un.</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.actions}>
        <button type="button" className={`${styles.actionBtn} ${styles.primary}`} onClick={() => setShowCount(true)}>
          Conteo
        </button>
        <button type="button" className={styles.actionBtn} onClick={() => setShowTransfer(true)}>
          Transferir
        </button>
      </div>

      {showCount && (
        <CountModal
          storage={storage}
          currentLines={lines}
          onClose={() => setShowCount(false)}
        />
      )}
      {showTransfer && (
        <TransferModal
          fromStorage={storage}
          onClose={() => setShowTransfer(false)}
        />
      )}
      {showEdit && (
        <StorageFormModal
          initial={storage}
          onClose={() => setShowEdit(false)}
          onSubmit={(data) => {
            onUpdate(data);
            setShowEdit(false);
          }}
        />
      )}
    </div>
  );
}
