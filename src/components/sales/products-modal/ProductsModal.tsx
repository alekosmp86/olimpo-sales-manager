"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import styles from "./ProductsModal.module.css";
import type { SaleItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils/priceUtils";
import { useProductsModal, type EditableItem } from "./useProductsModal";

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

export function ProductsModal({ isOpen, onClose, saleId, items, renderItemExtras }: ProductsModalProps) {
  const {
    editableItems,
    products,
    isDirty,
    isSaving,
    isError,
    productMap,
    addItem,
    removeItem,
    updateItem,
    handleProductChange,
    handleSave,
    total,
  } = useProductsModal({ isOpen, onClose, saleId, items });

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
            loading={isSaving}
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
          const currentPrice = typeof item.unitPrice === "number" ? item.unitPrice : (product?.unitPrice ?? 0);
          const qty = typeof item.quantity === "number" ? item.quantity : 0;
          const lineTotal = currentPrice * qty;

          return (
            <div key={item.keyId} className={styles.row}>
              <button
                className={styles.removeBtn}
                onClick={() => removeItem(index)}
                type="button"
                aria-label="Eliminar producto"
              >
                ✕
              </button>
              <div className={styles.coreRow}>
                <div className={styles.selectWrapper}>
                  <label htmlFor={`product-select-${item.keyId}`} className={styles.label}>Producto</label>
                  <select
                    id={`product-select-${item.keyId}`}
                    className={styles.select}
                    value={item.productId}
                    onChange={(e) => handleProductChange(index, e.target.value)}
                  >
                    {products.map((productOption) => (
                      <option key={productOption.id} value={productOption.id}>
                        {productOption.name} {productOption.dimension.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.qtyWrapper}>
                  <span className={styles.label}>Cantidad</span>
                  <Stepper
                    value={item.quantity}
                    min={1}
                    step={1}
                    onChange={(val) => updateItem(index, "quantity", val)}
                    ariaLabel="Cantidad"
                  />
                </div>

                <div className={styles.unitPriceWrapper}>
                  <span className={styles.label}>Precio Unit.</span>
                  <Stepper
                    value={item.unitPrice !== undefined ? item.unitPrice : ""}
                    min={0.01}
                    step={50}
                    onChange={(val) => updateItem(index, "unitPrice", val)}
                    ariaLabel="Precio Unitario"
                  />
                </div>

                <div className={styles.priceWrapper}>
                  <span className={styles.label}>Total</span>
                  <span className={styles.price}>{formatPrice(lineTotal)}</span>
                </div>
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

        {isError && (
          <p className={styles.error}>Error al guardar. Intente nuevamente.</p>
        )}
      </div>
    </Modal>
  );
}
