import type { StockEventType } from "@prisma/client";

export const STOCK_EVENT_LABELS: Record<StockEventType, string> = {
  COUNT: "Conteo físico",
  TRANSFER_IN: "Transferencia entrada",
  TRANSFER_OUT: "Transferencia salida",
  SALE_DELIVERY: "Entrega de venta",
};
