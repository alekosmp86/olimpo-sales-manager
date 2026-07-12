import type { StockEventType } from "@prisma/client";

export const STOCK_EVENT_LABELS: Record<StockEventType, string> = {
  COUNT: "Conteo físico",
  TRANSFER_IN: "Transferencia entrada",
  TRANSFER_OUT: "Transferencia salida",
  SALE_DELIVERY: "Entrega de venta",
};

export const UnresolvedReason = {
  NO_RESERVATION: "no_reservation",
  INSUFFICIENT_STOCK: "insufficient_stock",
} as const;

export type UnresolvedReason = (typeof UnresolvedReason)[keyof typeof UnresolvedReason];

export const StockErrorType = {
  RESERVATION_CONFLICT: "RESERVATION_CONFLICT",
  UNRESOLVED_ITEMS: "UNRESOLVED_ITEMS",
} as const;

export type StockErrorType = (typeof StockErrorType)[keyof typeof StockErrorType];

export const StockPageTab = {
  DEPOSITOS: "depositos",
  HISTORIAL: "historial",
} as const;

export type StockPageTab = (typeof StockPageTab)[keyof typeof StockPageTab];
