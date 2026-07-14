"use client";

import { useSalesTableState } from "@/hooks/useSalesTableState";
import { SalesToolbar } from "./SalesToolbar";
import { SalesGrid } from "./SalesGrid";
import { MonthSheetBar } from "./MonthSheetBar";
import { ProductsModal } from "./ProductsModal";
import { withStockProductsModal } from "@/modules/stock/components/extensions/withStockProductsModal";
import styles from "./SalesTable.module.css";

const StockProductsModal = withStockProductsModal(ProductsModal);

/**
 * SalesTable represents the layout wrapper for sales management dashboard.
 * All state management and stable callback handling is delegated to the
 * useSalesTableState custom hook to keep this component focused on layout.
 */
export function SalesTable() {
  const {
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
  } = useSalesTableState();

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
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
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
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        highlights={highlights}
        onHighlight={handleHighlight}
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
          {sales.length} {sales.length !== 1 ? "ventas" : "venta"}
        </span>
        {selectedIds.length > 0 && (
          <span>
            {selectedIds.length} seleccionada
            {selectedIds.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {openProductsModalSale && productsModal && (
        <StockProductsModal
          isOpen
          onClose={() => setProductsModal(null)}
          saleId={productsModal.saleId}
          items={openProductsModalSale.items}
        />
      )}
    </div>
  );
}
