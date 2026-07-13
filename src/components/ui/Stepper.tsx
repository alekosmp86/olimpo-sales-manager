"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";
import styles from "./Stepper.module.css";

interface StepperProps {
  value: number | "";
  onChange: (value: number | "") => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  ariaLabel?: string;
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max,
  disabled = false,
  ariaLabel,
}: StepperProps) {
  const handleDecrement = () => {
    const numericValue = typeof value === "number" ? value : 0;
    const nextValue = numericValue - 1;
    if (nextValue >= min) {
      onChange(nextValue);
    }
  };

  const handleIncrement = () => {
    const numericValue = typeof value === "number" ? value : 0;
    const nextValue = numericValue + 1;
    if (max === undefined || nextValue <= max) {
      onChange(nextValue);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    if (inputValue === "") {
      onChange("");
      return;
    }
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed)) return;

    if (parsed < min) {
      onChange(min);
    } else if (max !== undefined && parsed > max) {
      onChange(max);
    } else {
      onChange(parsed);
    }
  };

  const numericValue = typeof value === "number" ? value : 0;

  return (
    <div className={`${styles.stepper} ${disabled ? styles.disabled : ""}`}>
      <button
        type="button"
        onClick={handleDecrement}
        className={styles.stepBtn}
        disabled={disabled || numericValue <= min}
        aria-label="Disminuir"
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        aria-label={ariaLabel}
        className={styles.quantityInput}
      />
      <button
        type="button"
        onClick={handleIncrement}
        className={styles.stepBtn}
        disabled={disabled || (max !== undefined && numericValue >= max)}
        aria-label="Incrementar"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
