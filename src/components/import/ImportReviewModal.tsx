"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import styles from "./ImportReviewModal.module.css";
import type {
  ImportClassificationResult,
  ImportValidRow,
} from "@/lib/types";
import { ValidTab } from "./ValidTab";
import { InvalidTab } from "./InvalidTab";
import { DuplicatesTab } from "./DuplicatesTab";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: ImportClassificationResult;
}

type Tab = "valid" | "invalid" | "duplicates";

export function ImportReviewModal({ isOpen, onClose, result }: Props) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("valid");
  // For duplicates: track user decisions — true = different person (add both), false = same person (skip)
  const [duplicateDecisions, setDuplicateDecisions] = useState<Record<number, boolean>>(
    () => Object.fromEntries(result.duplicates.map((_, i) => [i, false]))
  );
  const [success, setSuccess] = useState(false);

  const confirmMutation = useMutation({
    mutationFn: (rows: ImportValidRow[]) =>
      fetch("/api/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error);
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setSuccess(true);
    },
  });

  function handleConfirm() {
    const rows: ImportValidRow[] = [
      ...result.valid,
      ...result.duplicates
        .filter((_, i) => duplicateDecisions[i] === true)
        .map((d) => d.incoming),
    ];
    confirmMutation.mutate(rows);
  }

  const tabLabels: Record<Tab, string> = {
    valid: `Válidos (${result.valid.length})`,
    invalid: `Inválidos (${result.invalid.length})`,
    duplicates: `Duplicados (${result.duplicates.length})`,
  };

  const totalToImport =
    result.valid.length +
    Object.values(duplicateDecisions).filter(Boolean).length;

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Importación completada">
        <div className={styles.successBox}>
          <span className={styles.successIcon}>✓</span>
          <p>Se importaron <strong>{totalToImport}</strong> ventas exitosamente.</p>
          <Button variant="primary" onClick={onClose}>Cerrar</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Revisar importación CSV"
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            loading={confirmMutation.isPending}
            disabled={totalToImport === 0}
          >
            Confirmar importación ({totalToImport} filas)
          </Button>
        </>
      }
    >
      <div className={styles.tabs}>
        {(["valid", "invalid", "duplicates"] as Tab[]).map((t) => (
          <button
            key={t}
            className={[styles.tab, tab === t ? styles.activeTab : ""].join(" ")}
            onClick={() => setTab(t)}
          >
            {tabLabels[t]}
            {t === "invalid" && result.invalid.length > 0 && (
              <span className={styles.errorDot} />
            )}
          </button>
        ))}
      </div>

      {tab === "valid" && (
        <ValidTab rows={result.valid} />
      )}
      {tab === "invalid" && (
        <InvalidTab rows={result.invalid} />
      )}
      {tab === "duplicates" && (
        <DuplicatesTab
          pairs={result.duplicates}
          decisions={duplicateDecisions}
          onDecision={(i, val) =>
            setDuplicateDecisions((prev) => ({ ...prev, [i]: val }))
          }
        />
      )}

      {confirmMutation.isError && (
        <p className={styles.error}>Error al importar. Intente nuevamente.</p>
      )}
    </Modal>
  );
}

