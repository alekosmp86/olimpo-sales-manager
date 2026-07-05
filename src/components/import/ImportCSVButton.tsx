"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/Button";
import type { CsvRow, ImportClassificationResult } from "@/lib/types";
import { ImportReviewModal } from "./ImportReviewModal";
import { AliasMappingModal } from "./AliasMappingModal";
import { Upload } from "lucide-react";

import styles from "./ImportCSVButton.module.css";

export function ImportCSVButton() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportClassificationResult | null>(null);
  const [unmatched, setUnmatched] = useState<string[] | null>(null);
  const [pendingRows, setPendingRows] = useState<CsvRow[] | null>(null);
  const [error, setError] = useState("");

  function handleClick() {
    fileRef.current?.click();
  }

  async function submitImport(rows: CsvRow[]) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.unmatched) {
        setUnmatched(data.unmatched);
        setPendingRows(rows);
      } else {
        setResult(data);
        setUnmatched(null);
        setPendingRows(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al procesar CSV.");
    } finally {
      setLoading(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete: async (parsed) => {
        const rawRows = parsed.data;
        if (rawRows.length === 0) return;

        // No header row — data always starts at index 0
        const formattedRows: CsvRow[] = rawRows.flatMap((row, index) => {
          const date = row[0] ?? "";
          const clientName = row[1] ?? "";
          const product = row[3] ?? "";
          // Pre-filter completely blank rows (all fields empty) client-side
          if (!date && !clientName && !product) return [];

          return [{
            rowNumber: index + 1,
            date,
            clientName,
            address: row[2] ?? "",
            product,
            dimension: row[4] ?? "",
            quantity: row[5] ?? "",
            totalPrice: row[6] ?? "",
            deliveryStatus: row[7] ?? "",
            paymentStatus: row[8] ?? "",
            comments: row[9] ?? "",
            phone: row[10] ?? "",
          }];
        });

        if (formattedRows.length === 0) {
          setError("El archivo CSV no contiene filas válidas.");
          return;
        }

        await submitImport(formattedRows);

        // Reset input so same file can be re-selected
        if (fileRef.current) fileRef.current.value = "";

      },
      error: (err) => {
        setError(err.message);
      },
    });
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv, text/csv, application/csv, text/comma-separated-values"
        style={{ display: "none" }}
        onChange={handleFile}
        id="csv-file-input"
        aria-label="Subir archivo CSV de ventas"
      />
      <Button
        id="import-csv-btn"
        variant="secondary"
        size="sm"
        onClick={handleClick}
        loading={loading}
      >
        <Upload size={16} /> Importar
      </Button>

      {error && (
        <span className={styles.errorText}>
          {error}
        </span>
      )}

      {result && (
        <ImportReviewModal
          isOpen={true}
          onClose={() => setResult(null)}
          result={result}
        />
      )}

      {unmatched && pendingRows && (
        <AliasMappingModal
          isOpen={true}
          unmatched={unmatched}
          onClose={() => {
            setUnmatched(null);
            setPendingRows(null);
          }}
          onSuccess={() => submitImport(pendingRows)}
        />
      )}
    </>
  );
}
