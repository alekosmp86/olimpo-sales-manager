"use client";

import type { ImportDuplicatePair } from "@/lib/types";
import styles from "./ImportReviewModal.module.css";
import { formatReviewDate } from "@/lib/utils/dateUtils";

interface DuplicatesTabProps {
  pairs: ImportDuplicatePair[];
  decisions: Record<number, string>;
  onDecision: (i: number, val: string) => void;
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
        <div key={pair.incoming.rowNumber} className={styles.duplicateCard}>
          <div className={styles.dupColumns}>
            <div className={styles.dupCol}>
              <h4 className={styles.dupColTitle}>Existente en DB</h4>
              <p className={styles.dupName}>{pair.existingClientName}</p>
              <p className={styles.dupMeta}>
                {formatReviewDate(pair.existingSaleDate)} · {pair.existingSaleProduct}
              </p>
              {(pair.existingPhone || pair.existingAddress) && (
                <p className={styles.dupMeta}>
                  {[pair.existingPhone, pair.existingAddress].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <div className={styles.dupArrow}>↔</div>
            <div className={styles.dupCol}>
              <h4 className={styles.dupColTitle}>Nuevo (CSV)</h4>
              <p className={styles.dupName}>{pair.incoming.clientName}</p>
              <p className={styles.dupMeta}>
                {formatReviewDate(pair.incoming.date)} · {pair.incoming.product}{" "}
                {pair.incoming.dimension}
              </p>
              {(pair.incoming.phone || pair.incoming.address) && (
                <p className={styles.dupMeta}>
                  {[pair.incoming.phone, pair.incoming.address].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
          <div className={styles.dupActions}>
            {pair.type === "exact_duplicate" ? (
              <>
                <button
                  type="button"
                  className={[
                    styles.dupBtn,
                    decisions[i] === "skip" ? styles.dupBtnActive : "",
                  ].join(" ")}
                  onClick={() => onDecision(i, "skip")}
                >
                  Misma venta — ignorar
                </button>
                <button
                  type="button"
                  className={[
                    styles.dupBtn,
                    styles.dupBtnGreen,
                    decisions[i] === "add" ? styles.dupBtnActive : "",
                  ].join(" ")}
                  onClick={() => onDecision(i, "add")}
                >
                  Nueva venta — agregar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={[
                    styles.dupBtn,
                    decisions[i] === "same_person" ? styles.dupBtnActive : "",
                  ].join(" ")}
                  onClick={() => onDecision(i, "same_person")}
                >
                  Misma persona — usar datos existentes
                </button>
                <button
                  type="button"
                  className={[
                    styles.dupBtn,
                    styles.dupBtnGreen,
                    decisions[i] === "different_person" ? styles.dupBtnActive : "",
                  ].join(" ")}
                  onClick={() => onDecision(i, "different_person")}
                >
                  Persona diferente — agregar como nuevo
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
