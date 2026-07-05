"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./SalesTable.module.css";
import { MONTH_ABBRS } from "@/lib/dateUtils";

interface MonthSheetBarProps {
  selectedYear: number;
  selectedMonth: number;
  onPrevYear: (e: React.MouseEvent) => void;
  onNextYear: (e: React.MouseEvent) => void;
  onSelectMonth: (e: React.MouseEvent, month: number) => void;
}

export function MonthSheetBar({
  selectedYear,
  selectedMonth,
  onPrevYear,
  onNextYear,
  onSelectMonth,
}: MonthSheetBarProps) {
  return (
    <div className={styles.excelTabs}>
      <div className={styles.yearSelector}>
        <button
          type="button"
          className={styles.yearBtn}
          onClick={onPrevYear}
          title="Año anterior"
        >
          <ChevronLeft size={14} />
        </button>
        <span className={styles.yearDisplay}>{selectedYear}</span>
        <button
          type="button"
          className={styles.yearBtn}
          onClick={onNextYear}
          title="Año siguiente"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className={styles.sheetsScrollContainer}>
        {MONTH_ABBRS.map((name, index) => (
          <button
            key={name}
            type="button"
            className={[
              styles.sheetTab,
              selectedMonth === index ? styles.activeSheet : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={(e) => onSelectMonth(e, index)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
