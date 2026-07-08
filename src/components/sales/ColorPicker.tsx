"use client";

import React from "react";
import { Eraser } from "lucide-react";
import { HighlightColor } from "@/lib/constants/colors";
import styles from "./ColorPicker.module.css";

interface ColorPickerProps {
  onSelectColor: (color: HighlightColor | null) => void;
}

export const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  function ColorPicker({ onSelectColor }, ref) {
    return (
      <div 
        ref={ref} 
        className={styles.colorPicker}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={`${styles.colorDot} ${styles.dotYellow}`}
          onClick={() => onSelectColor(HighlightColor.YELLOW)}
          title="Amarillo"
          aria-label="Color amarillo"
        />
        <button
          type="button"
          className={`${styles.colorDot} ${styles.dotBlue}`}
          onClick={() => onSelectColor(HighlightColor.BLUE)}
          title="Azul"
          aria-label="Color azul"
        />
        <button
          type="button"
          className={`${styles.colorDot} ${styles.dotGreen}`}
          onClick={() => onSelectColor(HighlightColor.GREEN)}
          title="Verde"
          aria-label="Color verde"
        />
        <button
          type="button"
          className={`${styles.colorDot} ${styles.dotMagenta}`}
          onClick={() => onSelectColor(HighlightColor.MAGENTA)}
          title="Magenta"
          aria-label="Color magenta"
        />
        <button
          type="button"
          className={`${styles.colorDot} ${styles.dotOrange}`}
          onClick={() => onSelectColor(HighlightColor.ORANGE)}
          title="Naranja"
          aria-label="Color naranja"
        />
        <button
          type="button"
          className={styles.clearBtn}
          onClick={() => onSelectColor(null)}
          title="Limpiar"
          aria-label="Limpiar color"
        >
          <Eraser size={14} />
        </button>
      </div>
    );
  }
);
