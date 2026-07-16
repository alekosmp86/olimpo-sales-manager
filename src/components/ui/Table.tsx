"use client";

import React from "react";
import styles from "./Table.module.css";

export interface ColumnConfig<T> {
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  items: T[];
  columns: ColumnConfig<T>[];
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
}

export function Table<T>({
  items,
  columns,
  emptyMessage = "No se encontraron elementos",
  keyExtractor,
}: TableProps<T>) {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeaderRow}>
            {columns.map((column) => (
              <th
                key={column.header}
                className={[styles.th, column.className].filter(Boolean).join(" ")}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.noProducts}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={keyExtractor(item)} className={styles.tableRow}>
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className={[styles.td, column.className].filter(Boolean).join(" ")}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
