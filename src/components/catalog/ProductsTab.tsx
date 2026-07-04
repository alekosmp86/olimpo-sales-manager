"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/Confirm";
import { MessageType } from "@/lib/constants/messageType";
import type { Product, Dimension } from "@/lib/types";
import styles from "./ProductsTab.module.css";

export function ProductsTab() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [newName, setNewName] = useState("");
  const [newDimId, setNewDimId] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [error, setError] = useState("");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then((r) => r.json()),
  });

  const { data: dimensions = [] } = useQuery<Dimension[]>({
    queryKey: ["dimensions"],
    queryFn: () => fetch("/api/dimensions").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; dimensionId: string; unitPrice: number }) =>
      fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error);
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setNewName("");
      setNewDimId("");
      setNewPrice("");
      setError("");
    },
    onError: (e: Error) => setError(e.message),
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
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditId(null);
    },
    meta: {
      successMessage: "Precio de producto actualizado",
      errorMessage: "Error al actualizar el precio",
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/products/${id}`, { method: "DELETE" }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error);
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
    onError: (e: Error) => setError(e.message),
    meta: {
      successMessage: "Producto eliminado con éxito",
      errorMessage: "Error al eliminar el producto",
    },
  });

  function handleCreate() {
    const price = parseFloat(newPrice);
    if (!newName.trim() || !newDimId || isNaN(price) || price <= 0) {
      setError("Complete todos los campos con valores válidos.");
      return;
    }
    createMutation.mutate({ name: newName.trim(), dimensionId: newDimId, unitPrice: price });
  }

  return (
    <div className={styles.section}>
      {/* Create form */}
      <div className={styles.createForm}>
        <h3 className={styles.sectionTitle}>Nuevo producto</h3>
        <div className={styles.formRow}>
          <input
            className={styles.input}
            placeholder="Nombre (ej: Ozempic)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <select
            className={styles.select}
            value={newDimId}
            onChange={(e) => setNewDimId(e.target.value)}
          >
            <option value="">Dimensión...</option>
            {dimensions.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
          <input
            className={styles.input}
            placeholder="Precio unitario"
            type="number"
            min="0"
            step="0.01"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
            loading={createMutation.isPending}
          >
            Agregar
          </Button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>

      {/* List */}
      {isLoading ? (
        <p className={styles.loading}>Cargando...</p>
      ) : (
        <ul className={styles.list}>
          {products.map((p) => (
            <li key={p.id} className={styles.listItem}>
              <span className={styles.productName}>
                {p.name}
                <span className={styles.dim}>{p.dimension.label}</span>
              </span>
              {editId === p.id ? (
                <div className={styles.editRow}>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      updateMutation.mutate({
                        id: p.id,
                        unitPrice: parseFloat(editPrice),
                      })
                    }
                    loading={updateMutation.isPending}
                  >
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className={styles.itemActions}>
                  <span className={styles.price}>
                    ${p.unitPrice.toFixed(2)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditId(p.id);
                      setEditPrice(p.unitPrice.toString());
                    }}
                  >
                    Editar precio
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      if (await confirm({
                        title: "¿Eliminar producto?",
                        message: `¿Está seguro de que desea eliminar "${p.name}"? Esta acción no se puede deshacer.`,
                        confirmText: "Eliminar",
                        cancelText: "Cancelar",
                        type: MessageType.DANGER,
                      })) {
                        deleteMutation.mutate(p.id);
                      }
                    }}
                    loading={deleteMutation.isPending}
                    aria-label="Eliminar producto"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
