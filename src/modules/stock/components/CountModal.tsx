"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Search } from "lucide-react";
import type { StorageDTO, StockLineDTO } from "@/modules/stock/types";
import type { Product } from "@/lib/types";
import { handleResponse } from "@/lib/utils/apiUtils";

interface CountModalProps {
  storage: StorageDTO;
  currentLines: StockLineDTO[];
  onClose: () => void;
}

export function CountModal({ storage, currentLines, onClose }: CountModalProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState("");

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then((r) => r.json()),
  });

  // Map product IDs to their current physical stock quantity
  const currentStockMap = useMemo(() => {
    return new Map(currentLines.map((l) => [l.productId, l.quantity]));
  }, [currentLines]);

  // Track the user's manual inputs
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    currentLines.forEach((l) => {
      initial[l.productId] = l.quantity;
    });
    return initial;
  });

  const countMutation = useMutation({
    mutationFn: (data: {
      storageId: string;
      entries: { productId: string; quantity: number }[];
      notes?: string;
    }) =>
      fetch("/api/stock/count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => handleResponse<{ ok: boolean; warnings: any[] }>(r)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      if (data.warnings && data.warnings.length > 0) {
        const warningMsg = data.warnings
          .map((w) => `- ${w.productName}: se fijó en ${w.newQuantity} pero hay ${w.reserved} reservadas.`)
          .join("\n");
        alert(
          `Conteo guardado con advertencias de reservas afectadas:\n\n${warningMsg}`
        );
      }
      onClose();
    },
    meta: {
      successMessage: "Conteo físico registrado con éxito",
      errorMessage: "Error al guardar el conteo físico",
    },
  });

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  function handleQuantityChange(productId: string, val: string) {
    const parsed = parseInt(val, 10);
    setQuantities((prev) => ({
      ...prev,
      [productId]: isNaN(parsed) || parsed < 0 ? 0 : parsed,
    }));
  }

  function handleSave() {
    // Only send entries that have been defined/edited or have non-zero stock
    const entries = Object.entries(quantities).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    countMutation.mutate({
      storageId: storage.id,
      entries,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Conteo Físico: ${storage.name}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={countMutation.isPending}
          >
            Guardar Conteo
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "var(--space-3)",
              color: "var(--color-text-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "var(--space-2) var(--space-3) var(--space-2) var(--space-10)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-sm)",
            }}
          />
        </div>

        <div
          style={{
            maxHeight: "350px",
            overflowY: "auto",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "var(--text-sm)",
            }}
          >
            <thead>
              <tr style={{ background: "var(--color-surface-2)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "var(--space-2) var(--space-3)", textAlign: "left" }}>Producto</th>
                <th style={{ padding: "var(--space-2) var(--space-3)", textAlign: "right", width: "120px" }}>Stock actual</th>
                <th style={{ padding: "var(--space-2) var(--space-3)", textAlign: "right", width: "140px" }}>Nuevo conteo</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: "var(--space-4)", textAlign: "center", color: "var(--color-text-muted)" }}>
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const currentQty = currentStockMap.get(p.id) ?? 0;
                  const newQty = quantities[p.id] ?? 0;

                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "var(--space-2) var(--space-3)" }}>
                        {p.name} <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>{p.dimension.label}</span>
                      </td>
                      <td style={{ padding: "var(--space-2) var(--space-3)", textAlign: "right", color: "var(--color-text-secondary)" }}>
                        {currentQty}
                      </td>
                      <td style={{ padding: "var(--space-2) var(--space-3)", textAlign: "right" }}>
                        <input
                          type="number"
                          min="0"
                          value={newQty}
                          onChange={(e) => handleQuantityChange(p.id, e.target.value)}
                          aria-label={`Nuevo conteo para ${p.name} ${p.dimension.label}`}
                          style={{
                            width: "70px",
                            textAlign: "right",
                            padding: "4px",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                          }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div>
          <label htmlFor="count-notes" style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", marginBottom: "var(--space-1)" }}>
            Notas / Motivo del conteo
          </label>
          <textarea
            id="count-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional. Ej: Conteo mensual de inventario"
            style={{
              width: "100%",
              height: "60px",
              padding: "var(--space-2) var(--space-3)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-sm)",
              resize: "none",
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
