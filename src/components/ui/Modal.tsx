"use client";

import { useEffect, useRef, ReactNode, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  bodyClassName?: string;
}

const emptySubscribe = () => () => {};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  bodyClassName,
}: ModalProps) {
  const backdropRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);

  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !isClient) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, isClient]);

  useEffect(() => {
    if (!isClient) return;
    const dialog = backdropRef.current;
    if (!dialog) return;
    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) onCloseRef.current();
    };
    dialog.addEventListener("click", handleClick);
    return () => {
      dialog.removeEventListener("click", handleClick);
    };
  }, [isOpen, isClient]);

  if (!isOpen || !isClient || typeof window === "undefined") return null;

  return createPortal(
    <dialog
      className={styles.backdrop}
      ref={backdropRef}
      aria-label={title}
      open
    >
      <div className={[styles.modal, styles[size]].join(" ")}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className={[styles.body, bodyClassName].filter(Boolean).join(" ")}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </dialog>,
    document.body
  );
}
