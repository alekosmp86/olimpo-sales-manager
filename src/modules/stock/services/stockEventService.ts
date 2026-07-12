import "server-only";
import { prisma } from "@/lib/prisma";
import type { StockEventType } from "@prisma/client";

export interface StockEventRecord {
  id: string;
  type: StockEventType;
  storageId: string;
  storageName: string;
  productId: string;
  productName: string;
  productDimension: string;
  delta: number;
  quantityAfter: number;
  notes: string | null;
  saleId: string | null;
  createdAt: string;
}

export async function getStockEvents(params: {
  storageId?: string;
  productId?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ events: StockEventRecord[]; nextCursor: string | null }> {
  const { storageId, productId, limit = 50, cursor } = params;

  const events = await prisma.stockEvent.findMany({
    where: {
      ...(storageId ? { storageId } : {}),
      ...(productId ? { productId } : {}),
    },
    include: {
      storage: true,
      product: { include: { dimension: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = events.length > limit;
  const page = hasMore ? events.slice(0, limit) : events;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return {
    events: page.map((event) => ({
      id: event.id,
      type: event.type,
      storageId: event.storageId,
      storageName: event.storage.name,
      productId: event.productId,
      productName: event.product.name,
      productDimension: event.product.dimension.label,
      delta: event.delta,
      quantityAfter: event.quantityAfter,
      notes: event.notes,
      saleId: event.saleId,
      createdAt: event.createdAt.toISOString(),
    })),
    nextCursor,
  };
}

/**
 * Write a single stock event. Always called inside a transaction by other services.
 */
export async function writeStockEvent(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  data: {
    type: StockEventType;
    storageId: string;
    productId: string;
    delta: number;
    quantityAfter: number;
    notes?: string;
    saleId?: string;
  }
): Promise<void> {
  await (tx as typeof prisma).stockEvent.create({ data });
}
