"use client";

import { type Table, flexRender } from "@tanstack/react-table";
import { useEffect, useRef } from "react";
import type { Sale } from "@/lib/types";
import styles from "./SalesTable.module.css";

interface SalesGridProps {
  table: Table<Sale>;
  isLoading: boolean;
  colCount: number;
  newRowId: string | null;
  hasSearch: boolean;
}

export function SalesGrid({
  table,
  isLoading,
  colCount,
  newRowId,
  hasSearch,
}: SalesGridProps) {
  const newRowRef = useRef<HTMLTableRowElement>(null);
  const rows = table.getRowModel().rows;

  // Smoothly scroll the new row into view when it is rendered
  useEffect(() => {
    if (newRowId && newRowRef.current) {
      newRowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [newRowId, rows]);

  if (isLoading) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.loading}>
          <span className={styles.spinner} />
          <span>Cargando ventas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className={styles.headerRow}>
                 {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className={styles.th}
                    data-col={header.column.id}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className={styles.emptyState}>
                  {hasSearch
                    ? "No se encontraron resultados."
                    : "No hay ventas en este mes. Cree una o importe un CSV."}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  ref={newRowRef}
                  className={[
                    styles.row,
                    row.getIsSelected() ? styles.selectedRow : "",
                    row.original.id === newRowId ? styles.newRow : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={styles.td}
                      data-col={cell.column.id}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
