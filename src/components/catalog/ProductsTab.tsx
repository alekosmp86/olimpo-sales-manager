"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NewProductForm } from "./NewProductForm";
import { ProductListItem } from "./ProductListItem";
import { SearchInput } from "@/components/ui/SearchInput";
import { useFilter } from "@/hooks/useFilter";
import type { Product, Dimension } from "@/lib/types";
import { handleResponse } from "@/lib/utils/apiUtils";
import styles from "./ProductsTab.module.css";

export function ProductsTab() {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then((response) => handleResponse<Product[]>(response)),
  });

  const { data: dimensions = [] } = useQuery<Dimension[]>({
    queryKey: ["dimensions"],
    queryFn: () => fetch("/api/dimensions").then((response) => handleResponse<Dimension[]>(response)),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; dimensionId: string; unitPrice: number }) =>
      fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((response) => handleResponse<Product>(response)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    meta: {
      successMessage: "Producto creado con éxito",
      errorMessage: "Error al crear el producto",
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, unitPrice }: { id: string; unitPrice: number }) =>
      fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitPrice }),
      }).then((response) => handleResponse<Product>(response)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    meta: {
      successMessage: "Precio de producto actualizado",
      errorMessage: "Error al actualizar el precio",
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/products/${id}`, { method: "DELETE" }).then((response) =>
        handleResponse<void>(response)
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
    meta: {
      successMessage: "Producto eliminado con éxito",
      errorMessage: "Error al eliminar el producto",
    },
  });

  const { filter, setFilter, filteredItems: filteredProducts } = useFilter(
    products,
    (p, q) => p.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className={styles.section}>
      {/* Create form component */}
      <NewProductForm
        dimensions={dimensions}
        onCreate={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
      />

      {/* Filter Input */}
      {!isLoading && products.length > 0 && (
        <SearchInput
          value={filter}
          onChange={setFilter}
          placeholder="Buscar producto por nombre..."
          ariaLabel="Filtrar productos por nombre"
        />
      )}

      {/* List */}
      {isLoading ? (
        <p className={styles.loading}>Cargando...</p>
      ) : products.length === 0 ? (
        <p className={styles.loading}>No hay productos en el catálogo.</p>
      ) : filteredProducts.length === 0 ? (
        <p className={styles.emptySearch}>No se encontraron productos.</p>
      ) : (
        <ul className={styles.list}>
          {filteredProducts.map((p) => (
            <ProductListItem
              key={p.id}
              product={p}
              onUpdatePrice={(id, price) =>
                updateMutation.mutate({ id, unitPrice: price })
              }
              onDelete={(id) => deleteMutation.mutate(id)}
              isUpdating={updateMutation.isPending && updateMutation.variables?.id === p.id}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === p.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
