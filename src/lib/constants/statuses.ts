/**
 * Status constants — use these everywhere instead of string literals.
 * Named identically to the Prisma enums so they map directly to DB values.
 */

export const DeliveryStatus = {
  NOT_DELIVERED: "NOT_DELIVERED",
  DELIVERED: "DELIVERED",
} as const;

export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];

export const PaymentStatus = {
  NOT_PAID: "NOT_PAID",
  WAITING_BANK_CONFIRMATION: "WAITING_BANK_CONFIRMATION",
  PAID: "PAID",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/** Human-readable labels in Spanish */
export const DeliveryStatusLabel: Record<DeliveryStatus, string> = {
  [DeliveryStatus.NOT_DELIVERED]: "No entregado",
  [DeliveryStatus.DELIVERED]: "Entregado",
};

export const PaymentStatusLabel: Record<PaymentStatus, string> = {
  [PaymentStatus.NOT_PAID]: "No pagado",
  [PaymentStatus.WAITING_BANK_CONFIRMATION]: "Esperando confirmación",
  [PaymentStatus.PAID]: "Pagado",
};
