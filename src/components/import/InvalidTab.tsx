"use client";

import type { ImportClassificationResult } from "@/lib/types";
import styles from "./ImportReviewModal.module.css";

interface InvalidTabProps {
  rows: ImportClassificationResult["invalid"];
}

export function InvalidTab({ rows }: InvalidTabProps) {
  if (rows.length === 0) {
    return <p className={styles.empty}>✓ No hay filas inválidas.</p>;
  }

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
