import styles from "./Button.module.css";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ref,
  ...rest
}: ButtonProps) {
  return (
    <button
      ref={ref}
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        loading ? styles.loading : "",
        className,
      ].join(" ")}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden />}
      {children}
    </button>
  );
}
