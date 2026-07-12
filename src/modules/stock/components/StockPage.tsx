"use client";

import { useState } from "react";
import { useStorages } from "@/modules/stock/hooks/useStorages";
import { Plus } from "lucide-react";
import { StockPageTab } from "@/modules/stock/constants";
import styles from "./StockPage.module.css";
import { StockLedger } from "./StockLedger";
import { StorageFormModal } from "./StorageFormModal";
import { StorageCard } from "./StorageCard";

export function StockPage() {
  const { storages, isLoading, createMutation, updateMutation, deleteMutation } = useStorages();
  const [activeTab, setActiveTab] = useState<StockPageTab>(StockPageTab.DEPOSITOS);
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
          aria-selected={activeTab === StockPageTab.DEPOSITOS}
          className={[styles.tab, activeTab === StockPageTab.DEPOSITOS ? styles.activeTab : ""].join(" ")}
          onClick={() => setActiveTab(StockPageTab.DEPOSITOS)}
        >
          Depósitos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === StockPageTab.HISTORIAL}
          className={[styles.tab, activeTab === StockPageTab.HISTORIAL ? styles.activeTab : ""].join(" ")}
          onClick={() => setActiveTab(StockPageTab.HISTORIAL)}
        >
          Historial
        </button>
      </div>

      {activeTab === StockPageTab.DEPOSITOS && (
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

      {activeTab === StockPageTab.HISTORIAL && <StockLedger />}

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
