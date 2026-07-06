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
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  showIcon = false,
  id,
}: SearchInputProps) {
  return (
    <div className={styles.searchWrapper}>
      {showIcon && <Search className={styles.searchIcon} size={16} />}
      <input
        id={id}
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
