import "server-only";
import { prisma } from "@/lib/prisma";
import type { StockReservation } from "@prisma/client";

export type { StockReservation };

export interface ReservationWithStorage {
  id: string;
  saleItemId: string;
  storageId: string;
  storageName: string;
  productId: string;
  quantity: number;
}

export async function getReservationsForSale(saleId: string): Promise<ReservationWithStorage[]> {
  const items = await prisma.saleItem.findMany({
    where: { saleId },
    include: {
      reservation: { include: { storage: true } },
    },
  });

  return items
    .filter((item) => item.reservation !== null)
    .map((item) => ({
      id: item.reservation!.id,
      saleItemId: item.id,
      storageId: item.reservation!.storageId,
      storageName: item.reservation!.storage.name,
      productId: item.reservation!.productId,
      quantity: item.reservation!.quantity,
    }));
}

/**
 * Upsert a reservation for a SaleItem.
 * Validates that the storage has physical stock (quantity > 0).
 * Does NOT validate available > 0 — backorders are allowed at reserve time.
 */
export async function upsertReservation(data: {
  saleItemId: string;
  storageId: string;
  productId: string;
  quantity: number;
}): Promise<StockReservation> {
  const { saleItemId, storageId, productId, quantity } = data;

  // Validate physical stock exists
  const stockLine = await prisma.stockLine.findUnique({
    where: { storageId_productId: { storageId, productId } },
  });

  if (!stockLine || stockLine.quantity <= 0) {
    throw new Error(
      "El depósito seleccionado no tiene stock físico de este producto. Realice un conteo primero."
    );
  }

  return prisma.stockReservation.upsert({
    where: { saleItemId },
    update: { storageId, quantity },
    create: { saleItemId, storageId, productId, quantity },
  });
}

/**
 * Delete a reservation explicitly (cascade from SaleItem deletion also handles this).
 */
export async function deleteReservation(saleItemId: string): Promise<void> {
  await prisma.stockReservation.deleteMany({ where: { saleItemId } });
}
