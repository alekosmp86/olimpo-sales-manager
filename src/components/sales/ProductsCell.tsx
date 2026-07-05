import styles from "./ProductsCell.module.css";
import type { SaleItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils/priceUtils";

interface ProductsCellProps {
  items?: SaleItem[];
  onClick: () => void;
}

const EMPTY_ITEMS: SaleItem[] = [];

export function ProductsCell({ items = EMPTY_ITEMS, onClick }: ProductsCellProps) {
  const safeItems = items ?? [];
  if (safeItems.length === 0) {
    return (
      <button type="button" className={styles.emptyCell} onClick={onClick}>
        <span className={styles.emptyLabel}>+ Agregar productos</span>
      </button>
    );
  }

  return (
    <button type="button" className={styles.cell} onClick={onClick}>
      <ul className={styles.list}>
        {safeItems.map((item) => {
          if (!item || !item.product) return null;
          const label = item.product.dimension?.label ?? "";
          const totalPrice = item.totalPrice ?? (item.quantity * (item.product.unitPrice ?? 0));
          return (
            <li key={item.id} className={styles.item}>
              <span className={styles.name}>
                {item.product.name}
                {label && <span className={styles.dim}>{label}</span>}
              </span>
              <span className={styles.meta}>
                {item.quantity} u. · {formatPrice(totalPrice)}
              </span>
            </li>
          );
        })}
      </ul>
    </button>
  );
}
