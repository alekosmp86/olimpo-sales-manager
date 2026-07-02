import "server-only";
import { prisma } from "@/lib/prisma";
import { DeliveryStatus, PaymentStatus } from "@/lib/constants/statuses";
import { findOrCreateDimension } from "@/lib/services/dimensionService";
import { findOrCreateProduct } from "@/lib/services/productService";
import type {
  CsvRow,
  ImportValidRow,
  ImportInvalidRow,
  ImportDuplicatePair,
  ImportClassificationResult,
} from "@/lib/types";

const DELIVERY_STATUS_MAP: Record<string, DeliveryStatus> = {
  "not delivered": DeliveryStatus.NOT_DELIVERED,
  "no entregado": DeliveryStatus.NOT_DELIVERED,
  delivered: DeliveryStatus.DELIVERED,
  entregado: DeliveryStatus.DELIVERED,
};

const PAYMENT_STATUS_MAP: Record<string, PaymentStatus> = {
  "not paid": PaymentStatus.NOT_PAID,
  "no pagado": PaymentStatus.NOT_PAID,
  "waiting bank confirmation": PaymentStatus.WAITING_BANK_CONFIRMATION,
  "esperando confirmación": PaymentStatus.WAITING_BANK_CONFIRMATION,
  paid: PaymentStatus.PAID,
  pagado: PaymentStatus.PAID,
};

function parseDeliveryStatus(raw: string): DeliveryStatus | null {
  return DELIVERY_STATUS_MAP[raw.trim().toLowerCase()] ?? null;
}

function parsePaymentStatus(raw: string): PaymentStatus | null {
  return PAYMENT_STATUS_MAP[raw.trim().toLowerCase()] ?? null;
}

export async function validateAndClassifyRows(
  rows: CsvRow[]
): Promise<ImportClassificationResult> {
  const valid: ImportValidRow[] = [];
  const invalid: ImportInvalidRow[] = [];
  const duplicates: ImportDuplicatePair[] = [];

  // Fetch all existing client names once for duplicate checking
  const existingSales = await prisma.sale.findMany({
    select: { id: true, clientName: true },
  });
  const existingNameMap = new Map(
    existingSales.map((s) => [s.clientName.toLowerCase(), s])
  );

  for (const row of rows) {
    const errors: string[] = [];

    const date = row["Date"]?.trim();
    const clientName = row["Client Name"]?.trim();
    const address = row["Address"]?.trim() ?? "";
    const product = row["Product"]?.trim();
    const dimension = row["Dimension"]?.trim();
    const quantityStr = row["Quantity"]?.trim();
    const totalPriceStr = row["Total Price"]?.trim();
    const deliveryRaw = row["Delivery Status"]?.trim() ?? "";
    const paymentRaw = row["Payment Status"]?.trim() ?? "";
    const comments = row["Comments"]?.trim() ?? "";

    if (!date || isNaN(Date.parse(date))) errors.push("Fecha inválida o faltante.");
    if (!clientName) errors.push("Nombre de cliente faltante.");
    if (!product) errors.push("Producto faltante.");
    if (!dimension) errors.push("Dimensión faltante.");

    const quantity = parseInt(quantityStr, 10);
    if (isNaN(quantity) || quantity <= 0) errors.push("Cantidad inválida.");

    const totalPrice = parseFloat(totalPriceStr);
    if (isNaN(totalPrice) || totalPrice < 0) errors.push("Precio total inválido.");

    const deliveryStatus = parseDeliveryStatus(deliveryRaw);
    if (!deliveryStatus) errors.push(`Estado de entrega desconocido: "${deliveryRaw}".`);

    const paymentStatus = parsePaymentStatus(paymentRaw);
    if (!paymentStatus) errors.push(`Estado de pago desconocido: "${paymentRaw}".`);

    if (errors.length > 0) {
      invalid.push({ row, errors });
      continue;
    }

    const unitPrice = totalPrice / quantity;

    const validRow: ImportValidRow = {
      date: date!,
      clientName: clientName!,
      address,
      product: product!,
      dimension: dimension!,
      quantity,
      totalPrice,
      unitPrice,
      deliveryStatus: deliveryStatus!,
      paymentStatus: paymentStatus!,
      comments,
    };

    // Duplicate check by clientName (case-insensitive)
    const existingSale = existingNameMap.get(clientName!.toLowerCase());
    if (existingSale) {
      duplicates.push({
        incoming: validRow,
        existingClientName: existingSale.clientName,
        existingSaleId: existingSale.id,
      });
    } else {
      valid.push(validRow);
    }
  }

  return { valid, invalid, duplicates };
}

export async function insertConfirmedRows(rows: ImportValidRow[]) {
  // Group by clientName + date + address (one Sale per group)
  type GroupKey = string;
  const groups = new Map<GroupKey, ImportValidRow[]>();

  for (const row of rows) {
    const key = `${row.clientName}|${row.date}|${row.address}|${row.deliveryStatus}|${row.paymentStatus}|${row.comments}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  for (const [, groupRows] of groups) {
    const first = groupRows[0];

    const sale = await prisma.sale.create({
      data: {
        date: new Date(first.date),
        clientName: first.clientName,
        address: first.address || null,
        deliveryStatus: first.deliveryStatus,
        paymentStatus: first.paymentStatus,
        comments: first.comments || null,
      },
    });

    for (const row of groupRows) {
      const dim = await findOrCreateDimension(row.dimension);
      const product = await findOrCreateProduct(row.product, dim.id, row.unitPrice);

      await prisma.saleItem.create({
        data: {
          saleId: sale.id,
          productId: product.id,
          quantity: row.quantity,
        },
      });
    }
  }
}
