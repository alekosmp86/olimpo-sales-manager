import "server-only";
import { prisma } from "@/lib/prisma";
import { standardizeDimension } from "@/lib/utils/dimensionUtils";

export async function getDimensions() {
  return prisma.dimension.findMany({
    orderBy: { label: "asc" },
    select: { id: true, label: true, createdAt: true, updatedAt: true },
  });
}

export async function createDimension(label: string) {
  return prisma.dimension.create({
    data: { label: standardizeDimension(label) },
    select: { id: true, label: true, createdAt: true, updatedAt: true },
  });
}

export async function updateDimension(id: string, label: string) {
  return prisma.dimension.update({
    where: { id },
    data: { label: standardizeDimension(label) },
    select: { id: true, label: true, createdAt: true, updatedAt: true },
  });
}

export async function deleteDimension(id: string) {
  // Guard: refuse if any product references this dimension
  const count = await prisma.product.count({ where: { dimensionId: id } });
  if (count > 0) {
    throw new Error(
      `No se puede eliminar: ${count} producto(s) usan esta dimensión.`
    );
  }
  await prisma.dimension.delete({ where: { id } });
}

/** Find or create a dimension by label (used during CSV import) */
export async function findOrCreateDimension(label: string) {
  const canonical = standardizeDimension(label);
  const existing = await prisma.dimension.findUnique({ where: { label: canonical } });
  if (existing) return existing;
  return prisma.dimension.create({ data: { label: canonical } });
}
