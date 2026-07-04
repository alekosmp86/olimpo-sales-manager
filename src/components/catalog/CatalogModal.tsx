"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ProductsTab } from "./ProductsTab";
import { DimensionsTab } from "./DimensionsTab";
import styles from "./CatalogModal.module.css";

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "products" | "dimensions";

export function CatalogModal({ isOpen, onClose }: CatalogModalProps) {
  const [tab, setTab] = useState<Tab>("products");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Catálogo de productos" size="lg">
      <div className={styles.tabs}>
        <button
          className={[styles.tab, tab === "products" ? styles.activeTab : ""].join(" ")}
          onClick={() => setTab("products")}
        >
          Productos
        </button>
        <button
          className={[styles.tab, tab === "dimensions" ? styles.activeTab : ""].join(" ")}
          onClick={() => setTab("dimensions")}
        >
          Dimensiones
        </button>
      </div>

      {tab === "products" ? <ProductsTab /> : <DimensionsTab />}
    </Modal>
  );
}
