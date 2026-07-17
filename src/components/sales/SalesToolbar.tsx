"use client";

import { useState } from "react";
import { Package, Trash2, Plus, ZoomIn, ZoomOut, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImportCSVButton } from "@/components/import/ImportCSVButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import styles from "./SalesTable.module.css";
import { MIN_ZOOM, MAX_ZOOM } from "@/lib/constants/zoom";

interface SalesToolbarProps {
  search: string;
  onSearch: (val: string) => void;
  selectedCount: number;
  isDeletePending: boolean;
  isCreatePending: boolean;
  onDelete: () => void;
  onCreate: () => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export function SalesToolbar({
  search,
  onSearch,
  selectedCount,
  isDeletePending,
  isCreatePending,
  onDelete,
  onCreate,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: SalesToolbarProps) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`${styles.toolbarContainer} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      <button
        type="button"
        className={styles.mobileToggleBtn}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className={styles.mobileToggleLeft}>
          <SlidersHorizontal size={16} />
          <span>Herramientas y Acciones</span>
        </div>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      <div className={styles.toolbarContent}>
        <div className={styles.toolbarInner}>
          <div className={styles.toolbarLeft}>
            <SearchInput
              id="search-input"
              testid="salesFilter"
              value={search}
              onChange={onSearch}
              placeholder="Buscar por cliente o dirección..."
              ariaLabel="Buscar ventas"
              showIcon
            />
            
            <div className={styles.zoomControls}>
              <button
                type="button"
                className={styles.zoomBtn}
                onClick={onZoomOut}
                disabled={zoomLevel <= MIN_ZOOM}
                title="Alejar cuadrícula"
                aria-label="Alejar cuadrícula"
              >
                <ZoomOut size={15} />
              </button>
              <button
                type="button"
                className={styles.zoomResetBtn}
                onClick={onZoomReset}
                title="Restaurar zoom"
                aria-label="Restaurar zoom al 100%"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                className={styles.zoomBtn}
                onClick={onZoomIn}
                disabled={zoomLevel >= MAX_ZOOM}
                title="Acercar cuadrícula"
                aria-label="Acercar cuadrícula"
              >
                <ZoomIn size={15} />
              </button>
            </div>
          </div>

          <div className={styles.toolbarRight}>
            <Button id="catalog-btn" variant="ghost" size="sm" onClick={() => setCatalogOpen(true)}>
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
      </div>

      <CatalogModal isOpen={catalogOpen} onClose={() => setCatalogOpen(false)} />
    </div>
  );
}
