"use client";

import { useState, useCallback, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  type RowSelectionState,
} from "@tanstack/react-table";
import { useDebounce } from "@/hooks/useDebounce";
import { useSales } from "@/hooks/useSales";
import { useMonthSheet } from "@/hooks/useMonthSheet";
import { useSaleColumns } from "./useSaleColumns";
import { SalesToolbar } from "./SalesToolbar";
import { SalesGrid } from "./SalesGrid";
import { MonthSheetBar } from "./MonthSheetBar";
import { ProductsModal } from "./ProductsModal";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import styles from "./SalesTable.module.css";
import type { Sale } from "@/lib/types";

/** Builds the date string to use when creating a new sale in the current sheet. */
function buildSheetDate(year: number, month: number): string {
  const today = new Date();
  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();
  const date = isCurrentMonth ? today : new Date(year, month, 1);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function SalesTable() {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [newRowId, setNewRowId] = useState<string | null>(null);
  const [productsModal, setProductsModal] = useState<{ saleId: string } | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);

  // ── Data + mutations ──────────────────────────────────────────────────────
  const { sales, isLoading, createMutation, updateMutation, deleteMutation } =
    useSales(debouncedSearch);
  const { mutate: createSale } = createMutation;
  const { mutate: deleteSales } = deleteMutation;

  // ── Sheet navigation ──────────────────────────────────────────────────────
  const { selectedYear, selectedMonth, goToPrevYear, goToNextYear, selectMonth } =
    useMonthSheet(sales, isLoading);

  // ── Stable callbacks ──────────────────────────────────────────────────────
  const handleOpenProducts = useCallback(
    (saleId: string) => setProductsModal({ saleId }),
    []
  );

  const handleCreate = useCallback(() => {
    createSale(buildSheetDate(selectedYear, selectedMonth), {
      onSuccess: (newSale: Sale) => {
        setNewRowId(newSale.id);
        setTimeout(() => setNewRowId(null), 1000);
      },
    });
  }, [selectedYear, selectedMonth, createSale]);

  const handleDelete = useCallback(() => {
    const ids = Object.keys(rowSelection).filter((k) => rowSelection[k]);
    if (
      !window.confirm(
        `¿Eliminar ${ids.length} venta(s)? Esta acción no se puede deshacer.`
      )
    )
      return;
    deleteSales(ids, {
      onSuccess: () => setRowSelection({}),
    });
  }, [rowSelection, deleteSales]);

  // ── Table ─────────────────────────────────────────────────────────────────
  const columns = useSaleColumns(updateMutation.mutate, handleOpenProducts, sales);

  const filteredSales = useMemo(
    () =>
      sales.filter((sale) => {
        if (!sale?.date) return false;
        const [y, m] = sale.date.split("-");
        return (
          parseInt(y, 10) === selectedYear &&
          parseInt(m, 10) - 1 === selectedMonth
        );
      }),
    [sales, selectedYear, selectedMonth]
  );

  const table = useReactTable({
    data: filteredSales,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((k) => rowSelection[k]),
    [rowSelection]
  );

  const openProductsModalSale = productsModal
    ? sales.find((s) => s.id === productsModal.saleId)
    : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <SalesToolbar
        search={search}
        onSearch={setSearch}
        selectedCount={selectedIds.length}
        isDeletePending={deleteMutation.isPending}
        isCreatePending={createMutation.isPending}
        onDelete={handleDelete}
        onCreate={handleCreate}
        onOpenCatalog={() => setCatalogOpen(true)}
      />

      <SalesGrid
        table={table}
        isLoading={isLoading}
        colCount={columns.length}
        newRowId={newRowId}
        hasSearch={!!debouncedSearch}
      />

      <MonthSheetBar
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onPrevYear={goToPrevYear}
        onNextYear={goToNextYear}
        onSelectMonth={selectMonth}
      />

      <div className={styles.statusBar}>
        <span>
          {filteredSales.length} de {sales.length} venta
          {sales.length !== 1 ? "s" : ""}
          {debouncedSearch ? " (búsqueda)" : ""}
        </span>
        {selectedIds.length > 0 && (
          <span>
            {selectedIds.length} seleccionada
            {selectedIds.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {openProductsModalSale && productsModal && (
        <ProductsModal
          isOpen
          onClose={() => setProductsModal(null)}
          saleId={productsModal.saleId}
          items={openProductsModalSale.items}
        />
      )}

      <CatalogModal isOpen={catalogOpen} onClose={() => setCatalogOpen(false)} />
    </div>
  );
}
