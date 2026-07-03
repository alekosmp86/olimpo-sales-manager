"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/Button";
import type { CsvRow, ImportClassificationResult } from "@/lib/types";
import { ImportReviewModal } from "./ImportReviewModal";

export function ImportCSVButton() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportClassificationResult | null>(null);
  const [error, setError] = useState("");

  function handleClick() {
    fileRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete: async (parsed) => {
        try {
          const rawRows = parsed.data;
          if (rawRows.length === 0) return;

          // Check if first row is a header row by testing for typical header keywords
          const hasHeader = rawRows[0] && rawRows[0][0]?.toLowerCase().includes("date");
          const startIdx = hasHeader ? 1 : 0;

          const formattedRows: CsvRow[] = rawRows.slice(startIdx).map((row) => ({
            date: row[0] ?? "",
            clientName: row[1] ?? "",
            address: row[2] ?? "",
            product: row[3] ?? "",
            dimension: row[4] ?? "",
            quantity: row[5] ?? "",
            totalPrice: row[6] ?? "",
            deliveryStatus: row[7] ?? "",
            paymentStatus: row[8] ?? "",
            comments: row[9] ?? "",
          }));

          const res = await fetch("/api/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: formattedRows }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setResult(data);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Error al procesar CSV.");
        } finally {
          setLoading(false);
          // Reset input so same file can be re-selected
          if (fileRef.current) fileRef.current.value = "";
        }
      },
      error: (err) => {
        setError(err.message);
        setLoading(false);
      },
    });
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleFile}
        id="csv-file-input"
      />
      <Button
        id="import-csv-btn"
        variant="secondary"
        size="sm"
        onClick={handleClick}
        loading={loading}
      >
        📥 Importar CSV
      </Button>

      {error && (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-red-text)" }}>
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
    </>
  );
}
