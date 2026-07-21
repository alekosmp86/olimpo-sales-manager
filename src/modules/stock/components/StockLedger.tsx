"use client";

import { useState, useMemo } from "react";
import { useStockEvents } from "@/modules/stock/hooks/useStockEvents";
import { useStorages } from "@/modules/stock/hooks/useStorages";
import { STOCK_EVENT_LABELS } from "@/modules/stock/constants";
import { MONTH_ABBRS } from "@/lib/utils/dateUtils";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table } from "@/components/ui/Table";
import type { StockEventDTO } from "@/modules/stock/types";
import styles from "./StockLedger.module.css";

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const monthName = MONTH_ABBRS[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}-${monthName}-${year}, ${hours}:${minutes}`;
}

export function StockLedger() {
  const { storages } = useStorages();
  const [selectedStorageId, setSelectedStorageId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useStockEvents({
    storageId: selectedStorageId || undefined,
  });

  const filteredEvents = useMemo(() => {
    return (data?.events ?? []).filter((event) =>
      event.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data?.events, searchTerm]);

  const columns = useMemo(() => [
    {
      header: "Fecha",
      className: styles.tdMutedNowrap,
      render: (event: StockEventDTO) => formatEventDate(event.createdAt),
    },
    {
      header: "Depósito",
      className: styles.tdMedium,
      render: (event: StockEventDTO) => event.storageName,
    },
    {
      header: "Tipo",
      className: styles.tdSecondary,
      render: (event: StockEventDTO) => STOCK_EVENT_LABELS[event.type] ?? event.type,
    },
    {
      header: "Producto",
      render: (event: StockEventDTO) => (
        <>
          {event.productName}{" "}
          <span className={styles.productDimension}>
            {event.productDimension}
          </span>
        </>
      ),
    },
    {
      header: "Var.",
      className: styles.tdRightSemibold,
      render: (event: StockEventDTO) => {
        const deltaLabel = event.delta > 0 ? `+${event.delta}` : `${event.delta}`;
        const deltaColor =
          event.delta > 0
            ? "var(--color-green-text)"
            : event.delta < 0
            ? "var(--color-red-text)"
            : "var(--color-text-muted)";
        return <span style={{ color: deltaColor }}>{deltaLabel}</span>;
      },
    },
    {
      header: "Stock final",
      className: styles.tdRightMedium,
      render: (event: StockEventDTO) => event.quantityAfter,
    },
    {
      header: "Notas",
      className: styles.tdNotes,
      render: (event: StockEventDTO) => (
        <span title={event.notes || ""}>
          {event.notes}
        </span>
      ),
    },
  ], []);

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <div className={styles.filterSelectContainer}>
          <label htmlFor="ledger-storage-filter" className={styles.label}>
            Filtrar por depósito
          </label>
          <select
            id="ledger-storage-filter"
            value={selectedStorageId}
            onChange={(event) => setSelectedStorageId(event.target.value)}
            className={styles.select}
          >
            <option value="">Todos los depósitos</option>
            {storages.map((storage) => (
              <option key={storage.id} value={storage.id}>
                {storage.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterSearchContainer}>
          <label htmlFor="ledger-product-search" className={styles.label}>
            Buscar producto
          </label>
          <SearchInput
            id="ledger-product-search"
            placeholder="Ej: Ozempic..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        {isLoading ? (
          <p className={styles.statusText}>
            Cargando historial...
          </p>
        ) : (
          <Table
            items={filteredEvents}
            columns={columns}
            emptyMessage="No se encontraron movimientos."
            keyExtractor={(event) => event.id}
          />
        )}
      </div>
    </div>
  );
}
