"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { Sale } from "@/lib/types";
import { useSaleColumns } from "../../hooks/useSaleColumns";
import { usePinchToZoom } from "@/hooks/usePinchToZoom";
import styles from "./SalesTable.module.css";
import { MIN_ZOOM, MAX_ZOOM } from "./constants";

interface SalesGridProps {
  sales: Sale[];
  isLoading: boolean;
  newRowId: string | null;
  hasSearch: boolean;
  rowSelection: RowSelectionState;
  onRowSelectionChange: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  onUpdate: (payload: { id: string; data: Record<string, unknown> }) => void;
  onDuplicate: (saleId: string) => void;
  onOpenProducts: (saleId: string) => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
}

export const SalesGrid = React.memo(function SalesGrid({
  sales,
  isLoading,
  newRowId,
  hasSearch,
  rowSelection,
  onRowSelectionChange,
  onUpdate,
  onDuplicate,
  onOpenProducts,
  zoomLevel,
  onZoomChange,
}: SalesGridProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: false }
  ]);
  const newRowRef = useRef<HTMLTableRowElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  usePinchToZoom(containerRef, { zoomLevel, onZoomChange, minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM });

  const columns = useSaleColumns(onUpdate, onOpenProducts, sales, onDuplicate);

  const table = useReactTable({
    data: sales,
    columns,
    state: { rowSelection, sorting },
    onRowSelectionChange,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  const rows = table.getRowModel().rows;

  // Smoothly scroll the new row into view when it is rendered
  useEffect(() => {
    if (newRowId && newRowRef.current) {
      newRowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [newRowId, rows]);

  if (isLoading && rows.length === 0) {
    return (
      <div
        ref={containerRef}
        className={styles.tableContainer}
        style={{ "--grid-zoom": zoomLevel } as React.CSSProperties}
      >
        <div className={styles.loading}>
          <span className={styles.spinner} />
          <span>Cargando ventas...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={[styles.tableContainer, isLoading ? styles.tableLoading : ""].filter(Boolean).join(" ")}
      style={{ "--grid-zoom": zoomLevel } as React.CSSProperties}
    >
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className={styles.headerRow}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className={[
                      styles.th,
                      header.column.getCanSort() ? styles.sortableHeader : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    data-col={header.column.id}
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                        ? "descending"
                        : undefined
                    }
                  >
                    <div className={styles.headerContent}>
                      <span className={styles.headerLabel}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      {header.column.getCanSort() && (
                        <span className={styles.sortIconWrapper}>
                          {header.column.getIsSorted() === "asc" ? (
                            <ArrowUp size={14} className={styles.sortIconActive} />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ArrowDown size={14} className={styles.sortIconActive} />
                          ) : (
                            <ArrowUpDown size={14} className={styles.sortIconInactive} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyState}>
                  {hasSearch
                    ? "No se encontraron resultados."
                    : "No hay ventas en este mes. Cree una o importe un CSV."}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  ref={row.original.id === newRowId ? newRowRef : undefined}
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
});
