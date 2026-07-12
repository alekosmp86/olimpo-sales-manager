import "server-only";
import { prisma } from "@/lib/prisma";
import { writeStockEvent } from "./stockEventService";

export interface CountEntry {
  productId: string;
  quantity: number;
}

export interface CountWarning {
  productId: string;
  productName: string;
  newQuantity: number;
  reserved: number;
}

/**
 * Performs a physical inventory count for a storage.
 * Sets absolute quantities and logs COUNT events.
 * Returns warnings for any product where the new quantity < reserved quantity.
 */
export async function performCount(
  storageId: string,
  entries: CountEntry[],
  notes?: string
): Promise<{ warnings: CountWarning[] }> {
  const warnings: CountWarning[] = [];

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      entries.map(async (entry) => {
        if (entry.quantity < 0) {
          throw new Error(`El stock no puede ser negativo para el producto ${entry.productId}.`);
        }

        // Get current line (to compute delta)
        const existing = await tx.stockLine.findUnique({
          where: { storageId_productId: { storageId, productId: entry.productId } },
        });
        const oldQty = existing?.quantity ?? 0;
        const delta = entry.quantity - oldQty;

        // Upsert the stock line
        await tx.stockLine.upsert({
          where: { storageId_productId: { storageId, productId: entry.productId } },
          update: { quantity: entry.quantity },
          create: { storageId, productId: entry.productId, quantity: entry.quantity },
        });

        // Write the event
        await writeStockEvent(tx, {
          type: "COUNT",
          storageId,
          productId: entry.productId,
          delta,
          quantityAfter: entry.quantity,
          notes,
        });

        // Check for reservation warnings
        const reservationSum = await tx.stockReservation.aggregate({
          where: { storageId, productId: entry.productId },
          _sum: { quantity: true },
        });
        const reserved = reservationSum._sum.quantity ?? 0;

        if (entry.quantity < reserved) {
          const product = await tx.product.findUnique({
            where: { id: entry.productId },
            include: { dimension: true },
          });
          warnings.push({
            productId: entry.productId,
            productName: product ? `${product.name} ${product.dimension.label}` : entry.productId,
            newQuantity: entry.quantity,
            reserved,
          });
        }
      })
    );
  });

  return { warnings };
}
