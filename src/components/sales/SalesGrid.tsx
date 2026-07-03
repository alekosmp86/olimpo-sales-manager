"use client";

import { type Table, flexRender } from "@tanstack/react-table";
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
                    style={{ "--col-width": `${header.getSize()}px` } as React.CSSProperties}
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
                      style={{ "--col-width": `${cell.column.getSize()}px` } as React.CSSProperties}
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
