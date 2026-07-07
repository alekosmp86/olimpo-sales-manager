"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import { useDebounce } from "@/hooks/useDebounce";
import { useSales } from "@/hooks/useSales";
import { useMonthSheet } from "@/hooks/useMonthSheet";
import { SalesToolbar } from "./SalesToolbar";
import { SalesGrid } from "./SalesGrid";
import { MonthSheetBar } from "./MonthSheetBar";
import { ProductsModal } from "./ProductsModal";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import styles from "./SalesTable.module.css";
import type { Sale } from "@/lib/types";
import { useConfirm } from "@/components/ui/Confirm";
import { MessageType } from "@/lib/constants/messageType";
import { buildSheetDate } from "@/lib/dateUtils";

export function SalesTable() {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [newRowId, setNewRowId] = useState<string | null>(null);
  const [productsModal, setProductsModal] = useState<{ saleId: string } | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const confirm = useConfirm();

  // ── Data + mutations ──────────────────────────────────────────────────────
  const { sales, isLoading, createMutation, updateMutation, deleteMutation, duplicateMutation } =
    useSales(debouncedSearch);
  const { mutate: createSale } = createMutation;
  const { mutate: deleteSales } = deleteMutation;

  // ── Sheet navigation ──────────────────────────────────────────────────────
  const { selectedYear, selectedMonth, goToPrevYear, goToNextYear, selectMonth } =
    useMonthSheet(sales, isLoading);

  // ── Stable callbacks using refs to prevent child re-renders on mutation changes ──
  const updateMutationRef = useRef(updateMutation);
  updateMutationRef.current = updateMutation;
  const handleUpdate = useCallback(
    (payload: { id: string; data: Record<string, unknown> }) => {
      updateMutationRef.current.mutate(payload);
    },
    []
  );

  const duplicateMutationRef = useRef(duplicateMutation);
  duplicateMutationRef.current = duplicateMutation;
  const handleDuplicate = useCallback((saleId: string) => {
    duplicateMutationRef.current.mutate(saleId, {
      onSuccess: (newSale: Sale) => {
        setNewRowId(newSale.id);
        setTimeout(() => setNewRowId(null), 1000);
      },
    });
  }, []);

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

  const handleDelete = useCallback(async () => {
    const ids = Object.keys(rowSelection).filter((k) => rowSelection[k]);
    if (ids.length === 0) return;

    const ok = await confirm({
      title: "¿Eliminar ventas?",
      message: `¿Está seguro de que desea eliminar ${ids.length} venta(s)? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      type: MessageType.DANGER,
    });

    if (!ok) return;

    deleteSales(ids, {
      onSuccess: () => setRowSelection({}),
    });
  }, [rowSelection, deleteSales, confirm]);

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
        sales={filteredSales}
        isLoading={isLoading}
        newRowId={newRowId}
        hasSearch={!!debouncedSearch}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onUpdate={handleUpdate}
        onDuplicate={handleDuplicate}
        onOpenProducts={handleOpenProducts}
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
