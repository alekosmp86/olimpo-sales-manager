"use client";

import React from "react";
import { cn } from "@/lib/utils/classNames";
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
  containerClassName?: string;
  scrollable?: boolean;
}

export function Table<T>({
  items,
  columns,
  emptyMessage = "No se encontraron elementos",
  keyExtractor,
  containerClassName,
  scrollable = false,
}: TableProps<T>) {
  return (
    <div className={cn(styles.tableContainer, scrollable && styles.scrollable, containerClassName)}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeaderRow}>
            {columns.map((column) => (
              <th
                key={column.header}
                className={cn(styles.th, column.className)}
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
                    className={cn(styles.td, column.className)}
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
