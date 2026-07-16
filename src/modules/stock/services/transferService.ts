import "server-only";
import { prisma } from "@/lib/prisma";
import { writeStockEvent } from "./stockEventService";

export interface TransferConflict {
  productId: string;
  productName: string;
  totalReserved: number;
  transferQuantity: number;
}

/**
 * Check if a transfer from `fromStorageId` would cause a reservation conflict.
 * Returns conflict info if the transfer would reduce total quantity below reserved quantity.
 */
export async function checkTransferConflict(
  fromStorageId: string,
  productId: string,
  quantity: number
): Promise<TransferConflict | null> {
  const line = await prisma.stockLine.findUnique({
    where: { storageId_productId: { storageId: fromStorageId, productId } },
    include: { product: { include: { dimension: true } } },
  });

  if (!line) return null;

  const reservationSum = await prisma.stockReservation.aggregate({
    where: { storageId: fromStorageId, productId },
    _sum: { quantity: true },
  });
  const totalReserved = reservationSum._sum.quantity ?? 0;

  // Conflict: after transfer, total stock < reserved
  if (line.quantity - quantity < totalReserved) {
    return {
      productId,
      productName: `${line.product.name} ${line.product.dimension.label}`,
      totalReserved,
      transferQuantity: quantity,
    };
  }

  return null;
}

/**
 * Execute a transfer. Validates available stock (quantity > 0 in source).
 * `force` allows proceeding even when there is a reservation conflict.
 */
export async function executeTransfer(params: {
  fromStorageId: string;
  toStorageId: string;
  productId: string;
  quantity: number;
  force?: boolean;
  notes?: string;
}): Promise<void> {
  const { fromStorageId, toStorageId, productId, quantity, force = false, notes } = params;

  if (fromStorageId === toStorageId) {
    throw new Error("El origen y el destino no pueden ser el mismo depósito.");
  }
  if (quantity <= 0) {
    throw new Error("La cantidad a transferir debe ser mayor a cero.");
  }

  await prisma.$transaction(async (tx) => {
    const sourceLine = await tx.stockLine.findUnique({
      where: { storageId_productId: { storageId: fromStorageId, productId } },
    });

    const sourceQty = sourceLine?.quantity ?? 0;

    if (sourceQty < quantity) {
      throw new Error(
        `Stock insuficiente en el depósito origen. Disponible: ${sourceQty}, solicitado: ${quantity}.`
      );
    }

    // If not forced, also check reservation conflict
    if (!force) {
      const reservationSum = await tx.stockReservation.aggregate({
        where: { storageId: fromStorageId, productId },
        _sum: { quantity: true },
      });
      const totalReserved = reservationSum._sum.quantity ?? 0;
      if (sourceQty - quantity < totalReserved) {
        throw new Error(
          "RESERVATION_CONFLICT: Esta transferencia afecta reservas activas. Confirme para continuar."
        );
      }
    }

    // Decrement source
    const newSourceQty = sourceQty - quantity;
    await tx.stockLine.update({
      where: { storageId_productId: { storageId: fromStorageId, productId } },
      data: { quantity: newSourceQty },
    });

    // Upsert destination
    const destLine = await tx.stockLine.findUnique({
      where: { storageId_productId: { storageId: toStorageId, productId } },
    });
    const destQty = (destLine?.quantity ?? 0) + quantity;
    await tx.stockLine.upsert({
      where: { storageId_productId: { storageId: toStorageId, productId } },
      update: { quantity: destQty },
      create: { storageId: toStorageId, productId, quantity },
    });

    // Write events
    await writeStockEvent(tx, {
      type: "TRANSFER_OUT",
      storageId: fromStorageId,
      productId,
      delta: -quantity,
      quantityAfter: newSourceQty,
      notes,
    });
    await writeStockEvent(tx, {
      type: "TRANSFER_IN",
      storageId: toStorageId,
      productId,
      delta: quantity,
      quantityAfter: destQty,
      notes,
    });
  });
}
