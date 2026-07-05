"use client";

import React, { createContext, use, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, HelpCircle, Info, CheckCircle } from "lucide-react";
import styles from "./Confirm.module.css";
import { MessageType, MessageTypeValue } from "@/lib/constants/messageType";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: MessageTypeValue;
  onlyConfirm?: boolean; // if true, behaves like an alert dialog (no cancel button)
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = use(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
};

const getIcon = (type?: MessageTypeValue) => {
  switch (type) {
    case MessageType.DANGER:
      return <AlertTriangle size={24} />;
    case MessageType.SUCCESS:
      return <CheckCircle size={24} />;
    case MessageType.INFO:
      return <Info size={24} />;
    case MessageType.WARNING:
    default:
      return <HelpCircle size={24} />;
  }
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions | null;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    options: null,
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleCancel = useCallback(() => {
    if (dialogState.resolve) dialogState.resolve(false);
    setDialogState({ isOpen: false, options: null, resolve: null });
  }, [dialogState]);

  const handleConfirm = useCallback(() => {
    if (dialogState.resolve) dialogState.resolve(true);
    setDialogState({ isOpen: false, options: null, resolve: null });
  }, [dialogState]);

  const { isOpen, options } = dialogState;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const handleCancelRef = useRef(handleCancel);
  const handleConfirmRef = useRef(handleConfirm);

  handleCancelRef.current = handleCancel;
  handleConfirmRef.current = handleConfirm;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.focus();

    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog && !options?.onlyConfirm) {
        handleCancelRef.current();
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!options?.onlyConfirm) {
          handleCancelRef.current();
        }
      } else if (e.key === "Enter") {
        handleConfirmRef.current();
      }
    };

    dialog.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      dialog.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, options]);

  const contextValue = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={contextValue}>
      {children}
      {isOpen && options && typeof window !== "undefined" &&
        createPortal(
          <dialog
            ref={dialogRef}
            className={styles.backdrop}
            tabIndex={-1}
            aria-labelledby="confirm-title"
            open
          >
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
              <div className={styles.header}>
                <div className={`${styles.iconWrapper} ${styles[options.type || MessageType.WARNING]}`}>
                  {getIcon(options.type)}
                </div>
                <h3 id="confirm-title" className={styles.title}>
                  {options.title}
                </h3>
              </div>
              <div className={styles.body}>
                <p className={styles.message}>{options.message}</p>
              </div>
              <div className={styles.footer}>
                {!options.onlyConfirm && (
                  <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
                    {options.cancelText || "Cancelar"}
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.confirmBtn} ${styles[options.type || MessageType.WARNING]}`}
                  onClick={handleConfirm}
                >
                  {options.confirmText || "Confirmar"}
                </button>
              </div>
            </div>
          </dialog>,
          document.body
        )}
    </ConfirmContext.Provider>
  );
}
