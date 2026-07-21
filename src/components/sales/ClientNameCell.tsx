"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import type { Sale } from "@/lib/types";
import { Paintbrush } from "lucide-react";
import { HighlightColor } from "@/lib/constants/colors";
import { ColorPicker } from "./ColorPicker";
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
  highlightColor: HighlightColor | null;
  onHighlight: (color: HighlightColor | null) => void;
}

/** Builds deduplicated top-5 suggestions from in-memory sales as local fallback. */
function getLocalSuggestions(query: string, sales: Sale[], excludeId: string): ClientSuggestion[] {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return [];

  // Iterate forward; later entries overwrite earlier ones so we keep the most recent data.
  const seenClients = new Map<string, ClientSuggestion>();
  for (const sale of sales) {
    if (sale.id === excludeId) continue;
    if (sale.clientName.trim().toLowerCase().includes(trimmedQuery)) {
      seenClients.set(sale.clientName.trim().toLowerCase(), {
        clientName: sale.clientName,
        phone: sale.phone,
        address: sale.address,
      });
    }
  }

  return Array.from(seenClients.values()).slice(0, 5);
}

export function ClientNameCell({ 
  saleId, 
  initialValue, 
  sales, 
  onUpdate,
  highlightColor,
  onHighlight
}: ClientNameCellProps) {
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showUpward, setShowUpward] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close color picker on click outside
  useEffect(() => {
    if (!showPicker) return;
    function handleOutsideClick(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showPicker]);

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
  const searchPattern = debouncedValue.trim();

  // Query remote client suggestions via TanStack Query (handles caching, cancellation, and deduplication)
  const { data: remoteSuggestions = [] } = useQuery<ClientSuggestion[]>({
    queryKey: ["client-suggestions", searchPattern],
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/clients?q=${encodeURIComponent(searchPattern)}`, { signal });
      if (!response.ok) {
        return [];
      }
      const remoteData = (await response.json()) as ClientSuggestion[];
      return Array.isArray(remoteData) ? remoteData.slice(0, 5) : [];
    },
    enabled: focused && searchPattern.length > 0,
    staleTime: 30_000,
  });

  // Combine remote suggestions with local fallback
  const suggestions = useMemo(() => {
    if (!focused || !searchPattern) {
      return [];
    }
    if (remoteSuggestions.length > 0) {
      return remoteSuggestions.slice(0, 5);
    }
    return getLocalSuggestions(searchPattern, sales, saleId);
  }, [focused, searchPattern, remoteSuggestions, sales, saleId]);

  function updateDropdownDirection() {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setShowUpward(spaceBelow < 240);
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
    setOpen(true);
    updateDropdownDirection();
  }

  function handleFocus() {
    setFocused(true);
    setOpen(true);
    updateDropdownDirection();
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
        className={`${cellStyles.cellInput} ${styles.nameInput}`}
        value={value}
        placeholder="Cliente"
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label="Nombre del cliente"
      />

      <button
        type="button"
        className={[
          styles.highlightBtn,
          highlightColor ? styles[`highlightBtn_${highlightColor}`] || styles.highlightBtnActive : ""
        ].filter(Boolean).join(" ")}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          setOpen(false); // Close autocomplete
          updateDropdownDirection();
          setShowPicker(!showPicker);
        }}
        title="Pintar celda"
        aria-label="Pintar celda"
      >
        <Paintbrush size={14} />
      </button>

      {showPicker && (
        <ColorPicker
          ref={pickerRef}
          onSelectColor={(color) => {
            onHighlight(color);
            setShowPicker(false);
          }}
        />
      )}

      {open && suggestions.length > 0 && (
        <div className={`${styles.list} ${showUpward ? styles.listUpward : ""}`} role="listbox">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.clientName}
              role="option"
              tabIndex={-1}
              aria-selected={value === suggestion.clientName}
              className={styles.item}
              // mousedown fires before blur — event.preventDefault() keeps the input focused
              // long enough for the click to complete, then handleSelect fires
              onMouseDown={(event) => {
                event.preventDefault();
                handleSelect(suggestion);
              }}
            >
              <span className={styles.name}>{suggestion.clientName}</span>
              {(suggestion.phone || suggestion.address) && (
                <span className={styles.meta}>
                  {[suggestion.phone, suggestion.address].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

