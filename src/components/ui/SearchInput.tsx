"use client";

import { Search } from "lucide-react";
import styles from "./SearchInput.module.css";

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  ariaLabel?: string;
  showIcon?: boolean;
  id?: string;
  testid?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  showIcon = false,
  id,
  testid,
}: SearchInputProps) {
  return (
    <div className={styles.searchWrapper}>
      {showIcon && <Search className={styles.searchIcon} size={16} />}
      <input
        id={id}
        data-testid={testid}
        type="text"
        className={[
          styles.searchInput,
          showIcon ? styles.hasIcon : "",
        ]
          .filter(Boolean)
          .join(" ")}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
      />
      {value && (
        <button
          type="button"
          data-testid={`${testid}-clearBtn`}
          className={styles.clearSearchBtn}
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
        >
          ✕
        </button>
      )}
    </div>
  );
}
