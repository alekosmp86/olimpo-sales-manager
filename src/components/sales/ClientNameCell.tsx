"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import type { Sale } from "@/lib/types";
import styles from "./ClientNameCell.module.css";
import cellStyles from "./SalesTable.module.css";

interface ClientSuggestion {
  clientName: string;
  phone: string | null;
  address: string | null;
}

interface ClientNameCellProps {
  saleId: string;
  initialValue: string;
  sales: Sale[];
  onUpdate: (payload: { id: string; data: Record<string, unknown> }) => void;
}

/** Builds deduplicated top-5 suggestions from in-memory sales. */
function getSuggestions(query: string, sales: Sale[], excludeId: string): ClientSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // Iterate forward; later entries overwrite earlier ones so we keep the most recent data.
  const seen = new Map<string, ClientSuggestion>();
  for (const sale of sales) {
    if (sale.id === excludeId) continue;
    if (sale.clientName.trim().toLowerCase().includes(q)) {
      seen.set(sale.clientName.trim().toLowerCase(), {
        clientName: sale.clientName,
        phone: sale.phone,
        address: sale.address,
      });
    }
  }

  return Array.from(seen.values()).slice(0, 5);
}

export function ClientNameCell({ saleId, initialValue, sales, onUpdate }: ClientNameCellProps) {
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showUpward, setShowUpward] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync state with props/focus changes directly in render to prevent post-effect cascading renders
  const [prevInitialValue, setPrevInitialValue] = useState(initialValue);
  const [prevFocused, setPrevFocused] = useState(focused);

  if (initialValue !== prevInitialValue || focused !== prevFocused) {
    setPrevInitialValue(initialValue);
    setPrevFocused(focused);
    if (!focused) {
      setValue(initialValue);
    }
  }

  // Debounce the typed value before running the suggestion lookup
  const debouncedValue = useDebounce(value, 200);

  // Compute suggestions during render instead of performing cascading setState in useEffect
  const suggestions = useMemo(() => {
    if (!focused) return [];
    return getSuggestions(debouncedValue, sales, saleId);
  }, [debouncedValue, sales, saleId, focused]);

  // Dynamic upward dropdown detection
  useEffect(() => {
    if (!open || !wrapperRef.current) {
      setShowUpward(false);
      return;
    }
    const rect = wrapperRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    // Suggestion dropdown max height is ~240px (5 items * 46px + padding)
    setShowUpward(spaceBelow < 240);
  }, [open]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    setOpen(true);
  }

  function handleFocus() {
    setFocused(true);
    setOpen(true);
  }

  function handleBlur() {
    setFocused(false);
    // Delay close so a mousedown on a suggestion fires before blur hides the list
    setTimeout(() => {
      setOpen(false);
      if (value !== initialValue) {
        onUpdate({ id: saleId, data: { clientName: value } });
      }
    }, 150);
  }

  function handleSelect(suggestion: ClientSuggestion) {
    setValue(suggestion.clientName);
    setOpen(false);
    // Single atomic PATCH — avoids 3 concurrent saves and race conditions
    onUpdate({
      id: saleId,
      data: {
        clientName: suggestion.clientName,
        phone: suggestion.phone ?? null,
        address: suggestion.address ?? null,
      },
    });
  }

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <input
        type="text"
        className={cellStyles.cellInput}
        value={value}
        placeholder="Cliente"
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      {open && suggestions.length > 0 && (
        <ul className={`${styles.list} ${showUpward ? styles.listUpward : ""}`} role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={i}
              role="option"
              aria-selected={value === s.clientName}
              className={styles.item}
              // mousedown fires before blur — e.preventDefault() keeps the input focused
              // long enough for the click to complete, then handleSelect fires
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
            >
              <span className={styles.name}>{s.clientName}</span>
              {(s.phone || s.address) && (
                <span className={styles.meta}>
                  {[s.phone, s.address].filter(Boolean).join(" · ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
