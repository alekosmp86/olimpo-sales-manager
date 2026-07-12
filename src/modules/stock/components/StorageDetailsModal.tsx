"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
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

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={styles.th}>Producto</th>
                <th className={styles.thRight}>Reservado</th>
                <th className={styles.thRight}>Disponible</th>
                <th className={styles.thRight}>Físico</th>
              </tr>
            </thead>
            <tbody>
              {filteredLines.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.noProducts}>
                    No se encontraron productos en stock
                  </td>
                </tr>
              ) : (
                filteredLines.map((line) => {
                  const available = line.quantity - line.reserved;
                  return (
                    <tr key={line.id} className={styles.tableRow}>
                      <td className={styles.td}>
                        {line.product.name} <span className={styles.productDimension}>{line.product.dimension.label}</span>
                      </td>
                      <td className={styles.tdRight}>
                        {line.reserved > 0 ? (
                          <span className={styles.reserved}>{line.reserved} un.</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className={styles.tdRight}>{available} un.</td>
                      <td className={styles.tdRight}>
                        <strong>{line.quantity} un.</strong>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
