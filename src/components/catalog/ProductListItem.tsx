"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/Confirm";
import { MessageType } from "@/lib/constants/messageType";
import type { Product } from "@/lib/types";
import styles from "./ProductsTab.module.css";

interface ProductListItemProps {
  product: Product;
  onUpdatePrice: (id: string, price: number) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function ProductListItem({
  product,
  onUpdatePrice,
  onDelete,
  isUpdating,
  isDeleting,
}: ProductListItemProps) {
  const confirm = useConfirm();
  const [isEditing, setIsEditing] = useState(false);
  const [editPrice, setEditPrice] = useState(() => product.unitPrice.toString());

  function handleSave() {
    const priceVal = parseFloat(editPrice);
    if (isNaN(priceVal) || priceVal < 0) return;
    onUpdatePrice(product.id, priceVal);
    setIsEditing(false);
  }

  async function handleDelete() {
    if (
      await confirm({
        title: "¿Eliminar producto?",
        message: `¿Está seguro de que desea eliminar "${product.name}"? Esta acción no se puede deshacer.`,
        confirmText: "Eliminar",
        cancelText: "Cancelar",
        type: MessageType.DANGER,
      })
    ) {
      onDelete(product.id);
    }
  }

  return (
    <li className={styles.listItem}>
      <span className={styles.productName}>
        {product.name}
        <span className={styles.dim}>{product.dimension.label}</span>
      </span>
      {isEditing ? (
        <div className={styles.editRow}>
          <input
            className={styles.input}
            type="number"
            min="0"
            step="0.01"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            aria-label="Editar precio unitario del producto"
          />
          <Button
            size="sm"
            variant="primary"
            onClick={handleSave}
            loading={isUpdating}
          >
            Guardar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className={styles.itemActions}>
          <span className={styles.price}>${product.unitPrice.toFixed(2)}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsEditing(true);
              setEditPrice(product.unitPrice.toString());
            }}
          >
            Editar precio
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={handleDelete}
            loading={isDeleting}
            aria-label="Eliminar producto"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )}
    </li>
  );
}
