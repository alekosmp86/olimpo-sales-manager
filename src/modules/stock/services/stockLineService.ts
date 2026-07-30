import "server-only";
import { prisma } from "@/lib/prisma";

export interface StockLineWithDetails {
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

/**
 * Returns stock lines for a given storage, enriched with reserved and available counts.
 * "available" can be negative (backorders allowed), but "quantity" (physical) is never negative.
 */
export async function getStockLines(storageId: string): Promise<StockLineWithDetails[]> {
  // Run both queries concurrently — they are independent (neither uses the other's result)
  const [lines, reservationSums] = await Promise.all([
    prisma.stockLine.findMany({
      where: { storageId, quantity: { gte: 1 } },
      include: {
        product: { include: { dimension: true } },
      },
      orderBy: [{ product: { name: "asc" } }],
    }),
    prisma.stockReservation.groupBy({
      by: ["productId"],
      where: { storageId },
      _sum: { quantity: true },
    }),
  ]);

  const reservedMap = new Map(
    reservationSums.map((reservation) => [reservation.productId, reservation._sum.quantity ?? 0])
  );

  return lines.map((line) => {
    const reserved = reservedMap.get(line.productId) ?? 0;
    return {
      id: line.id,
      storageId: line.storageId,
      productId: line.productId,
      quantity: line.quantity,
      reserved,
      available: line.quantity - reserved,
      product: {
        id: line.product.id,
        name: line.product.name,
        unitPrice: line.product.unitPrice,
        dimension: {
          id: line.product.dimension.id,
          label: line.product.dimension.label,
        },
      },
    };
  });
}

/**
 * Returns storages that have physical stock (quantity > 0) for a given product.
 * Used for the reservation storage picker.
 */
export async function getStoragesWithStockForProduct(productId: string): Promise<
  { storageId: string; storageName: string; quantity: number; reserved: number; available: number }[]
> {
  // Run both queries concurrently — they are independent (neither uses the other's result)
  const [lines, reservationSums] = await Promise.all([
    prisma.stockLine.findMany({
      where: { productId, quantity: { gt: 0 }, storage: { isActive: true } },
      include: { storage: true },
    }),
    prisma.stockReservation.groupBy({
      by: ["storageId"],
      where: { productId },
      _sum: { quantity: true },
    }),
  ]);

  const reservedMap = new Map(
    reservationSums.map((reservation) => [reservation.storageId, reservation._sum.quantity ?? 0])
  );

  return lines.map((line) => {
    const reserved = reservedMap.get(line.storageId) ?? 0;
    return {
      storageId: line.storageId,
      storageName: line.storage.name,
      quantity: line.quantity,
      reserved,
      available: line.quantity - reserved,
    };
  });
}
