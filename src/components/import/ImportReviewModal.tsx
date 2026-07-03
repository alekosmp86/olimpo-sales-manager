"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import styles from "./ImportReviewModal.module.css";
import type {
  ImportClassificationResult,
  ImportValidRow,
  ImportDuplicatePair,
} from "@/lib/types";

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

// ─── Tab Components ───────────────────────────────────────────────────────────

function ValidTab({ rows }: { rows: ImportValidRow[] }) {
  if (rows.length === 0)
    return <p className={styles.empty}>No hay filas válidas.</p>;

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Producto</th>
            <th>Dimensión</th>
            <th>Cantidad</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={styles.validRow}>
              <td>{row.date}</td>
              <td>{row.clientName}</td>
              <td>{row.product}</td>
              <td>{row.dimension}</td>
              <td>{row.quantity}</td>
              <td>${row.totalPrice.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvalidTab({ rows }: { rows: ImportClassificationResult["invalid"] }) {
  if (rows.length === 0)
    return <p className={styles.empty}>✓ No hay filas inválidas.</p>;

  return (
    <div className={styles.invalidList}>
      {rows.map((item, i) => (
        <div key={i} className={styles.invalidItem}>
          <div className={styles.invalidHeader}>
            <span className={styles.invalidLabel}>Fila {i + 1}</span>
            <span className={styles.invalidClient}>
              {item.row.clientName || "(sin nombre)"}
            </span>
          </div>
          <ul className={styles.errorList}>
            {item.errors.map((err, j) => (
              <li key={j}>{err}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function DuplicatesTab({
  pairs,
  decisions,
  onDecision,
}: {
  pairs: ImportDuplicatePair[];
  decisions: Record<number, boolean>;
  onDecision: (i: number, val: boolean) => void;
}) {
  if (pairs.length === 0)
    return <p className={styles.empty}>✓ No hay duplicados.</p>;

  return (
    <div className={styles.duplicateList}>
      {pairs.map((pair, i) => (
        <div key={i} className={styles.duplicateCard}>
          <div className={styles.dupColumns}>
            <div className={styles.dupCol}>
              <h4 className={styles.dupColTitle}>Existente en DB</h4>
              <p className={styles.dupName}>{pair.existingClientName}</p>
            </div>
            <div className={styles.dupArrow}>↔</div>
            <div className={styles.dupCol}>
              <h4 className={styles.dupColTitle}>Nuevo (CSV)</h4>
              <p className={styles.dupName}>{pair.incoming.clientName}</p>
              <p className={styles.dupMeta}>{pair.incoming.date} · {pair.incoming.product} {pair.incoming.dimension}</p>
            </div>
          </div>
          <div className={styles.dupActions}>
            <button
              className={[styles.dupBtn, decisions[i] === false ? styles.dupBtnActive : ""].join(" ")}
              onClick={() => onDecision(i, false)}
            >
              Misma persona — ignorar
            </button>
            <button
              className={[styles.dupBtn, styles.dupBtnGreen, decisions[i] === true ? styles.dupBtnActive : ""].join(" ")}
              onClick={() => onDecision(i, true)}
            >
              Persona diferente — agregar ambos
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
