"use client";

import type { ImportValidRow } from "@/lib/types";
import styles from "./ImportReviewModal.module.css";
import { formatReviewDate } from "@/lib/dateUtils";

interface ValidTabProps {
  rows: ImportValidRow[];
}

export function ValidTab({ rows }: ValidTabProps) {
  if (rows.length === 0) {
    return <p className={styles.empty}>No hay filas válidas.</p>;
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Producto</th>
            <th>Dimensión</th>
            <th>Cantidad</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={styles.validRow}>
              <td>{formatReviewDate(row.date)}</td>
              <td>{row.clientName}</td>
              <td>{row.phone || <span className={styles.emptyPhone}>—</span>}</td>
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

