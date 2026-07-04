"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
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
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
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

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (!dialogState.options?.onlyConfirm) {
        handleCancel();
      }
    } else if (e.key === "Enter") {
      handleConfirm();
    }
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

  const { isOpen, options } = dialogState;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && typeof window !== "undefined" &&
        createPortal(
          <div
            className={styles.backdrop}
            onClick={() => {
              // Clicking backdrop cancels unless it is an alert dialog
              if (!options.onlyConfirm) {
                handleCancel();
              }
            }}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            ref={(el) => el?.focus()} // auto focus backdrop to trap keyboard events
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
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
                  <button className={styles.cancelBtn} onClick={handleCancel}>
                    {options.cancelText || "Cancelar"}
                  </button>
                )}
                <button
                  className={`${styles.confirmBtn} ${styles[options.type || MessageType.WARNING]}`}
                  onClick={handleConfirm}
                >
                  {options.confirmText || "Confirmar"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ConfirmContext.Provider>
  );
}
