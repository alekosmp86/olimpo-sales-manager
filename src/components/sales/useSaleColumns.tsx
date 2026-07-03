"use client";

import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { DeliveryDropdown, PaymentDropdown } from "./StatusDropdown";
import { ProductsCell } from "./ProductsCell";
import type { Sale } from "@/lib/types";
import { formatReviewDate } from "@/lib/dateUtils";
import { Calendar } from "lucide-react";
import styles from "./SalesTable.module.css";

const columnHelper = createColumnHelper<Sale>();

type UpdatePayload = { id: string; data: Record<string, unknown> };

/**
 * Returns a stable column definition array for the sales table.
 * Re-creates only when `onUpdate` or `onOpenProducts` references change.
 * Both are expected to be stable (useCallback / mutation.mutate).
 */
export function useSaleColumns(
  onUpdate: (payload: UpdatePayload) => void,
  onOpenProducts: (saleId: string) => void
) {
  return useMemo(
    () => [
      // ── Checkbox ────────────────────────────────────────────────────────────
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            aria-label="Seleccionar todas"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label="Seleccionar fila"
          />
        ),
        size: 48,
      }),

      // ── Date ────────────────────────────────────────────────────────────────
      columnHelper.accessor("date", {
        header: "Fecha",
        cell: ({ getValue, row }) => {
          const dateStr = (getValue() ?? "").slice(0, 10);
          return (
            <div className={styles.dateInputWrapper}>
              <span className={styles.dateDisplayText}>
                {formatReviewDate(dateStr)}
              </span>
              <Calendar size={14} className={styles.dateCalendarIcon} />
              <input
                type="date"
                className={styles.dateHiddenInput}
                defaultValue={dateStr}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch {}
                }}
                onChange={(e) => {
                  if (e.target.value && e.target.value !== dateStr) {
                    onUpdate({ id: row.original.id, data: { date: e.target.value } });
                  }
                }}
              />
            </div>
          );
        },
        size: 170,
      }),

      // ── Client name ─────────────────────────────────────────────────────────
      columnHelper.accessor("clientName", {
        header: "Nombre",
        cell: ({ getValue, row }) => (
          <input
            type="text"
            className={styles.cellInput}
            defaultValue={getValue()}
            placeholder="Cliente"
            onBlur={(e) => {
              if (e.target.value !== getValue())
                onUpdate({ id: row.original.id, data: { clientName: e.target.value } });
            }}
          />
        ),
        size: 240,
      }),

      // ── Phone ───────────────────────────────────────────────────────────────
      columnHelper.accessor("phone", {
        header: "Teléfono",
        cell: ({ getValue, row }) => (
          <input
            type="text"
            className={styles.cellInput}
            defaultValue={getValue() ?? ""}
            placeholder="Teléfono"
            onBlur={(e) => {
              if (e.target.value !== (getValue() ?? ""))
                onUpdate({ id: row.original.id, data: { phone: e.target.value || null } });
            }}
          />
        ),
        size: 160,
      }),

      // ── Address ─────────────────────────────────────────────────────────────
      columnHelper.accessor("address", {
        header: "Dirección",
        cell: ({ getValue, row }) => (
          <input
            type="text"
            className={styles.cellInput}
            defaultValue={getValue() ?? ""}
            placeholder="Dirección"
            onBlur={(e) => {
              if (e.target.value !== (getValue() ?? ""))
                onUpdate({ id: row.original.id, data: { address: e.target.value || null } });
            }}
          />
        ),
        size: 400,
      }),

      // ── Products ────────────────────────────────────────────────────────────
      columnHelper.accessor("items", {
        header: "Productos",
        cell: ({ getValue, row }) => (
          <ProductsCell
            items={getValue()}
            onClick={() => onOpenProducts(row.original.id)}
          />
        ),
        size: 250,
      }),

      // ── Delivery status ─────────────────────────────────────────────────────
      columnHelper.accessor("deliveryStatus", {
        header: "Entrega",
        cell: ({ getValue, row }) => (
          <DeliveryDropdown
            value={getValue()}
            onChange={(val) =>
              onUpdate({ id: row.original.id, data: { deliveryStatus: val } })
            }
          />
        ),
        size: 150,
      }),

      // ── Payment status ──────────────────────────────────────────────────────
      columnHelper.accessor("paymentStatus", {
        header: "Pago",
        cell: ({ getValue, row }) => (
          <PaymentDropdown
            value={getValue()}
            onChange={(val) =>
              onUpdate({ id: row.original.id, data: { paymentStatus: val } })
            }
          />
        ),
        size: 170,
      }),

      // ── Comments ────────────────────────────────────────────────────────────
      columnHelper.accessor("comments", {
        header: "Comentarios",
        cell: ({ getValue, row }) => (
          <input
            type="text"
            className={styles.cellInput}
            defaultValue={getValue() ?? ""}
            placeholder="Comentarios"
            onBlur={(e) => {
              if (e.target.value !== (getValue() ?? ""))
                onUpdate({ id: row.original.id, data: { comments: e.target.value || null } });
            }}
          />
        ),
        size: 350,
      }),
    ],
    [onUpdate, onOpenProducts]
  );
}
