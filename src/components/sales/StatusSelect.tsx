"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/classNames";
import { useAutoDirection } from "@/hooks/useAutoDirection";
import styles from "./StatusSelect.module.css";

export interface StatusSelectProps {
  value: string;
  options: string[];
  labelMap: Record<string, string>;
  colorMap: Record<string, string>;
  onChange: (newValue: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable, atomic status select dropdown component.
 * Automatically calculates whether to open upward or downward based on viewport space.
 */
export function StatusSelect({
  value,
  options,
  labelMap,
  colorMap,
  onChange,
  disabled,
  className,
}: StatusSelectProps) {
  const { containerRef, isOpen, showUpward, toggleOpen, closeDropdown } = useAutoDirection(180);

  const currentLabel = labelMap[value] ?? value;

  return (
    <div className={cn(styles.wrapper, className)} ref={containerRef}>
      <button
        className={cn(styles.trigger, styles[colorMap[value] ?? "gray"])}
        onClick={toggleOpen}
        disabled={disabled}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={currentLabel}
      >
        <span className={styles.label}>{currentLabel}</span>
        {!disabled && <ChevronDown size={12} className={styles.chevron} />}
      </button>

      {isOpen && (
        <div
          className={cn(styles.dropdown, showUpward && styles.dropdownUpward)}
          role="listbox"
        >
          {options.map((optionValue) => (
            <div
              key={optionValue}
              className={cn(
                styles.option,
                optionValue === value && styles.active,
                styles[colorMap[optionValue] ?? "gray"]
              )}
              role="option"
              tabIndex={-1}
              aria-selected={optionValue === value}
              onClick={() => {
                onChange(optionValue);
                closeDropdown();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onChange(optionValue);
                  closeDropdown();
                }
              }}
            >
              {labelMap[optionValue] ?? optionValue}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
