"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import styles from "./ProductsModal.module.css";
import type { SaleItem, Product } from "@/lib/types";

interface ProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
  items: SaleItem[];
}

interface EditableItem {
  productId: string;
  quantity: number;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(n);
}

export function ProductsModal({ isOpen, onClose, saleId, items }: ProductsModalProps) {
  const queryClient = useQueryClient();
  const [editableItems, setEditableItems] = useState<EditableItem[]>(() =>
    items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
  );
  const [isDirty, setIsDirty] = useState(false);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then((r) => r.json()),
    enabled: isOpen,
  });

  const updateMutation = useMutation({
    mutationFn: (items: EditableItem[]) =>
      fetch(`/api/sales/${saleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setIsDirty(false);
      onClose();
    },
    meta: {
      successMessage: "Productos actualizados con éxito",
      errorMessage: "Error al actualizar los productos",
    },
  });

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  function addItem() {
    if (products.length === 0) return;
    setEditableItems((prev) => [...prev, { productId: products[0].id, quantity: 1 }]);
    setIsDirty(true);
  }

  function removeItem(index: number) {
    setEditableItems((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }

  function updateItem(index: number, field: keyof EditableItem, value: string | number) {
    setEditableItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
    setIsDirty(true);
  }

  function handleSave() {
    const valid = editableItems.filter((i) => i.productId && i.quantity > 0);
    updateMutation.mutate(valid);
  }

  const total = editableItems.reduce((sum, item) => {
    const p = productMap.get(item.productId);
    return sum + (p ? p.unitPrice * item.quantity : 0);
  }, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Productos de la venta"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={updateMutation.isPending}
            disabled={!isDirty}
          >
            Guardar
          </Button>
        </>
      }
    >
      <div className={styles.container}>
        {editableItems.length === 0 && (
          <p className={styles.empty}>No hay productos. Agregue uno.</p>
        )}

        {editableItems.map((item, index) => {
          const product = productMap.get(item.productId);
          const lineTotal = product ? product.unitPrice * item.quantity : 0;

          return (
            <div key={index} className={styles.row}>
              <div className={styles.selectWrapper}>
                <label className={styles.label}>Producto</label>
                <select
                  className={styles.select}
                  value={item.productId}
                  onChange={(e) => updateItem(index, "productId", e.target.value)}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.dimension.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.qtyWrapper}>
                <label className={styles.label}>Cantidad</label>
                <input
                  className={styles.qtyInput}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", parseInt(e.target.value, 10) || 1)
                  }
                />
              </div>

              <div className={styles.priceWrapper}>
                <label className={styles.label}>Total</label>
                <span className={styles.price}>{formatPrice(lineTotal)}</span>
              </div>

              <button
                className={styles.removeBtn}
                onClick={() => removeItem(index)}
                type="button"
                aria-label="Eliminar producto"
              >
                ✕
              </button>
            </div>
          );
        })}

        <Button variant="ghost" size="sm" onClick={addItem} className={styles.addBtn}>
          + Agregar producto
        </Button>

        {editableItems.length > 0 && (
          <div className={styles.totalRow}>
            <span>Total de la venta</span>
            <strong>{formatPrice(total)}</strong>
          </div>
        )}

        {updateMutation.isError && (
          <p className={styles.error}>Error al guardar. Intente nuevamente.</p>
        )}
      </div>
    </Modal>
  );
}
