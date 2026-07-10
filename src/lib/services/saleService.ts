import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { DeliveryStatus, PaymentStatus } from "@/lib/constants/statuses";

const saleInclude = {
  items: {
    include: {
      product: {
        include: {
          dimension: true,
        },
      },
    },
  },
};

export async function getSales(year?: number, month?: number, search?: string) {
  const where: Prisma.SaleWhereInput = search
    ? {
        OR: [
          { clientName: { contains: search, mode: "insensitive" as const } },
          { address: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  if (year !== undefined && month !== undefined) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));
    where.date = {
      gte: startDate,
      lt: endDate,
    };
  }

  const sales = await prisma.sale.findMany({
    where,
    include: saleInclude,
    orderBy: [
      { date: "asc" },
      { clientName: "asc" },
      { createdAt: "asc" },
      { id: "asc" },
    ],
  });

  return sales.map(serializeSale);
}

export async function createSale(data: {
  date: Date;
  clientName: string;
  phone?: string;
  address?: string;
  comments?: string;
}) {
  const sale = await prisma.sale.create({
    data: {
      date: data.date,
      clientName: data.clientName,
      phone: data.phone ?? null,
      address: data.address ?? null,
      comments: data.comments ?? null,
    },
    include: saleInclude,
  });
  return serializeSale(sale);
}

export async function updateSale(
  id: string,
  data: Partial<{
    date: Date;
    clientName: string;
    phone: string | null;
    address: string | null;
    deliveryStatus: DeliveryStatus;
    paymentStatus: PaymentStatus;
    comments: string | null;
    items: Array<{ productId: string; quantity: number }>;
  }>
) {
  const { items, ...saleFields } = data;

  await prisma.$transaction(async (tx) => {
    // Update scalar fields
    if (Object.keys(saleFields).length > 0) {
      await tx.sale.update({ where: { id }, data: saleFields });
    }

    // Replace items if provided
    if (items !== undefined) {
      await tx.saleItem.deleteMany({ where: { saleId: id } });
      if (items.length > 0) {
        await tx.saleItem.createMany({
          data: items.map((item) => ({
            saleId: id,
            productId: item.productId,
            quantity: item.quantity,
          })),
        });
      }
    }
  });

  const updated = await prisma.sale.findUniqueOrThrow({
    where: { id },
    include: saleInclude,
  });
  return serializeSale(updated);
}

export async function deleteSales(ids: string[]) {
  await prisma.sale.deleteMany({ where: { id: { in: ids } } });
}

export async function duplicateSale(id: string) {
  const original = await prisma.sale.findUniqueOrThrow({
    where: { id },
    include: { items: true },
  });

  const duplicated = await prisma.$transaction(async (tx) => {
    const newSale = await tx.sale.create({
      data: {
        date: original.date,
        clientName: original.clientName,
        phone: original.phone,
        address: original.address,
        comments: original.comments,
        deliveryStatus: DeliveryStatus.NOT_DELIVERED,
        paymentStatus: PaymentStatus.NOT_PAID,
      },
    });

    if (original.items.length > 0) {
      await tx.saleItem.createMany({
        data: original.items.map((item) => ({
          saleId: newSale.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
    }

    return tx.sale.findUniqueOrThrow({
      where: { id: newSale.id },
      include: saleInclude,
    });
  });

  return serializeSale(duplicated);
}

// ─── Serialization ────────────────────────────────────────────────────────────

type SaleWithItems = Awaited<ReturnType<typeof prisma.sale.findFirstOrThrow>> & {
  items: Array<{
    id: string;
    saleId: string;
    productId: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      dimensionId: string;
      unitPrice: number;
      createdAt: Date;
      updatedAt: Date;
      dimension: { id: string; label: string; createdAt: Date; updatedAt: Date };
    };
  }>;
};

function serializeSale(sale: SaleWithItems) {
  return {
    ...sale,
    date: sale.date.toISOString(),
    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString(),
    items: sale.items.map((item) => ({
      ...item,
      totalPrice: item.quantity * item.product.unitPrice,
      product: {
        ...item.product,
        createdAt: item.product.createdAt.toISOString(),
        updatedAt: item.product.updatedAt.toISOString(),
        dimension: {
          ...item.product.dimension,
          createdAt: item.product.dimension.createdAt.toISOString(),
          updatedAt: item.product.dimension.updatedAt.toISOString(),
        },
      },
    })),
  };
}
