"use client";

import { useState, useMemo } from "react";
import { useStockEvents } from "@/modules/stock/hooks/useStockEvents";
import { useStorages } from "@/modules/stock/hooks/useStorages";
import { STOCK_EVENT_LABELS } from "@/modules/stock/constants";
import { MONTH_ABBRS } from "@/lib/dateUtils";
import { SearchInput } from "@/components/ui/SearchInput";
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
        ) : filteredEvents.length === 0 ? (
          <p className={styles.statusText}>
            No se encontraron movimientos.
          </p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th className={styles.th}>Fecha</th>
                  <th className={styles.th}>Depósito</th>
                  <th className={styles.th}>Tipo</th>
                  <th className={styles.th}>Producto</th>
                  <th className={styles.thRight}>Var.</th>
                  <th className={styles.thRight}>Stock final</th>
                  <th className={styles.th}>Notas</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => {
                  const dateStr = formatEventDate(event.createdAt);
                  const deltaLabel = event.delta > 0 ? `+${event.delta}` : `${event.delta}`;
                  const deltaColor =
                    event.delta > 0
                      ? "var(--color-green-text)"
                      : event.delta < 0
                      ? "var(--color-red-text)"
                      : "var(--color-text-muted)";

                  return (
                    <tr key={event.id} className={styles.tableRow}>
                      <td className={styles.tdMutedNowrap}>
                        {dateStr}
                      </td>
                      <td className={styles.tdMedium}>
                        {event.storageName}
                      </td>
                      <td className={styles.tdSecondary}>
                        {STOCK_EVENT_LABELS[event.type] ?? event.type}
                      </td>
                      <td className={styles.tdProduct}>
                        {event.productName} <span className={styles.productDimension}>{event.productDimension}</span>
                      </td>
                      <td className={styles.tdRightSemibold} style={{ color: deltaColor }}>
                        {deltaLabel}
                      </td>
                      <td className={styles.tdRightMedium}>
                        {event.quantityAfter}
                      </td>
                      <td className={styles.tdNotes} title={event.notes || ""}>
                        {event.notes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
