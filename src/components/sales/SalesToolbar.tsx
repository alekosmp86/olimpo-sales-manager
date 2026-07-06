"use client";

import { Package, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImportCSVButton } from "@/components/import/ImportCSVButton";
import { SearchInput } from "@/components/ui/SearchInput";
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
        <SearchInput
          id="search-input"
          value={search}
          onChange={onSearch}
          placeholder="Buscar por cliente o dirección..."
          ariaLabel="Buscar ventas"
          showIcon
        />
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
