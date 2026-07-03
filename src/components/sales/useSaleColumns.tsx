"use client";

import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { DeliveryDropdown, PaymentDropdown } from "./StatusDropdown";
import { ProductsCell } from "./ProductsCell";
import type { Sale } from "@/lib/types";
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
            <input
              type="date"
              className={styles.cellInput}
              defaultValue={dateStr}
              onBlur={(e) => {
                if (e.target.value !== dateStr)
                  onUpdate({ id: row.original.id, data: { date: e.target.value } });
              }}
            />
          );
        },
        size: 140,
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
        size: 150,
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
        size: 220,
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
        size: 160,
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
        size: 200,
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
      }),
    ],
    [onUpdate, onOpenProducts]
  );
}
