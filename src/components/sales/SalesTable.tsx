"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "./SalesTable.module.css";
import { DeliveryDropdown, PaymentDropdown } from "./StatusDropdown";
import { ProductsCell } from "./ProductsCell";
import { ProductsModal } from "./ProductsModal";
import { Button } from "@/components/ui/Button";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { ImportCSVButton } from "@/components/import/ImportCSVButton";
import type { Sale } from "@/lib/types";
import { Search, Package, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

const columnHelper = createColumnHelper<Sale>();

export function SalesTable() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [productsModal, setProductsModal] = useState<{
    saleId: string;
  } | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [newRowId, setNewRowId] = useState<string | null>(null);

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [hasSetDefault, setHasSetDefault] = useState(false);

  // Debounced search
  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    clearTimeout((window as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer);
    (window as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => setDebouncedSearch(val), 300);
  }, []);

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ["sales", debouncedSearch],
    queryFn: () =>
      fetch(`/api/sales${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ""}`)
        .then((r) => r.json()),
  });

  useEffect(() => {
    if (sales.length > 0 && !hasSetDefault) {
      const mostRecent = sales[0];
      if (mostRecent && mostRecent.date) {
        const parts = mostRecent.date.split("-");
        if (parts.length >= 2) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          setSelectedYear(year);
          setSelectedMonth(month);
          setHasSetDefault(true);
        }
      }
    } else if (sales.length === 0 && !hasSetDefault && !isLoading) {
      const today = new Date();
      setSelectedYear(today.getFullYear());
      setSelectedMonth(today.getMonth());
      setHasSetDefault(true);
    }
  }, [sales, hasSetDefault, isLoading]);

  const handleMonthChange = useCallback((e: React.MouseEvent, month: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedMonth(month);
  }, []);

  const handleYearChange = useCallback((e: React.MouseEvent, year: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedYear(year);
  }, []);

  const createMutation = useMutation({
    mutationFn: () => {
      const today = new Date();
      let saleDate: Date;
      if (selectedYear === today.getFullYear() && selectedMonth === today.getMonth()) {
        saleDate = today;
      } else {
        saleDate = new Date(selectedYear, selectedMonth, 1);
      }

      const yyyy = saleDate.getFullYear();
      const mm = String(saleDate.getMonth() + 1).padStart(2, '0');
      const dd = String(saleDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      return fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          clientName: "",
          address: "",
          comments: "",
        }),
      }).then((r) => r.json());
    },
    onSuccess: (newSale: Sale) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setNewRowId(newSale.id);
      setTimeout(() => setNewRowId(null), 1000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetch(`/api/sales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) => fetch(`/api/sales/${id}`, { method: "DELETE" }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setRowSelection({});
    },
  });

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);
  const selectedCount = selectedIds.length;

  const columns = [
    // Checkbox column
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

    // Date
    columnHelper.accessor("date", {
      header: "Fecha",
      cell: ({ getValue, row }) => {
        const val = getValue();
        const dateStr = typeof val === "string" ? val.slice(0, 10) : "";
        return (
          <input
            type="date"
            className={styles.cellInput}
            defaultValue={dateStr}
            onBlur={(e) => {
              if (e.target.value !== dateStr) {
                updateMutation.mutate({
                  id: row.original.id,
                  data: { date: e.target.value },
                });
              }
            }}
          />
        );
      },
      size: 140,
    }),

    // Client name
    columnHelper.accessor("clientName", {
      header: "Nombre",
      cell: ({ getValue, row }) => (
        <input
          type="text"
          className={styles.cellInput}
          defaultValue={getValue()}
          placeholder="Cliente"
          onBlur={(e) => {
            if (e.target.value !== getValue()) {
              updateMutation.mutate({
                id: row.original.id,
                data: { clientName: e.target.value },
              });
            }
          }}
        />
      ),
    }),

    // Address
    columnHelper.accessor("address", {
      header: "Dirección",
      cell: ({ getValue, row }) => (
        <input
          type="text"
          className={styles.cellInput}
          defaultValue={getValue() ?? ""}
          placeholder="Dirección"
          onBlur={(e) => {
            if (e.target.value !== (getValue() ?? "")) {
              updateMutation.mutate({
                id: row.original.id,
                data: { address: e.target.value || null },
              });
            }
          }}
        />
      ),
    }),

    // Products
    columnHelper.accessor("items", {
      header: "Productos",
      cell: ({ getValue, row }) => (
        <ProductsCell
          items={getValue()}
          onClick={() => setProductsModal({ saleId: row.original.id })}
        />
      ),
      size: 220,
    }),

    // Delivery Status
    columnHelper.accessor("deliveryStatus", {
      header: "Entrega",
      cell: ({ getValue, row }) => (
        <DeliveryDropdown
          value={getValue()}
          onChange={(val) =>
            updateMutation.mutate({
              id: row.original.id,
              data: { deliveryStatus: val },
            })
          }
        />
      ),
      size: 160,
    }),

    // Payment Status
    columnHelper.accessor("paymentStatus", {
      header: "Pago",
      cell: ({ getValue, row }) => (
        <PaymentDropdown
          value={getValue()}
          onChange={(val) =>
            updateMutation.mutate({
              id: row.original.id,
              data: { paymentStatus: val },
            })
          }
        />
      ),
      size: 200,
    }),

    // Comments
    columnHelper.accessor("comments", {
      header: "Comentarios",
      cell: ({ getValue, row }) => (
        <input
          type="text"
          className={styles.cellInput}
          defaultValue={getValue() ?? ""}
          placeholder="Comentarios"
          onBlur={(e) => {
            if (e.target.value !== (getValue() ?? "")) {
              updateMutation.mutate({
                id: row.original.id,
                data: { comments: e.target.value || null },
              });
            }
          }}
        />
      ),
    }),
  ];

  const filteredSales = useMemo(() =>
    sales.filter((sale) => {
      if (!sale || !sale.date) return false;
      const parts = sale.date.split("-");
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        return year === selectedYear && month === selectedMonth;
      }
      return false;
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

  const openProductsModal = productsModal
    ? sales.find((s) => s.id === productsModal.saleId)
    : null;

  return (
    <div className={styles.wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={16} />
            <input
              id="search-input"
              type="search"
              className={styles.searchInput}
              placeholder="Buscar por cliente o dirección..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.toolbarRight}>
          <Button
            id="catalog-btn"
            variant="ghost"
            size="sm"
            onClick={() => setCatalogOpen(true)}
          >
            <Package size={16} /> Catálogo
          </Button>
          <ImportCSVButton />
          <Button
            id="delete-btn"
            variant="danger"
            size="sm"
            disabled={selectedCount === 0}
            loading={deleteMutation.isPending}
            onClick={() => {
              if (
                window.confirm(
                  `¿Eliminar ${selectedCount} venta(s)? Esta acción no se puede deshacer.`
                )
              ) {
                deleteMutation.mutate(selectedIds);
              }
            }}
          >
            <Trash2 size={16} /> Eliminar ({selectedCount})
          </Button>
          <Button
            id="add-row-btn"
            variant="primary"
            size="sm"
            loading={createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Plus size={16} /> Nueva venta
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.loading}>
            <span className={styles.spinner} />
            <span>Cargando ventas...</span>
          </div>
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className={styles.headerRow}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className={styles.th}
                        style={{ width: header.getSize() }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className={styles.emptyState}
                    >
                      {debouncedSearch
                        ? "No se encontraron resultados."
                        : "No hay ventas en este mes. Cree una o importe un CSV."}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={[
                        styles.row,
                        row.getIsSelected() ? styles.selectedRow : "",
                        row.original.id === newRowId ? styles.newRow : "",
                      ].join(" ")}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className={styles.td}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Excel Month Sheet Tabs */}
      <div className={styles.excelTabs}>
        <div className={styles.yearSelector}>
          <button
            type="button"
            className={styles.yearBtn}
            onClick={(e) => handleYearChange(e, selectedYear - 1)}
            title="Año anterior"
          >
            <ChevronLeft size={14} />
          </button>
          <span className={styles.yearDisplay}>{selectedYear}</span>
          <button
            type="button"
            className={styles.yearBtn}
            onClick={(e) => handleYearChange(e, selectedYear + 1)}
            title="Año siguiente"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className={styles.sheetsScrollContainer}>
          {MONTH_NAMES.map((name, index) => {
            const isActive = selectedMonth === index;
            return (
              <button
                key={index}
                type="button"
                className={[styles.sheetTab, isActive ? styles.activeSheet : ""].join(" ")}
                onClick={(e) => handleMonthChange(e, index)}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status bar */}
      <div className={styles.statusBar}>
        <span>
          {filteredSales.length} de {sales.length} venta{sales.length !== 1 ? "s" : ""}
          {debouncedSearch ? ` (búsqueda)` : ""}
        </span>
        {selectedCount > 0 && (
          <span>{selectedCount} seleccionada{selectedCount !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Modals */}
      {openProductsModal && productsModal && (
        <ProductsModal
          isOpen={true}
          onClose={() => setProductsModal(null)}
          saleId={productsModal.saleId}
          items={openProductsModal.items}
        />
      )}

      <CatalogModal isOpen={catalogOpen} onClose={() => setCatalogOpen(false)} />
    </div>
  );
}
