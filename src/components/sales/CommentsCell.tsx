"use client";

import { useState, useRef, useLayoutEffect } from "react";
import styles from "./SalesTable.module.css";

interface CommentsCellProps {
  initialValue: string | null;
  onUpdate: (commentValue: string | null) => void;
}

/**
 * CommentsCell renders an auto-resizing textarea for the sales grid comments column.
 * The textarea dynamically expands and shrinks based on the text content height.
 */
export function CommentsCell({ initialValue, onUpdate }: CommentsCellProps) {
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
      className={styles.cellTextarea}
      value={currentValue}
      placeholder="Comentarios"
      onChange={handleChange}
      onBlur={handleBlur}
      aria-label="Comentarios de la venta"
      rows={1}
    />
  );
}
