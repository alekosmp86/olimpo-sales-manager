import { StockPage } from "@/modules/stock/components/StockPage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stock — Olimpo",
  description: "Gestión de stock e inventario",
};

export default function StockRoute() {
  return (
    <ErrorBoundary>
      <StockPage />
    </ErrorBoundary>
  );
}
