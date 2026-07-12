import type { StockEventType } from "@prisma/client";

export type { StockEventType };

// ─── Storages ─────────────────────────────────────────────────────────────────

export interface StorageDTO {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Stock Lines ──────────────────────────────────────────────────────────────

export interface StockLineDTO {
  id: string;
  storageId: string;
  productId: string;
  quantity: number;
  reserved: number;
  available: number;
  product: {
    id: string;
    name: string;
    unitPrice: number;
    dimension: { id: string; label: string };
  };
}

/** Used for the storage picker in the ProductsModal */
export interface StorageAvailability {
  storageId: string;
  storageName: string;
  quantity: number;
  reserved: number;
  available: number;
}

// ─── Stock Events ─────────────────────────────────────────────────────────────

export interface StockEventDTO {
  id: string;
  type: StockEventType;
  storageId: string;
  storageName: string;
  productId: string;
  productName: string;
  productDimension: string;
  delta: number;
  quantityAfter: number;
  notes: string | null;
  saleId: string | null;
  createdAt: string;
}

// ─── Reservations ─────────────────────────────────────────────────────────────

export interface ReservationDTO {
  id: string;
  saleItemId: string;
  storageId: string;
  storageName: string;
  productId: string;
  quantity: number;
}

// ─── Delivery ─────────────────────────────────────────────────────────────────

import { UnresolvedReason } from "./constants";

export interface UnresolvedDeliveryItem {
  saleItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: UnresolvedReason;
}

export interface DeliveryItemOverride {
  saleItemId: string;
  storageId: string;
}
