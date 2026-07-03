"use client";

import { useState, useCallback, useMemo } from "react";
import type { Sale } from "@/lib/types";

function todayYearMonth() {
  const t = new Date();
  return { year: t.getFullYear(), month: t.getMonth() };
}

function parseYearMonth(dateStr: string) {
  const [y, m] = dateStr.split("-");
  const year = parseInt(y, 10);
  const month = parseInt(m, 10) - 1;
  return !isNaN(year) && !isNaN(month) ? { year, month } : null;
}

/**
 * Manages the selected year/month ("sheet") state.
 *
 * While the user hasn't manually navigated (`manualSelection === null`),
 * the active sheet is auto-derived from the most recent sale via `useMemo`.
 * On first manual navigation it is "locked in" as `manualSelection`.
 * This avoids both `useEffect` and cascading setState calls entirely.
 */
export function useMonthSheet(sales: Sale[], isLoading: boolean) {
  // null = follow auto-derived value; non-null = user has navigated manually
  const [manualSelection, setManualSelection] = useState<{
    year: number;
    month: number;
  } | null>(null);

  // Recomputes only when sales data or loading state changes
  const derived = useMemo(() => {
    if (!isLoading && sales.length > 0 && sales[0]?.date) {
      const parsed = parseYearMonth(sales[0].date);
      if (parsed) return parsed;
    }
    return todayYearMonth();
  }, [sales, isLoading]);

  // Active sheet: user selection wins; falls back to auto-derived
  const active = manualSelection ?? derived;

  const goToPrevYear = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setManualSelection((prev) => {
        const base = prev ?? derived;
        return { year: base.year - 1, month: base.month };
      });
    },
    [derived]
  );

  const goToNextYear = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setManualSelection((prev) => {
        const base = prev ?? derived;
        return { year: base.year + 1, month: base.month };
      });
    },
    [derived]
  );

  const selectMonth = useCallback(
    (e: React.MouseEvent, month: number) => {
      e.preventDefault();
      e.stopPropagation();
      setManualSelection((prev) => ({
        year: prev?.year ?? derived.year,
        month,
      }));
    },
    [derived]
  );

  return {
    selectedYear: active.year,
    selectedMonth: active.month,
    goToPrevYear,
    goToNextYear,
    selectMonth,
  };
}
