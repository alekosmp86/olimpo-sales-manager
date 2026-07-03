"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

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
        <div style={{ padding: "2rem", background: "#FFF0F0", border: "2px solid #FF8080", borderRadius: "8px", margin: "2rem", color: "#A00000", fontFamily: "sans-serif" }}>
          <h2 style={{ marginTop: 0 }}>Hubo un error en la aplicación (Render Crash)</h2>
          <p style={{ fontWeight: "bold" }}>{this.state.error?.toString()}</p>
          {this.state.errorInfo && (
            <pre style={{ background: "#FFF", padding: "1rem", border: "1px solid #FFC0C0", borderRadius: "4px", overflowX: "auto", fontSize: "0.85rem", color: "#333" }}>
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "0.5rem 1rem", background: "#A00000", color: "#FFF", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "1rem" }}
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children ?? null;
  }
}
