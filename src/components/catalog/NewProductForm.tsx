"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Dimension } from "@/lib/types";
import styles from "./ProductsTab.module.css";

interface NewProductFormProps {
  dimensions: Dimension[];
  onCreate: (data: { name: string; dimensionId: string; unitPrice: number }) => void;
  isPending: boolean;
}

export function NewProductForm({ dimensions, onCreate, isPending }: NewProductFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState("");
  const [dimensionId, setDimensionId] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    const unitPrice = parseFloat(price);
    if (!name.trim() || !dimensionId || isNaN(unitPrice) || unitPrice <= 0) {
      setError("Complete todos los campos con valores válidos.");
      return;
    }
    setError("");
    onCreate({ name: name.trim(), dimensionId, unitPrice });
    setName("");
    setDimensionId("");
    setPrice("");
  }

  return (
    <div className={styles.createForm}>
      <button
        type="button"
        className={styles.formHeader}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <h3 className={styles.sectionTitle}>Nuevo producto</h3>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded && (
        <div className={styles.formContent}>
          <div className={styles.formRow}>
            <input
              className={styles.input}
              placeholder="Nombre (ej: Ozempic)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Nombre del nuevo producto"
            />
            <select
              className={styles.select}
              value={dimensionId}
              onChange={(e) => setDimensionId(e.target.value)}
              aria-label="Dimensión del nuevo producto"
            >
              <option value="">Dimensión...</option>
              {dimensions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
            <input
              className={styles.input}
              placeholder="Precio unitario"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-label="Precio unitario del nuevo producto"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              loading={isPending}
            >
              Agregar
            </Button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      )}
    </div>
  );
}
