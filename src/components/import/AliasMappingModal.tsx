"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/lib/types";
import { handleResponse } from "@/lib/utils/apiUtils";
import styles from "./AliasMappingModal.module.css";
import { useConfirm } from "@/components/ui/Confirm";
import { MessageType } from "@/lib/constants/messageType";

interface AliasMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  unmatched: string[];
  onSuccess: () => void;
}

export function AliasMappingModal({
  isOpen,
  onClose,
  unmatched,
  onSuccess,
}: AliasMappingModalProps) {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then((response) => handleResponse<Product[]>(response)),
  });

  const standardNamesSet = useMemo(() => new Set(products.map((p) => p.name)), [products]);
  const standardNames = useMemo(() => Array.from(standardNamesSet), [standardNamesSet]);

  // State mapping of each unmatched alias to either a standard name or custom brand name
  const [selections, setSelections] = useState<
    Record<string, { value: string; customName: string }>
  >(() => {
    const initial: Record<string, { value: string; customName: string }> = {};
    for (const name of unmatched) {
      initial[name] = {
        value: standardNames[0] || "__NEW__",
        customName: "",
      };
    }
    return initial;
  });

  const saveMutation = useMutation({
    mutationFn: (mappings: Array<{ alias: string; name: string }>) =>
      fetch("/api/products/alias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings }),
      }).then((response) => handleResponse<unknown>(response)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onSuccess();
      onClose();
    },
    meta: {
      successMessage: "Alias guardados con éxito",
      errorMessage: "Error al guardar los alias",
    },
  });

  async function handleSave() {
    const mappings = Object.entries(selections).map(([alias, sel]) => {
      const isNew = sel.value === "__NEW__" || !standardNamesSet.has(sel.value);
      const name = isNew ? sel.customName.trim() : sel.value;
      return { alias, name };
    });

    // Validation
    if (mappings.some((m) => !m.name)) {
      await confirm({
        title: "Atención",
        message: "Por favor, complete todos los campos de nombre para continuar.",
        onlyConfirm: true,
        confirmText: "Entendido",
        type: MessageType.WARNING,
      });
      return;
    }

    saveMutation.mutate(mappings);
  }

  function handleSelectChange(alias: string, val: string) {
    setSelections((prev) => ({
      ...prev,
      [alias]: { ...prev[alias], value: val },
    }));
  }

  function handleCustomChange(alias: string, val: string) {
    setSelections((prev) => ({
      ...prev,
      [alias]: { ...prev[alias], customName: val },
    }));
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asociar productos desconocidos"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saveMutation.isPending}
          >
            Guardar asociaciones
          </Button>
        </>
      }
    >
      <div className={styles.container}>
        <p className={styles.description}>
          Se encontraron nombres de producto en el CSV que no coinciden con
          nuestro catálogo. Por favor, asócielos a un producto existente o cree uno
          nuevo para continuar:
        </p>

        {unmatched.map((alias) => {
          const sel = selections[alias] || { value: "", customName: "" };
          const showCustomInput = sel.value === "__NEW__" || !standardNamesSet.has(sel.value);

          return (
            <div key={alias} className={styles.row}>
              <span className={styles.aliasLabel}>{alias}</span>
              <span className={styles.arrow}>➔</span>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.select}
                  value={sel.value}
                  onChange={(e) => handleSelectChange(alias, e.target.value)}
                  aria-label={`Asociar alias: ${alias}`}
                >
                  {standardNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value="__NEW__">+ Crear nuevo...</option>
                </select>

                {showCustomInput && (
                  <input
                    className={styles.customInput}
                    placeholder="Nombre del nuevo producto"
                    type="text"
                    value={sel.customName}
                    onChange={(e) => handleCustomChange(alias, e.target.value)}
                    aria-label="Nombre del nuevo producto"
                  />
                )}
              </div>
            </div>
          );
        })}

        {saveMutation.isError && (
          <p className={styles.error}>Error al guardar. Intente nuevamente.</p>
        )}
      </div>
    </Modal>
  );
}
