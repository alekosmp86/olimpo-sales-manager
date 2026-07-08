import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import { useDebounce } from "@/hooks/useDebounce";
import { useSales } from "@/hooks/useSales";
import { useMonthSheet } from "@/hooks/useMonthSheet";
import { useConfirm } from "@/components/ui/Confirm";
import { MessageType } from "@/lib/constants/messageType";
import { buildSheetDate } from "@/lib/dateUtils";
import { MIN_ZOOM, MAX_ZOOM } from "@/components/sales/constants";
import { HighlightColor } from "@/lib/constants/colors";
import type { Sale } from "@/lib/types";

export function useSalesTableState() {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [newRowId, setNewRowId] = useState<string | null>(null);
  const [productsModal, setProductsModal] = useState<{ saleId: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [highlights, setHighlights] = useState<Record<string, HighlightColor>>({});

  useEffect(() => {
    const stored = localStorage.getItem("sale-name-highlights");
    if (stored) {
      try {
        setHighlights(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing highlights:", e);
      }
    }
  }, []);

  const handleHighlight = useCallback((saleId: string, color: HighlightColor | null) => {
    setHighlights((prev) => {
      const next = { ...prev };
      if (color) {
        next[saleId] = color;
      } else {
        delete next[saleId];
      }
      localStorage.setItem("sale-name-highlights", JSON.stringify(next));
      return next;
    });
  }, []);

  const confirm = useConfirm();

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(MAX_ZOOM, Number((prev + 0.1).toFixed(1))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(MIN_ZOOM, Number((prev - 0.1).toFixed(1))));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1.0);
  }, []);

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

  return {
    search,
    setSearch,
    debouncedSearch,
    rowSelection,
    setRowSelection,
    newRowId,
    productsModal,
    setProductsModal,
    zoomLevel,
    setZoomLevel,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    sales,
    isLoading,
    createMutation,
    deleteMutation,
    selectedYear,
    selectedMonth,
    goToPrevYear,
    goToNextYear,
    selectMonth,
    handleUpdate,
    handleDuplicate,
    handleOpenProducts,
    handleCreate,
    handleDelete,
    filteredSales,
    selectedIds,
    openProductsModalSale,
    highlights,
    handleHighlight,
  };
}
