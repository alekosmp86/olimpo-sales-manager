import { DeliveryStatus, PaymentStatus } from "@/lib/constants/statuses";

// ─── Dimension ───────────────────────────────────────────────────────────────

export interface Dimension {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  dimensionId: string;
  dimension: Dimension;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
}

// ─── SaleItem ─────────────────────────────────────────────────────────────────

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  /** Computed field: quantity * unitPrice */
  totalPrice: number;
  reservation?: {
    id: string;
    storageId: string;
    storageName: string;
    productId: string;
    quantity: number;
  } | null;
}

// ─── Sale ─────────────────────────────────────────────────────────────────────

export interface Sale {
  id: string;
  date: string;
  clientName: string;
  phone: string | null;
  address: string | null;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  comments: string | null;
  highlightColor: string | null;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── CSV Import ───────────────────────────────────────────────────────────────

export interface CsvRow {
  /** 1-based line number in the original CSV file */
  rowNumber: number;
  date: string;
  clientName: string;
  phone?: string;
  address: string;
  product: string;
  dimension: string;
  quantity: string;
  totalPrice: string;
  deliveryStatus: string;
  paymentStatus: string;
  comments: string;
}

export interface ImportValidRow {
  rowNumber: number;
  date: string;
  clientName: string;
  phone?: string;
  address: string;
  product: string;
  dimension: string;
  quantity: number;
  totalPrice: number;
  unitPrice: number;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  comments: string;
}

export interface ImportInvalidRow {
  row: CsvRow;
  errors: string[];
}

export interface ImportDuplicatePair {
  type: "exact_duplicate" | "name_conflict";
  incoming: ImportValidRow;
  existingClientName: string;
  existingSaleDate: string;
  existingSaleProduct: string;
  existingPhone?: string | null;
  existingAddress?: string | null;
  existingSaleId: string;
}

export interface ImportClassificationResult {
  valid: ImportValidRow[];
  invalid: ImportInvalidRow[];
  duplicates: ImportDuplicatePair[];
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
}
