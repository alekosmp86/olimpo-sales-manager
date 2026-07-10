"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { StorageDTO } from "@/modules/stock/types";

interface StorageFormModalProps {
  initial?: Partial<StorageDTO>;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string }) => void;
  isLoading?: boolean;
}

export function StorageFormModal({ initial, onClose, onSubmit, isLoading }: StorageFormModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() || undefined });
  }

  return (
    <Modal isOpen={true} title={initial?.id ? "Editar depósito" : "Nuevo depósito"} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div>
          <label htmlFor="storage-name" style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", marginBottom: "var(--space-2)" }}>
            Nombre *
          </label>
          <input
            id="storage-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Depósito Central"
            required
            style={{
              width: "100%",
              padding: "var(--space-2) var(--space-3)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-sm)",
            }}
          />
        </div>
        <div>
          <label htmlFor="storage-description" style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", marginBottom: "var(--space-2)" }}>
            Descripción
          </label>
          <input
            id="storage-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opcional"
            style={{
              width: "100%",
              padding: "var(--space-2) var(--space-3)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-sm)",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={!name.trim() || isLoading}>
            {isLoading ? "Guardando..." : initial?.id ? "Guardar cambios" : "Crear depósito"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
