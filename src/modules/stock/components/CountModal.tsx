"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table } from "@/components/ui/Table";
import type { StorageDTO, StockLineDTO, CountWarning } from "@/modules/stock/types";
import type { Product } from "@/lib/types";
import { handleResponse } from "@/lib/utils/apiUtils";
import { useConfirm } from "@/components/ui/Confirm";
import styles from "./CountModal.module.css";

interface CountModalProps {
  storage: StorageDTO;
  currentLines: StockLineDTO[];
  onClose: () => void;
}

export function CountModal({ storage, currentLines, onClose }: CountModalProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState("");
  const confirm = useConfirm();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then((response) => response.json()),
  });

  // Map product IDs to their current physical stock quantity
  const currentStockMap = useMemo(() => {
    return new Map(currentLines.map((line) => [line.productId, line.quantity]));
  }, [currentLines]);

  // Track the user's manual inputs
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    currentLines.forEach((line) => {
      initial[line.productId] = line.quantity;
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
      }).then((response) => handleResponse<{ ok: boolean; warnings: CountWarning[] }>(response)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      if (data.warnings && data.warnings.length > 0) {
        const warningMsg = data.warnings
          .map((warning) => `- ${warning.productName}: se fijó en ${warning.newQuantity} pero hay ${warning.reserved} reservadas.`)
          .join("\n");
        confirm({
          title: "Advertencia",
          message: `Conteo guardado con advertencias de reservas afectadas:\n\n${warningMsg}`,
          onlyConfirm: true,
          type: "warning",
        });
      }
      onClose();
    },
    meta: {
      successMessage: "Conteo físico registrado con éxito",
      errorMessage: "Error al guardar el conteo físico",
    },
  });

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  function handleQuantityChange(productId: string, value: string) {
    const parsed = parseInt(value, 10);
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

  const columns = useMemo(() => [
    {
      header: "Producto",
      render: (product: Product) => (
        <>
          {product.name}{" "}
          <span className={styles.productDimension}>
            {product.dimension.label}
          </span>
        </>
      ),
    },
    {
      header: "Stock actual",
      className: styles.tdCurrentStock,
      render: (product: Product) => currentStockMap.get(product.id) ?? 0,
    },
    {
      header: "Nuevo conteo",
      className: styles.tdNewCount,
      render: (product: Product) => (
        <input
          type="number"
          min="0"
          value={quantities[product.id] ?? 0}
          onChange={(event) => handleQuantityChange(product.id, event.target.value)}
          aria-label={`Nuevo conteo para ${product.name} ${product.dimension.label}`}
          className={styles.quantityInput}
        />
      ),
    },
  ], [currentStockMap, quantities]);

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
      <div className={styles.container}>
        <SearchInput
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={setSearchTerm}
          showIcon={true}
        />

        <Table
          items={filteredProducts}
          columns={columns}
          emptyMessage="No se encontraron productos"
          keyExtractor={(product) => product.id}
        />

        <div>
          <label htmlFor="count-notes" className={styles.notesLabel}>
            Notas / Motivo del conteo
          </label>
          <textarea
            id="count-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Opcional. Ej: Conteo mensual de inventario"
            className={styles.notesTextarea}
          />
        </div>
      </div>
    </Modal>
  );
}
