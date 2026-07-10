"use client";

import { useState } from "react";
import { useStorages } from "@/modules/stock/hooks/useStorages";
import { Plus } from "lucide-react";
import styles from "./StockPage.module.css";
import { StockLedger } from "./StockLedger";
import { StorageFormModal } from "./StorageFormModal";
import { StorageCard } from "./StorageCard";

type Tab = "depositos" | "historial";

export function StockPage() {
  const { storages, isLoading, createMutation, updateMutation, deleteMutation } = useStorages();
  const [activeTab, setActiveTab] = useState<Tab>("depositos");
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Stock</h1>
          <p className={styles.subtitle}>
            Gestión de inventario por depósito
          </p>
        </div>
      </div>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "depositos"}
          className={[styles.tab, activeTab === "depositos" ? styles.activeTab : ""].join(" ")}
          onClick={() => setActiveTab("depositos")}
        >
          Depósitos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "historial"}
          className={[styles.tab, activeTab === "historial" ? styles.activeTab : ""].join(" ")}
          onClick={() => setActiveTab("historial")}
        >
          Historial
        </button>
      </div>

      {activeTab === "depositos" && (
        <>
          {isLoading ? (
            <p className={styles.emptyState}>Cargando depósitos...</p>
          ) : (
            <div className={styles.storageGrid}>
              {storages.map((storage) => (
                <StorageCard
                  key={storage.id}
                  storage={storage}
                  onUpdate={(data) => updateMutation.mutate({ id: storage.id, data })}
                  onDelete={() => deleteMutation.mutate(storage.id)}
                />
              ))}

              <button
                type="button"
                className={styles.addBtn}
                onClick={() => setShowCreateModal(true)}
                aria-label="Agregar depósito"
              >
                <Plus size={18} />
                Nuevo depósito
              </button>
            </div>
          )}

          {storages.length === 0 && !isLoading && (
            <p className={styles.emptyState}>
              No hay depósitos. Crea uno para comenzar a gestionar tu stock.
            </p>
          )}
        </>
      )}

      {activeTab === "historial" && <StockLedger />}

      {showCreateModal && (
        <StorageFormModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => {
            createMutation.mutate(data, {
              onSuccess: () => setShowCreateModal(false),
            });
          }}
          isLoading={createMutation.isPending}
        />
      )}
    </main>
  );
}
