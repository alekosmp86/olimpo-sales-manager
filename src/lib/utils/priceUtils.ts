const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

export function formatPrice(n: number | null | undefined): string {
  return priceFormatter.format(n ?? 0);
}
