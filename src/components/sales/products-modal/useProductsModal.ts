import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SaleItem, Product } from "@/lib/types";
import type { StorageAvailability } from "@/modules/stock/types";

export interface EditableItem {
  keyId: string;
  productId: string;
  quantity: number | "";
  storageId?: string;
  unitPrice?: number | "";
}

interface UseProductsModalParams {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
  items: SaleItem[];
}

export function useProductsModal({
  isOpen,
  onClose,
  saleId,
  items,
}: UseProductsModalParams) {
  const queryClient = useQueryClient();

  const [editableItems, setEditableItems] = useState<EditableItem[]>(() =>
    items.map((item, index) => ({
      keyId: `${item.productId}-${index}`,
      productId: item.productId,
      quantity: item.quantity,
      storageId: item.reservation?.storageId ?? undefined,
      unitPrice: item.unitPrice,
    }))
  );
  const [isDirty, setIsDirty] = useState(false);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then((response) => response.json()),
    enabled: isOpen,
  });

  const updateMutation = useMutation({
    mutationFn: (items: Omit<EditableItem, "keyId">[]) =>
      fetch(`/api/sales/${saleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }).then((response) => response.json()),
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
        unitPrice: products[0].unitPrice,
      }
    ]);
    setIsDirty(true);
  }

  function removeItem(index: number) {
    setEditableItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setIsDirty(true);
  }

  function updateItem(index: number, field: keyof EditableItem, value: any) {
    setEditableItems((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
    setIsDirty(true);
  }

  function handleProductChange(index: number, newProdId: string) {
    const newProduct = productMap.get(newProdId);
    setEditableItems((prev) =>
      prev.map((itemVal, itemIndex) =>
        itemIndex === index
          ? {
              ...itemVal,
              productId: newProdId,
              unitPrice: newProduct?.unitPrice ?? 0,
            }
          : itemVal
      )
    );
    setIsDirty(true);
  }

  function handleSave() {
    const valid = editableItems.flatMap((item) => {
      if (!item.productId) return [];
      const quantity = typeof item.quantity === "number" ? item.quantity : 0;
      if (quantity <= 0) return [];

      let storageId = item.storageId;
      if (!storageId) {
        const availabilities = queryClient.getQueryData<StorageAvailability[]>([
          "stock",
          "lines",
          "product",
          item.productId,
        ]);
        if (availabilities && availabilities.length > 0) {
          storageId = availabilities[0].storageId;
        }
      }

      const unitPrice = typeof item.unitPrice === "number" ? item.unitPrice : 0;

      return [{
        productId: item.productId,
        quantity,
        storageId,
        unitPrice,
      }];
    });
    updateMutation.mutate(valid);
  }

  const total = editableItems.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    const price = typeof item.unitPrice === "number" ? item.unitPrice : (product?.unitPrice ?? 0);
    const qty = typeof item.quantity === "number" ? item.quantity : 0;
    return sum + (price * qty);
  }, 0);

  return {
    editableItems,
    products,
    isDirty,
    isSaving: updateMutation.isPending,
    isError: updateMutation.isError,
    productMap,
    addItem,
    removeItem,
    updateItem,
    handleProductChange,
    handleSave,
    total,
  };
}
