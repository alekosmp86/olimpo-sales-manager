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
  /** Computed field: quantity * product.unitPrice */
  totalPrice: number;
}

// ─── Sale ─────────────────────────────────────────────────────────────────────

export interface Sale {
  id: string;
  date: string;
  clientName: string;
  address: string | null;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  comments: string | null;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── CSV Import ───────────────────────────────────────────────────────────────

export interface CsvRow {
  Date: string;
  "Client Name": string;
  Address: string;
  Product: string;
  Dimension: string;
  Quantity: string;
  "Total Price": string;
  "Delivery Status": string;
  "Payment Status": string;
  Comments: string;
}

export interface ImportValidRow {
  date: string;
  clientName: string;
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
  incoming: ImportValidRow;
  existingClientName: string;
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
