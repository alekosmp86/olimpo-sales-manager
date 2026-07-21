"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./StatusDropdown.module.css";
import {
  DeliveryStatus,
  PaymentStatus,
  DeliveryStatusLabel,
  PaymentStatusLabel,
} from "@/lib/constants/statuses";

// ─── Delivery Status Dropdown ─────────────────────────────────────────────────

interface DeliveryDropdownProps {
  value: DeliveryStatus;
  onChange: (value: DeliveryStatus) => void;
  onBeforeChange?: (value: DeliveryStatus) => Promise<boolean>;
  disabled?: boolean;
}

export function DeliveryDropdown({ value, onChange, onBeforeChange, disabled }: DeliveryDropdownProps) {
  const options = Object.values(DeliveryStatus);

  async function handleSelect(newVal: string) {
    if (onBeforeChange) {
      const ok = await onBeforeChange(newVal as DeliveryStatus);
      if (!ok) return;
    }
    onChange(newVal as DeliveryStatus);
  }

  return (
    <StatusSelect
      value={value}
      options={options}
      labelMap={DeliveryStatusLabel as Record<string, string>}
      colorMap={{
        [DeliveryStatus.NOT_DELIVERED]: "gray",
        [DeliveryStatus.DELIVERED]: "amber",
      }}
      onChange={handleSelect}
      disabled={disabled}
    />
  );
}

// ─── Payment Status Dropdown ──────────────────────────────────────────────────

interface PaymentDropdownProps {
  value: PaymentStatus;
  onChange: (value: PaymentStatus) => void;
  disabled?: boolean;
}

export function PaymentDropdown({ value, onChange, disabled }: PaymentDropdownProps) {
  const options = Object.values(PaymentStatus);
  return (
    <StatusSelect
      value={value}
      options={options}
      labelMap={PaymentStatusLabel as Record<string, string>}
      colorMap={{
        [PaymentStatus.NOT_PAID]: "gray",
        [PaymentStatus.WAITING_BANK_CONFIRMATION]: "blue",
        [PaymentStatus.PAID]: "green",
      }}
      onChange={onChange as (v: string) => void}
      disabled={disabled}
    />
  );
}

// ─── Internal generic select ──────────────────────────────────────────────────

interface StatusSelectProps {
  value: string;
  options: string[];
  labelMap: Record<string, string>;
  colorMap: Record<string, string>;
  onChange: (v: string) => void;
  disabled?: boolean;
}

function StatusSelect({ value, options, labelMap, colorMap, onChange, disabled }: StatusSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const currentLabel = labelMap[value] ?? value;

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={[styles.trigger, styles[colorMap[value] ?? "gray"]].join(" ")}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={currentLabel}
      >
        <span className={styles.label}>{currentLabel}</span>
        {!disabled && <ChevronDown size={12} className={styles.chevron} />}
      </button>

      {open && (
        <div className={styles.dropdown} role="listbox">
          {options.map((opt) => (
            <div
              key={opt}
              className={[
                styles.option,
                opt === value ? styles.active : "",
                styles[colorMap[opt] ?? "gray"],
              ].join(" ")}
              role="option"
              tabIndex={-1}
              aria-selected={opt === value}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onChange(opt);
                  setOpen(false);
                }
              }}
            >
              {labelMap[opt] ?? opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

