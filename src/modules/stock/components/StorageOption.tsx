import styles from "./StorageOption.module.css";

interface StorageOptionProps {
  storageName: string;
  available: number;
  quantity: number;
}

export function StorageOption({
  storageName,
  available,
  quantity,
}: StorageOptionProps) {
  return (
    <div className={styles.optionContainer}>
      <span className={styles.optionName} title={storageName}>
        {storageName}
      </span>
      <span className={styles.optionStock}>
        <span className={styles.stockLabel}>Disp: </span>
        <span className={styles.stockValue}>{available} u.</span>
        <span className={styles.stockDivider}>/</span>
        <span className={styles.stockLabel}>Fís: </span>
        <span className={styles.stockValue}>{quantity} u.</span>
      </span>
    </div>
  );
}
