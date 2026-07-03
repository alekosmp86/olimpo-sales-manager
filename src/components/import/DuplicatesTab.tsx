"use client";

import type { ImportDuplicatePair } from "@/lib/types";
import styles from "./ImportReviewModal.module.css";
import { formatReviewDate } from "@/lib/dateUtils";

interface DuplicatesTabProps {
  pairs: ImportDuplicatePair[];
  decisions: Record<number, boolean>;
  onDecision: (i: number, val: boolean) => void;
}

export function DuplicatesTab({
  pairs,
  decisions,
  onDecision,
}: DuplicatesTabProps) {
  if (pairs.length === 0) {
    return <p className={styles.empty}>✓ No hay duplicados.</p>;
  }

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
              <p className={styles.dupMeta}>
                {formatReviewDate(pair.incoming.date)} · {pair.incoming.product}{" "}
                {pair.incoming.dimension}
              </p>
            </div>
          </div>
          <div className={styles.dupActions}>
            <button
              className={[
                styles.dupBtn,
                decisions[i] === false ? styles.dupBtnActive : "",
              ].join(" ")}
              onClick={() => onDecision(i, false)}
            >
              Misma persona — ignorar
            </button>
            <button
              className={[
                styles.dupBtn,
                styles.dupBtnGreen,
                decisions[i] === true ? styles.dupBtnActive : "",
              ].join(" ")}
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
