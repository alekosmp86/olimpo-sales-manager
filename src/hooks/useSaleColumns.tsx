"use client";

import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { DeliveryDropdown, PaymentDropdown } from "../components/sales/StatusDropdown";
import { withStockDeliveryDropdown } from "@/modules/stock/components/extensions/withStockDeliveryDropdown";
import { ProductsCell } from "../components/sales/ProductsCell";
import { ClientNameCell } from "../components/sales/ClientNameCell";
import { AutoResizingTextareaCell } from "../components/sales/AutoResizingTextAreaCell";
import type { Sale } from "@/lib/types";
import { formatReviewDate } from "@/lib/dateUtils";
import { Calendar, MessageSquareText, Copy } from "lucide-react";
import { triggerGlobalToast } from "@/lib/utils/toastTrigger";
import { MessageType } from "@/lib/constants/messageType";
import { formatPrice } from "@/lib/utils/priceUtils";
import { HighlightColor } from "@/lib/constants/colors";
import styles from "../components/sales/SalesTable.module.css";

const columnHelper = createColumnHelper<Sale>();
const StockDeliveryDropdown = withStockDeliveryDropdown(DeliveryDropdown);

type UpdatePayload = { id: string; data: Record<string, unknown> };

/**
 * Returns a stable column definition array for the sales table.
 * Re-creates only when `onUpdate` or `onOpenProducts` references change.
 * Both are expected to be stable (useCallback / mutation.mutate).
 */
export function useSaleColumns(
  onUpdate: (payload: UpdatePayload) => void,
  onOpenProducts: (saleId: string) => void,
  sales: Sale[],
  onDuplicate: (saleId: string) => void,
  highlights: Record<string, HighlightColor>,
  onHighlight: (saleId: string, color: HighlightColor | null) => void
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

      // ── Actions ─────────────────────────────────────────────────────────────
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const handleCopy = async () => {
            const sale = row.original;
            const itemsText = (sale.items ?? []).reduce<string[]>((accumulator, item) => {
              if (item && item.product) {
                const productName = item.product.name;
                const dimensionLabel = item.product.dimension?.label ? ` (${item.product.dimension.label})` : "";
                const quantity = item.quantity;
                const price = formatPrice(item.totalPrice ?? (quantity * (item.product.unitPrice ?? 0)));
                accumulator.push(`- ${productName}${dimensionLabel}: ${quantity} u. · ${price}`);
              }
              return accumulator;
            }, []).join("\n");

            const text = [
              `Nombre: ${sale.clientName}`,
              `Teléfono: ${sale.phone ?? "No especificado"}`,
              `Dirección: ${sale.address ?? "No especificada"}`,
              `Productos:`,
              itemsText || "- Sin productos",
              sale.comments ? `Comentarios: ${sale.comments}` : null,
            ].filter(Boolean).join("\n");

            try {
              await navigator.clipboard.writeText(text);
              triggerGlobalToast("Detalles copiados al portapapeles", MessageType.SUCCESS);
            } catch (error) {
              console.error("Error al copiar al portapapeles:", error);
              triggerGlobalToast("Error al copiar al portapapeles", MessageType.DANGER);
            }
          };

          const handleDuplicateRow = () => {
            onDuplicate(row.original.id);
          };

          return (
            <div className={styles.actionsCell}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={handleCopy}
                title="Copiar detalles"
                aria-label="Copiar detalles"
              >
                <MessageSquareText size={16} />
              </button>
              <button
                type="button"
                className={styles.actionButton}
                onClick={handleDuplicateRow}
                title="Duplicar venta"
                aria-label="Duplicar venta"
              >
                <Copy size={16} />
              </button>
            </div>
          );
        },
        size: 80,
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
                onClick={(clickEvent) => {
                  try {
                    clickEvent.currentTarget.showPicker();
                  } catch {}
                }}
                onChange={(changeEvent) => {
                  if (changeEvent.target.value && changeEvent.target.value !== dateStr) {
                    onUpdate({ id: row.original.id, data: { date: changeEvent.target.value } });
                  }
                }}
                aria-label="Fecha de la venta"
              />
            </div>
          );
        },
        size: 170,
      }),

      // ── Client name (with autocomplete) ─────────────────────────────────────
      columnHelper.accessor("clientName", {
        header: "Nombre",
        cell: ({ getValue, row }) => (
          <ClientNameCell
            saleId={row.original.id}
            initialValue={getValue()}
            sales={sales}
            onUpdate={onUpdate}
            highlightColor={highlights[row.original.id] || null}
            onHighlight={(color) => onHighlight(row.original.id, color)}
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
            onBlur={(blurEvent) => {
              if (blurEvent.target.value !== (getValue() ?? ""))
                onUpdate({ id: row.original.id, data: { phone: blurEvent.target.value || null } });
            }}
            aria-label="Teléfono del cliente"
          />
        ),
        size: 160,
        enableSorting: false,
      }),

      // ── Address ─────────────────────────────────────────────────────────────
      columnHelper.accessor("address", {
        header: "Dirección",
        cell: ({ getValue, row }) => (
          <AutoResizingTextareaCell
            initialValue={getValue()}
            placeholder="Dirección"
            ariaLabel="Dirección de entrega"
            onUpdate={(addressValue) =>
              onUpdate({ id: row.original.id, data: { address: addressValue } })
            }
          />
        ),
        size: 400,
        enableSorting: false,
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
          <StockDeliveryDropdown
            value={getValue()}
            sale={row.original}
            onChange={(newStatus) =>
              onUpdate({ id: row.original.id, data: { deliveryStatus: newStatus } })
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
            onChange={(newStatus) =>
              onUpdate({ id: row.original.id, data: { paymentStatus: newStatus } })
            }
          />
        ),
        size: 190,
      }),

      // ── Comments ────────────────────────────────────────────────────────────
      columnHelper.accessor("comments", {
        header: "Comentarios",
        cell: ({ getValue, row }) => (
          <AutoResizingTextareaCell
            initialValue={getValue()}
            placeholder="Comentarios"
            ariaLabel="Comentarios de la venta"
            onUpdate={(commentValue) =>
              onUpdate({ id: row.original.id, data: { comments: commentValue } })
            }
          />
        ),
        size: 350,
        enableSorting: false,
      }),
    ],
    [onUpdate, onOpenProducts, sales, onDuplicate, highlights, onHighlight]
  );
}
