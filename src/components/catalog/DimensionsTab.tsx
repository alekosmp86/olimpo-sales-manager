"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/Confirm";
import { MessageType } from "@/lib/constants/messageType";
import type { Dimension } from "@/lib/types";
import styles from "./CatalogModal.module.css";

export function DimensionsTab() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [newLabel, setNewLabel] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [error, setError] = useState("");

  const { data: dimensions = [], isLoading } = useQuery<Dimension[]>({
    queryKey: ["dimensions"],
    queryFn: () => fetch("/api/dimensions").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (label: string) =>
      fetch("/api/dimensions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error);
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dimensions"] });
      setNewLabel("");
      setError("");
    },
    onError: (e: Error) => setError(e.message),
    meta: {
      successMessage: "Dimensión creada con éxito",
      errorMessage: "Error al crear la dimensión",
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) =>
      fetch(`/api/dimensions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dimensions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditId(null);
    },
    meta: {
      successMessage: "Dimensión actualizada con éxito",
      errorMessage: "Error al actualizar la dimensión",
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dimensions/${id}`, { method: "DELETE" }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error);
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dimensions"] });
    },
    onError: (e: Error) => setError(e.message),
    meta: {
      successMessage: "Dimensión eliminada con éxito",
      errorMessage: "Error al eliminar la dimensión",
    },
  });

  return (
    <div className={styles.section}>
      <div className={styles.createForm}>
        <h3 className={styles.sectionTitle}>Nueva dimensión</h3>
        <div className={styles.formRow}>
          <input
            className={styles.input}
            placeholder="Etiqueta (ej: 2.5mg)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createMutation.mutate(newLabel)}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => createMutation.mutate(newLabel)}
            loading={createMutation.isPending}
          >
            Agregar
          </Button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>

      {isLoading ? (
        <p className={styles.loading}>Cargando...</p>
      ) : (
        <ul className={styles.list}>
          {dimensions.map((d) => (
            <li key={d.id} className={styles.listItem}>
              {editId === d.id ? (
                <div className={styles.editRow}>
                  <input
                    className={styles.input}
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => updateMutation.mutate({ id: d.id, label: editLabel })}
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
                  <span className={styles.dimLabel}>{d.label}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditId(d.id);
                      setEditLabel(d.label);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      if (await confirm({
                        title: "¿Eliminar dimensión?",
                        message: `¿Está seguro de que desea eliminar "${d.label}"? Esto podría afectar a los productos asociados. Esta acción no se puede deshacer.`,
                        confirmText: "Eliminar",
                        cancelText: "Cancelar",
                        type: MessageType.DANGER,
                      })) {
                        deleteMutation.mutate(d.id);
                      }
                    }}
                    loading={deleteMutation.isPending}
                    aria-label="Eliminar dimensión"
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
