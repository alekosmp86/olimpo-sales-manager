"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

import styles from "./ErrorBoundary.module.css";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container}>
          <h2 className={styles.title}>Hubo un error en la aplicación (Render Crash)</h2>
          <p className={styles.message}>{this.state.error?.toString()}</p>
          {this.state.errorInfo && (
            <pre className={styles.stack}>
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={styles.btn}
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children ?? null;
  }
}
