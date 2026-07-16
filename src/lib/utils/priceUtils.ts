import type { Sale } from "@/lib/types";

const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

export function formatPrice(n: number | null | undefined): string {
  return priceFormatter.format(n ?? 0);
}

export function calculateSalesTotal(sales: Sale[]): number {
  return sales.reduce((sum, sale) => {
    const saleTotal = sale.items.reduce((itemSum, item) => itemSum + item.totalPrice, 0);
    return sum + saleTotal;
  }, 0);
}
