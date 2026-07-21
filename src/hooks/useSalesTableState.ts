import { useState, useCallback, useMemo } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import { useDebounce } from "@/hooks/useDebounce";
import { useSales } from "@/hooks/useSales";
import { useMonthSheet } from "@/hooks/useMonthSheet";
import { useConfirm } from "@/components/ui/Confirm";
import { MessageType } from "@/lib/constants/messageType";
import { buildSheetDate } from "@/lib/utils/dateUtils";
import { MIN_ZOOM, MAX_ZOOM } from "@/lib/constants/zoom";
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

  // ── Sheet navigation ──────────────────────────────────────────────────────
  const { selectedYear, selectedMonth, goToPrevYear, goToNextYear, selectMonth } =
    useMonthSheet();

  // ── Data + mutations ──────────────────────────────────────────────────────
  const { sales, isLoading, createMutation, updateMutation, deleteMutation, duplicateMutation } =
    useSales(selectedYear, selectedMonth, debouncedSearch);
  const { mutate: createSale } = createMutation;
  const { mutate: deleteSales } = deleteMutation;

  const handleUpdate = useCallback(
    (payload: { id: string; data: Record<string, unknown> }) => {
      updateMutation.mutate(payload);
    },
    [updateMutation.mutate]
  );

  const handleDuplicate = useCallback((saleId: string) => {
    duplicateMutation.mutate(saleId, {
      onSuccess: (newSale: Sale) => {
        setNewRowId(newSale.id);
        setTimeout(() => setNewRowId(null), 1000);
      },
    });
  }, [duplicateMutation.mutate]);

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

  const highlights = useMemo(() => {
    const map: Record<string, HighlightColor> = {};
    sales.forEach((sale) => {
      if (sale.highlightColor) {
        map[sale.id] = sale.highlightColor as HighlightColor;
      }
    });
    return map;
  }, [sales]);

  const handleHighlight = useCallback((saleId: string, color: HighlightColor | null) => {
    handleUpdate({ id: saleId, data: { highlightColor: color } });
  }, [handleUpdate]);

  const filteredSales = sales;

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
