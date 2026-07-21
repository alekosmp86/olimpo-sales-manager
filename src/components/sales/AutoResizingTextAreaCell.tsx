"use client";

import { useState, useRef, useLayoutEffect } from "react";
import styles from "./SalesTable.module.css";

interface AutoResizingTextareaCellProps {
  initialValue: string | null;
  onUpdate: (value: string | null) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * AutoResizingTextareaCell renders an auto-resizing textarea for grid cells.
 * The textarea dynamically expands and shrinks based on the text content height.
 */
export function AutoResizingTextareaCell({
  initialValue,
  onUpdate,
  placeholder,
  ariaLabel,
  className = styles.cellTextarea,
}: AutoResizingTextareaCellProps) {
  const [currentValue, setCurrentValue] = useState(initialValue ?? "");
  const [previousInitialValue, setPreviousInitialValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync internal state if initialValue changes externally
  if (initialValue !== previousInitialValue) {
    setPreviousInitialValue(initialValue);
    setCurrentValue(initialValue ?? "");
  }

  const adjustHeight = () => {
    const textareaElement = textareaRef.current;
    if (textareaElement) {
      textareaElement.style.height = "auto";
      textareaElement.style.height = `${textareaElement.scrollHeight}px`;
    }
  };

  useLayoutEffect(() => {
    adjustHeight();
  }, [currentValue]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentValue(event.target.value);
    adjustHeight();
  };

  const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    const trimmedValue = event.target.value;
    if (trimmedValue !== (initialValue ?? "")) {
      onUpdate(trimmedValue ? trimmedValue : null);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      className={className}
      value={currentValue}
      placeholder={placeholder}
      onChange={handleChange}
      onBlur={handleBlur}
      aria-label={ariaLabel}
      rows={1}
    />
  );
}
