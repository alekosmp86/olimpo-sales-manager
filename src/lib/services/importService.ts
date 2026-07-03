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

function parseCsvDate(str: string): Date | null {
  if (!str) return null;
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) return new Date(parsed);

  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);

    const months: Record<string, number> = {
      jan: 0, ene: 0,
      feb: 1,
      mar: 2,
      apr: 3, abr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7, ago: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11, dic: 11,
    };

    const month = months[monthStr.substring(0, 3)];
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  return null;
}

function parseDeliveryStatus(raw: string | null | undefined): DeliveryStatus {
  if (!raw) return DeliveryStatus.NOT_DELIVERED;
  const clean = raw.trim().toLowerCase();
  if (clean === "e") {
    return DeliveryStatus.DELIVERED;
  }
  return DeliveryStatus.NOT_DELIVERED;
}

function parsePaymentStatus(raw: string | null | undefined): PaymentStatus {
  if (!raw) return PaymentStatus.NOT_PAID;
  const clean = raw.trim().toLowerCase();
  if (clean === "p") {
    return PaymentStatus.PAID;
  }
  if (clean === "w") {
    return PaymentStatus.WAITING_BANK_CONFIRMATION;
  }
  return PaymentStatus.NOT_PAID;
}

function resolveProductAlias(rawName: string | null | undefined): string {
  if (!rawName) return "";
  const clean = rawName.trim().toLowerCase();
  const PRODUCT_ALIASES: Record<string, string> = {
    w: "Wegovy",
    o: "Ozempic",
  };
  return PRODUCT_ALIASES[clean] ?? rawName.trim();
}

function standardizeDimension(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.trim().replace(",", ".");
}

function parseCsvFloat(raw: string | null | undefined): number {
  if (!raw) return NaN;
  const clean = raw.trim().replace(",", ".");
  return parseFloat(clean);
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

    const dateStr = row.date?.trim();
    const clientName = row.clientName?.trim();
    const address = row.address?.trim() ?? "";
    const productRaw = row.product?.trim();
    const dimensionRaw = row.dimension?.trim();
    const quantityStr = row.quantity?.trim();
    const totalPriceStr = row.totalPrice?.trim();
    const deliveryRaw = row.deliveryStatus?.trim() ?? "";
    const paymentRaw = row.paymentStatus?.trim() ?? "";
    const comments = row.comments?.trim() ?? "";

    const dateObj = parseCsvDate(dateStr);
    if (!dateObj) {
      errors.push("Fecha inválida o faltante.");
    }

    if (!clientName) errors.push("Nombre de cliente faltante.");
    if (!productRaw) errors.push("Producto faltante.");
    if (!dimensionRaw) errors.push("Dimensión faltante.");

    const quantity = parseInt(quantityStr, 10);
    if (isNaN(quantity) || quantity <= 0) errors.push("Cantidad inválida.");

    const totalPrice = parseCsvFloat(totalPriceStr);
    if (isNaN(totalPrice) || totalPrice < 0) errors.push("Precio total inválido.");

    const deliveryStatus = parseDeliveryStatus(deliveryRaw);
    const paymentStatus = parsePaymentStatus(paymentRaw);

    if (errors.length > 0) {
      invalid.push({ row, errors });
      continue;
    }

    const unitPrice = totalPrice / quantity;
    const resolvedProduct = resolveProductAlias(productRaw!);
    const resolvedDimension = standardizeDimension(dimensionRaw!);

    const validRow: ImportValidRow = {
      date: dateObj!.toISOString(),
      clientName: clientName!,
      address,
      product: resolvedProduct,
      dimension: resolvedDimension,
      quantity,
      totalPrice,
      unitPrice,
      deliveryStatus,
      paymentStatus,
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
