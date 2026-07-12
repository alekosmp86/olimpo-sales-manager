"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { StorageDTO } from "@/modules/stock/types";
import styles from "./StorageFormModal.module.css";

interface StorageFormModalProps {
  initial?: Partial<StorageDTO>;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string }) => void;
  isLoading?: boolean;
}

export function StorageFormModal({ initial, onClose, onSubmit, isLoading }: StorageFormModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() || undefined });
  }

  return (
    <Modal isOpen={true} title={initial?.id ? "Editar depósito" : "Nuevo depósito"} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div>
          <label htmlFor="storage-name" className={styles.label}>
            Nombre *
          </label>
          <input
            id="storage-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej: Depósito Central"
            required
            className={styles.input}
          />
        </div>
        <div>
          <label htmlFor="storage-description" className={styles.label}>
            Descripción
          </label>
          <input
            id="storage-description"
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Opcional"
            className={styles.input}
          />
        </div>
        <div className={styles.buttonContainer}>
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
