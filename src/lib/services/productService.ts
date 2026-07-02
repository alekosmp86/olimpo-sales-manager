import "server-only";
import { prisma } from "@/lib/prisma";

const productInclude = {
  dimension: { select: { id: true, label: true, createdAt: true, updatedAt: true } },
};

export async function getProducts() {
  return prisma.product.findMany({
    include: productInclude,
    orderBy: [{ name: "asc" }, { dimension: { label: "asc" } }],
  });
}

export async function createProduct(data: {
  name: string;
  dimensionId: string;
  unitPrice: number;
}) {
  return prisma.product.create({
    data: {
      name: data.name.trim(),
      dimensionId: data.dimensionId,
      unitPrice: data.unitPrice,
    },
    include: productInclude,
  });
}

export async function updateProduct(
  id: string,
  data: Partial<{ name: string; dimensionId: string; unitPrice: number }>
) {
  return prisma.product.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.dimensionId !== undefined && { dimensionId: data.dimensionId }),
      ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
    },
    include: productInclude,
  });
}

export async function deleteProduct(id: string) {
  const count = await prisma.saleItem.count({ where: { productId: id } });
  if (count > 0) {
    throw new Error(
      `No se puede eliminar: este producto está en ${count} venta(s).`
    );
  }
  await prisma.product.delete({ where: { id } });
}

/** Find or create a product by name + dimensionId (used during CSV import) */
export async function findOrCreateProduct(
  name: string,
  dimensionId: string,
  unitPrice: number
) {
  const trimmed = name.trim();
  const existing = await prisma.product.findUnique({
    where: { name_dimensionId: { name: trimmed, dimensionId } },
    include: productInclude,
  });
  if (existing) return existing;
  return prisma.product.create({
    data: { name: trimmed, dimensionId, unitPrice },
    include: productInclude,
  });
}
