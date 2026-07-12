import "server-only";
import { prisma } from "@/lib/prisma";
import { writeStockEvent } from "./stockEventService";
import { UnresolvedReason } from "../constants";

export interface DeliveryItemOverride {
  saleItemId: string;
  storageId: string; // User-specified storage when no valid reservation exists
}

export interface UnresolvedItem {
  saleItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: UnresolvedReason;
}

/**
 * Processes stock decrease when a sale is marked as DELIVERED.
 *
 * Flow per item:
 * 1. If item has a reservation AND storage has enough physical stock → auto-decrease.
 * 2. If item has a reservation BUT storage lacks stock → check overrides[].
 * 3. If item has NO reservation (CSV import) → check overrides[].
 * 4. If still unresolved → return in `unresolvedItems` (caller must prompt user).
 *
 * Returns `unresolvedItems` if some items still need user input.
 * If unresolvedItems is empty, all stock was successfully decreased.
 */
export async function processSaleDelivery(
  saleId: string,
  overrides: DeliveryItemOverride[] = []
): Promise<{ unresolvedItems: UnresolvedItem[] }> {
  const overrideMap = new Map(overrides.map((o) => [o.saleItemId, o.storageId]));

  const items = await prisma.saleItem.findMany({
    where: { saleId },
    include: {
      product: { include: { dimension: true } },
      reservation: true,
    },
  });

  const unresolvedItems: UnresolvedItem[] = [];

  // First pass: validate everything before mutating
  const resolvedItems: Array<{
    saleItemId: string;
    storageId: string;
    productId: string;
    quantity: number;
  }> = [];

  await Promise.all(
    items.map(async (item) => {
      const reservationStorageId = item.reservation?.storageId;
      const overrideStorageId = overrideMap.get(item.id);
      const targetStorageId = overrideStorageId ?? reservationStorageId;

      if (!targetStorageId) {
        unresolvedItems.push({
          saleItemId: item.id,
          productId: item.productId,
          productName: `${item.product.name} ${item.product.dimension.label}`,
          quantity: item.quantity,
          reason: UnresolvedReason.NO_RESERVATION,
        });
        return;
      }

      // Check physical stock
      const stockLine = await prisma.stockLine.findUnique({
        where: { storageId_productId: { storageId: targetStorageId, productId: item.productId } },
      });
      const physical = stockLine?.quantity ?? 0;

      if (physical < item.quantity) {
        unresolvedItems.push({
          saleItemId: item.id,
          productId: item.productId,
          productName: `${item.product.name} ${item.product.dimension.label}`,
          quantity: item.quantity,
          reason: UnresolvedReason.INSUFFICIENT_STOCK,
        });
        return;
      }

      resolvedItems.push({
        saleItemId: item.id,
        storageId: targetStorageId,
        productId: item.productId,
        quantity: item.quantity,
      });
    })
  );

  // If there are unresolved items, don't commit anything yet
  if (unresolvedItems.length > 0) {
    return { unresolvedItems };
  }

  // Second pass: commit all in a single transaction
  await prisma.$transaction(async (tx) => {
    await Promise.all(
      resolvedItems.map(async (resolved) => {
        const stockLine = await tx.stockLine.findUnique({
          where: { storageId_productId: { storageId: resolved.storageId, productId: resolved.productId } },
        });
        const newQty = (stockLine?.quantity ?? 0) - resolved.quantity;

        await tx.stockLine.update({
          where: { storageId_productId: { storageId: resolved.storageId, productId: resolved.productId } },
          data: { quantity: newQty },
        });

        await writeStockEvent(tx, {
          type: "SALE_DELIVERY",
          storageId: resolved.storageId,
          productId: resolved.productId,
          delta: -resolved.quantity,
          quantityAfter: newQty,
          saleId,
        });

        // Release the reservation
        await tx.stockReservation.deleteMany({ where: { saleItemId: resolved.saleItemId } });
      })
    );
  });

  return { unresolvedItems: [] };
}
