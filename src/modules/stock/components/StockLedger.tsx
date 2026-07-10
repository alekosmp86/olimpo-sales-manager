"use client";

import { useState, useMemo } from "react";
import { useStockEvents } from "@/modules/stock/hooks/useStockEvents";
import { useStorages } from "@/modules/stock/hooks/useStorages";
import { STOCK_EVENT_LABELS } from "@/modules/stock/constants";
import { MONTH_ABBRS } from "@/lib/dateUtils";

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

  const events = data?.events;

  const filteredEvents = useMemo(() => {
    return (events ?? []).filter((e) =>
      e.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <div style={{ minWidth: "200px" }}>
          <label htmlFor="ledger-storage-filter" style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "4px" }}>
            Filtrar por depósito
          </label>
          <select
            id="ledger-storage-filter"
            value={selectedStorageId}
            onChange={(e) => setSelectedStorageId(e.target.value)}
            style={{
              width: "100%",
              padding: "6px var(--space-2)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-sm)",
            }}
          >
            <option value="">Todos los depósitos</option>
            {storages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: "200px", flex: 1 }}>
          <label htmlFor="ledger-product-search" style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "4px" }}>
            Buscar producto
          </label>
          <input
            id="ledger-product-search"
            type="text"
            placeholder="Ej: Ozempic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "6px var(--space-2)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-sm)",
            }}
          />
        </div>
      </div>

      <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--color-surface)" }}>
        {isLoading ? (
          <p style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            Cargando historial...
          </p>
        ) : filteredEvents.length === 0 ? (
          <p style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            No se encontraron movimientos.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-2)", borderBottom: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "var(--text-xs)", textTransform: "uppercase" }}>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Fecha</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Depósito</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Tipo</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Producto</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right" }}>Var.</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right" }}>Stock final</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>Notas</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((e) => {
                  const dateStr = formatEventDate(e.createdAt);
                  const deltaLabel = e.delta > 0 ? `+${e.delta}` : `${e.delta}`;
                  const deltaColor =
                    e.delta > 0
                      ? "var(--color-green-text)"
                      : e.delta < 0
                      ? "var(--color-red-text)"
                      : "var(--color-text-muted)";

                  return (
                    <tr key={e.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "var(--space-3) var(--space-4)", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                        {dateStr}
                      </td>
                      <td style={{ padding: "var(--space-3) var(--space-4)", fontWeight: "var(--weight-medium)" }}>
                        {e.storageName}
                      </td>
                      <td style={{ padding: "var(--space-3) var(--space-4)", color: "var(--color-text-secondary)" }}>
                        {STOCK_EVENT_LABELS[e.type] ?? e.type}
                      </td>
                      <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                        {e.productName} <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>{e.productDimension}</span>
                      </td>
                      <td style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right", fontWeight: "var(--weight-semibold)", color: deltaColor }}>
                        {deltaLabel}
                      </td>
                      <td style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right", fontWeight: "var(--weight-medium)" }}>
                        {e.quantityAfter}
                      </td>
                      <td style={{ padding: "var(--space-3) var(--space-4)", color: "var(--color-text-muted)", fontSize: "var(--text-xs)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.notes || ""}>
                        {e.notes}
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
