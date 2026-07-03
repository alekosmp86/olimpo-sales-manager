import { SalesTable } from "@/components/sales/SalesTable";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ventas — Olimpo",
  description: "Gestión de ventas",
};

export default function SalesPage() {
  return (
    <ErrorBoundary>
      <SalesTable />
    </ErrorBoundary>
  );
}
