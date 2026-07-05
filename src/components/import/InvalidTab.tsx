"use client";

import type { ImportClassificationResult } from "@/lib/types";
import styles from "./ImportReviewModal.module.css";

interface InvalidTabProps {
  rows: ImportClassificationResult["invalid"];
}

function Field({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <span className={styles.rawField}>
      <span className={styles.rawLabel}>{label}:</span> {value}
    </span>
  );
}

export function InvalidTab({ rows }: InvalidTabProps) {
  if (rows.length === 0) {
    return <p className={styles.empty}>✓ No hay filas inválidas.</p>;
  }

  return (
    <div className={styles.invalidList}>
      {rows.map((item, i) => (
        <div key={item.row.rowNumber} className={styles.invalidItem}>
          <div className={styles.invalidHeader}>
            <span className={styles.invalidLabel}>Línea {item.row.rowNumber}</span>
            <span className={styles.invalidClient}>
              {item.row.clientName || "(sin nombre)"}
            </span>
          </div>

          {/* Raw row data for identification */}
          <div className={styles.rawData}>
            <Field label="Fecha"     value={item.row.date} />
            <Field label="Dirección" value={item.row.address} />
            <Field label="Producto"  value={item.row.product} />
            <Field label="Dimensión" value={item.row.dimension} />
            <Field label="Cantidad"  value={item.row.quantity} />
            <Field label="Precio"    value={item.row.totalPrice} />
            <Field label="Entrega"   value={item.row.deliveryStatus} />
            <Field label="Pago"      value={item.row.paymentStatus} />
            <Field label="Comentario" value={item.row.comments} />
            <Field label="Teléfono"  value={item.row.phone} />
          </div>

          {/* Validation errors */}
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

