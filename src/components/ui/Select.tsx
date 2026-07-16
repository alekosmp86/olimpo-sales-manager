"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string | React.ReactNode;
  disabled?: boolean;
}

interface SelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

export function Select({
  id,
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleToggle() {
    if (disabled) return;
    const nextIsOpen = !isOpen;
    if (nextIsOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 180 && rect.top > spaceBelow);
    }
    setIsOpen(nextIsOpen);
  }

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    setIsOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${disabled ? styles.disabled : ""} ${isOpen ? styles.open : ""}`}
      id={id}
    >
      <button
        type="button"
        className={styles.trigger}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selectedOption ? styles.value : styles.placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {isOpen ? <ChevronUp size={16} className={styles.chevron} /> : <ChevronDown size={16} className={styles.chevron} />}
      </button>

      {isOpen && (
        <ul className={`${styles.dropdown} ${openUpward ? styles.upward : styles.downward}`} role="listbox">
          {options.map((option) => (
            <li
              key={option.value}
              className={`${styles.option} ${option.value === value ? styles.selected : ""} ${option.disabled ? styles.optionDisabled : ""}`}
              role="option"
              aria-selected={option.value === value}
              onClick={() => !option.disabled && handleSelect(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
