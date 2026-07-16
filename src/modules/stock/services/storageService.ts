import "server-only";
import type { Storage } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type { Storage };

export async function getStorages(includeInactive = false): Promise<Storage[]> {
  return prisma.storage.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createStorage(data: {
  name: string;
  description?: string;
}): Promise<Storage> {
  return prisma.storage.create({ data });
}

export async function updateStorage(
  id: string,
  data: Partial<{ name: string; description: string | null; isActive: boolean }>
): Promise<Storage> {
  return prisma.storage.update({ where: { id }, data });
}

/**
 * Hard-delete a storage. Blocked if it has any stock (quantity > 0) or active reservations.
 * Throws a descriptive error that the API layer can surface.
 */
export async function deleteStorage(id: string): Promise<void> {
  const [stockCount, reservationCount] = await Promise.all([
    prisma.stockLine.count({ where: { storageId: id, quantity: { gt: 0 } } }),
    prisma.stockReservation.count({ where: { storageId: id } }),
  ]);

  if (stockCount > 0) {
    throw new Error(
      "No se puede eliminar un depósito con stock. Transfiera o cuente a cero primero."
    );
  }
  if (reservationCount > 0) {
    throw new Error(
      "No se puede eliminar un depósito con reservas activas. Reasigne las ventas primero."
    );
  }

  await prisma.storage.delete({ where: { id } });
}
