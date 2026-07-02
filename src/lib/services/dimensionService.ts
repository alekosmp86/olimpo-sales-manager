import "server-only";
import { prisma } from "@/lib/prisma";

export async function getDimensions() {
  return prisma.dimension.findMany({
    orderBy: { label: "asc" },
    select: { id: true, label: true, createdAt: true, updatedAt: true },
  });
}

export async function createDimension(label: string) {
  return prisma.dimension.create({
    data: { label: label.trim() },
    select: { id: true, label: true, createdAt: true, updatedAt: true },
  });
}

export async function updateDimension(id: string, label: string) {
  return prisma.dimension.update({
    where: { id },
    data: { label: label.trim() },
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
  const trimmed = label.trim();
  const existing = await prisma.dimension.findUnique({ where: { label: trimmed } });
  if (existing) return existing;
  return prisma.dimension.create({ data: { label: trimmed } });
}
