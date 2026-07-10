"use client";

import { useState, useCallback } from "react";

function todayYearMonth() {
  const t = new Date();
  return { year: t.getFullYear(), month: t.getMonth() };
}

export function useMonthSheet() {
  const [selected, setSelected] = useState<{
    year: number;
    month: number;
  }>(todayYearMonth);

  const goToPrevYear = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSelected((prev) => ({ year: prev.year - 1, month: prev.month }));
    },
    []
  );

  const goToNextYear = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSelected((prev) => ({ year: prev.year + 1, month: prev.month }));
    },
    []
  );

  const selectMonth = useCallback(
    (e: React.MouseEvent, month: number) => {
      e.preventDefault();
      e.stopPropagation();
      setSelected((prev) => ({
        year: prev.year,
        month,
      }));
    },
    []
  );

  return {
    selectedYear: selected.year,
    selectedMonth: selected.month,
    goToPrevYear,
    goToNextYear,
    selectMonth,
  };
}
