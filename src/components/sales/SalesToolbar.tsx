"use client";

import { Search, Package, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImportCSVButton } from "@/components/import/ImportCSVButton";
import styles from "./SalesTable.module.css";

interface SalesToolbarProps {
  search: string;
  onSearch: (val: string) => void;
  selectedCount: number;
  isDeletePending: boolean;
  isCreatePending: boolean;
  onDelete: () => void;
  onCreate: () => void;
  onOpenCatalog: () => void;
}

export function SalesToolbar({
  search,
  onSearch,
  selectedCount,
  isDeletePending,
  isCreatePending,
  onDelete,
  onCreate,
  onOpenCatalog,
}: SalesToolbarProps) {
  return (
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
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Buscar ventas"
          />
        </div>
      </div>

      <div className={styles.toolbarRight}>
        <Button id="catalog-btn" variant="ghost" size="sm" onClick={onOpenCatalog}>
          <Package size={16} /> Catálogo
        </Button>

        <ImportCSVButton />

        <Button
          id="delete-btn"
          variant="danger"
          size="sm"
          disabled={selectedCount === 0}
          loading={isDeletePending}
          onClick={onDelete}
        >
          <Trash2 size={16} /> Eliminar ({selectedCount})
        </Button>

        <Button
          id="add-row-btn"
          variant="primary"
          size="sm"
          loading={isCreatePending}
          onClick={onCreate}
        >
          <Plus size={16} /> Nueva venta
        </Button>
      </div>
    </div>
  );
}
