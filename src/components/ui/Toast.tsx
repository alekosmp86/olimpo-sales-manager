"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { MessageType, MessageTypeValue } from "@/lib/constants/messageType";
import styles from "./Toast.module.css";

export interface Toast {
  id: string;
  message: string;
  type: MessageTypeValue;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: MessageTypeValue, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warn: (message: string, duration?: number) => void;
}

// Global references for triggering toasts outside React tree (e.g. in QueryClient global config)
let globalToast: {
  success: (msg: string, duration?: number) => void;
  error: (msg: string, duration?: number) => void;
  info: (msg: string, duration?: number) => void;
  warn: (msg: string, duration?: number) => void;
} | null = null;

export const triggerGlobalToast = (message: string, type: MessageTypeValue, duration?: number) => {
  if (globalToast) {
    if (type === MessageType.SUCCESS) globalToast.success(message, duration);
    else if (type === MessageType.DANGER) globalToast.error(message, duration);
    else if (type === MessageType.WARNING) globalToast.warn(message, duration);
    else globalToast.info(message, duration);
  }
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// 2. Individual Toast Item component with progress bar
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const { message, type, duration = 4000 } = toast;

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case MessageType.SUCCESS:
        return <CheckCircle size={20} />;
      case MessageType.DANGER:
        return <AlertCircle size={20} />;
      case MessageType.WARNING:
        return <AlertTriangle size={20} />;
      case MessageType.INFO:
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.iconWrapper}>{getIcon()}</div>
      <div className={styles.content}>{message}</div>
      <button className={styles.closeButton} onClick={onClose} aria-label="Close notification">
        <X size={16} />
      </button>
      <div
        className={styles.progressBar}
        style={{
          animation: `${styles.progressShrink} ${duration}ms linear forwards`,
        }}
      />
    </div>
  );
}

// 3. Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: MessageTypeValue, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    showToast(message, MessageType.SUCCESS, duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast(message, MessageType.DANGER, duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast(message, MessageType.INFO, duration);
  }, [showToast]);

  const warn = useCallback((message: string, duration?: number) => {
    showToast(message, MessageType.WARNING, duration);
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync global Toast functions reference
  useEffect(() => {
    globalToast = { success, error, info, warn };
    return () => {
      globalToast = null;
    };
  }, [success, error, info, warn]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warn }}>
      {children}
      <div className={styles.container}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
