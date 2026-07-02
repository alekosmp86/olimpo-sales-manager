import styles from "./ProductsCell.module.css";
import type { SaleItem } from "@/lib/types";

interface ProductsCellProps {
  items: SaleItem[];
  onClick: () => void;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(n);
}

export function ProductsCell({ items, onClick }: ProductsCellProps) {
  if (items.length === 0) {
    return (
      <button className={styles.emptyCell} onClick={onClick}>
        <span className={styles.emptyLabel}>+ Agregar productos</span>
      </button>
    );
  }

  return (
    <button className={styles.cell} onClick={onClick}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <span className={styles.name}>
              {item.product.name}
              <span className={styles.dim}>{item.product.dimension.label}</span>
            </span>
            <span className={styles.meta}>
              {item.quantity} u. · {formatPrice(item.totalPrice)}
            </span>
          </li>
        ))}
      </ul>
    </button>
  );
}
