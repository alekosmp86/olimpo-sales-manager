"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import styles from "./ProductsModal.module.css";
import type { SaleItem, Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils/priceUtils";
import { handleResponse } from "@/lib/utils/apiUtils";
import type { StorageAvailability } from "@/modules/stock/types";

interface ProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
  items: SaleItem[];
  renderItemExtras?: (
    item: EditableItem,
    onChange: (storageId: string) => void
  ) => React.ReactNode;
}

interface EditableItem {
  keyId: string;
  productId: string;
  quantity: number | "";
  storageId?: string;
}

export function ProductsModal({ isOpen, onClose, saleId, items, renderItemExtras }: ProductsModalProps) {
  const queryClient = useQueryClient();
  const [editableItems, setEditableItems] = useState<EditableItem[]>(() =>
    items.map((item, index) => ({
      keyId: `${item.productId}-${index}`,
      productId: item.productId,
      quantity: item.quantity,
      storageId: item.reservation?.storageId ?? undefined,
    }))
  );
  const [isDirty, setIsDirty] = useState(false);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then((response) => handleResponse<Product[]>(response)),
    enabled: isOpen,
  });

  const updateMutation = useMutation({
    mutationFn: (payloadItems: Omit<EditableItem, "keyId">[]) =>
      fetch(`/api/sales/${saleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems }),
      }).then((response) => handleResponse<unknown>(response)),
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
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  function addItem() {
    if (products.length === 0) return;
    setEditableItems((prev) => [
      ...prev,
      {
        keyId: `new-${Date.now()}-${prev.length}`,
        productId: products[0].id,
        quantity: 1,
        storageId: undefined,
      }
    ]);
    setIsDirty(true);
  }

  function removeItem(index: number) {
    setEditableItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setIsDirty(true);
  }

  function updateItem(index: number, field: keyof EditableItem, value: string | number | "") {
    setEditableItems((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
    setIsDirty(true);
  }

  function handleSave() {
    const valid = editableItems.flatMap((editableItem) => {
      const numericQuantity = typeof editableItem.quantity === "number" ? editableItem.quantity : 0;
      if (!editableItem.productId || numericQuantity <= 0) return [];

      let storageId = editableItem.storageId;
      if (!storageId) {
        const availabilities = queryClient.getQueryData<StorageAvailability[]>([
          "stock",
          "lines",
          "product",
          editableItem.productId,
        ]);
        if (availabilities && availabilities.length > 0) {
          storageId = availabilities[0].storageId;
        }
      }

      return [{ productId: editableItem.productId, quantity: numericQuantity, storageId }];
    });
    updateMutation.mutate(valid);
  }

  const total = editableItems.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    const numericQuantity = typeof item.quantity === "number" ? item.quantity : 0;
    return sum + (product ? product.unitPrice * numericQuantity : 0);
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
          const numericQuantity = typeof item.quantity === "number" ? item.quantity : 0;
          const lineTotal = product ? product.unitPrice * numericQuantity : 0;

          return (
            <div key={item.keyId} className={styles.row}>
              <div className={styles.coreRow}>
                <div className={styles.selectWrapper}>
                  <label htmlFor={`product-select-${item.keyId}`} className={styles.label}>Producto</label>
                  <select
                    id={`product-select-${item.keyId}`}
                    className={styles.select}
                    value={item.productId}
                    onChange={(event) => updateItem(index, "productId", event.target.value)}
                  >
                    {products.map((pItem) => (
                      <option key={pItem.id} value={pItem.id}>
                        {pItem.name} {pItem.dimension.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.qtyWrapper}>
                  <span className={styles.label}>Cantidad</span>
                  <Stepper
                    value={item.quantity}
                    min={1}
                    onChange={(newValue) => updateItem(index, "quantity", newValue)}
                    ariaLabel={`Cantidad de ${product ? product.name : "producto"}`}
                  />
                </div>

                <div className={styles.priceWrapper}>
                  <span className={styles.label}>Total</span>
                  <span className={styles.price}>{formatPrice(lineTotal)}</span>
                </div>

                <button
                  className={styles.removeBtn}
                  onClick={() => removeItem(index)}
                  type="button"
                  aria-label="Eliminar producto"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {renderItemExtras && (
                <div className={styles.extrasRow}>
                  {renderItemExtras(item, (storageId) =>
                    updateItem(index, "storageId", storageId)
                  )}
                </div>
              )}
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
