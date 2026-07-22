"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table } from "@/components/ui/Table";
import type { StorageDTO, StockLineDTO } from "@/modules/stock/types";
import styles from "./StorageDetailsModal.module.css";

interface StorageDetailsModalProps {
  storage: StorageDTO;
  lines: StockLineDTO[];
  onClose: () => void;
}

export function StorageDetailsModal({ storage, lines, onClose }: StorageDetailsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLines = useMemo(() => {
    return lines.filter((line) =>
      line.product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [lines, searchTerm]);

  const columns = useMemo(() => [
    {
      header: "Producto",
      render: (line: StockLineDTO) => (
        <>
          {line.product.name}{" "}
          <span className={styles.productDimension}>
            {line.product.dimension.label}
          </span>
        </>
      ),
    },
    {
      header: "Reservado",
      className: styles.tdRight,
      render: (line: StockLineDTO) =>
        line.reserved > 0 ? (
          <span className={styles.reserved}>{line.reserved} un.</span>
        ) : (
          "—"
        ),
    },
    {
      header: "Disponible",
      className: styles.tdRight,
      render: (line: StockLineDTO) => `${line.quantity - line.reserved} un.`,
    },
    {
      header: "Físico",
      className: styles.tdRight,
      render: (line: StockLineDTO) => <strong>{line.quantity} un.</strong>,
    },
  ], []);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Detalle de Stock: ${storage.name}`}
      size="md"
      footer={
        <Button variant="primary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className={styles.container}>
        <SearchInput
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={setSearchTerm}
          showIcon={true}
        />

        <Table
          items={filteredLines}
          columns={columns}
          emptyMessage="No se encontraron productos en stock"
          keyExtractor={(line) => line.id}
          scrollable={true}
        />
      </div>
    </Modal>
  );
}
