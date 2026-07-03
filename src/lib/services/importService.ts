import "server-only";
import { prisma } from "@/lib/prisma";
import { DeliveryStatus, PaymentStatus } from "@/lib/constants/statuses";
import { findOrCreateDimension } from "@/lib/services/dimensionService";
import { findOrCreateProduct } from "@/lib/services/productService";
import { resolveProductAliases } from "@/lib/services/aliasService";
import { standardizeDimension } from "@/lib/utils/dimensionUtils";
import type {
  CsvRow,
  ImportValidRow,
  ImportInvalidRow,
  ImportDuplicatePair,
  ImportClassificationResult,
} from "@/lib/types";

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
      ene: 0,
      feb: 1,
      mar: 2,
      abr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      ago: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dic: 11,
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


/**
 * Parses a price string using Uruguayan/Spanish locale conventions where
 * '.' is the thousands separator and ',' is the decimal separator.
 * e.g. "15.000" → 15000,  "19.500" → 19500,  "1.166.800" → 1166800
 */
function parseCsvFloat(raw: string | null | undefined): number {
  if (!raw) return NaN;
  // Strip thousands-separator dots, then replace decimal comma with dot
  const clean = raw.trim().replace(/\./g, "").replace(",", ".");
  return parseFloat(clean);
}

export async function validateAndClassifyRows(
  rows: CsvRow[]
): Promise<ImportClassificationResult | { unmatched: string[] }> {
  // Get all unique product names in the CSV
  const csvProductNames = Array.from(
    new Set(rows.map((r) => r.product?.trim()).filter(Boolean))
  );

  // Resolve against db aliases
  const aliasMap = await resolveProductAliases(csvProductNames);

  // Get standard names
  const existingProducts = await prisma.product.findMany({
    select: { name: true },
  });
  const standardNames = new Set(existingProducts.map((p) => p.name.toLowerCase()));

  // Find unmatched product names
  const unmatched = new Set<string>();
  for (const rawName of csvProductNames) {
    const clean = rawName.toLowerCase();
    if (!aliasMap.has(clean) && !standardNames.has(clean)) {
      unmatched.add(rawName);
    }
  }

  if (unmatched.size > 0) {
    return { unmatched: Array.from(unmatched) };
  }

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
    const phone = row.phone?.trim() ?? "";
    const address = row.address?.trim() ?? "";
    const productRaw = row.product?.trim();
    const dimensionRaw = row.dimension?.trim();
    const quantityStr = row.quantity?.trim();
    const totalPriceStr = row.totalPrice?.trim();
    const deliveryRaw = row.deliveryStatus?.trim() ?? "";
    const paymentRaw = row.paymentStatus?.trim() ?? "";
    const comments = row.comments?.trim() ?? "";

    // Silently skip rows that are completely blank (no date, no client, no product)
    if (!dateStr && !clientName && !productRaw) continue;

    const dateObj = parseCsvDate(dateStr);
    if (!dateObj) {
      errors.push("Fecha inválida o faltante.");
    }

    if (!clientName) errors.push("Nombre de cliente faltante.");
    if (!productRaw) errors.push("Producto faltante.");
    if (!dimensionRaw) errors.push("Dimensión faltante.");

    // Quantities may be written as "1/1" for split doses — take the minimum positive integer
    const quantityParts = (quantityStr ?? "").split("/").map((p) => parseInt(p.trim(), 10));
    const quantity = Math.min(...quantityParts.filter((n) => !isNaN(n) && n > 0));
    if (!isFinite(quantity) || quantity <= 0) errors.push("Cantidad inválida.");

    const totalPrice = parseCsvFloat(totalPriceStr);
    if (isNaN(totalPrice) || totalPrice < 0) errors.push("Precio total inválido.");

    const deliveryStatus = parseDeliveryStatus(deliveryRaw);
    const paymentStatus = parsePaymentStatus(paymentRaw);

    if (errors.length > 0) {
      invalid.push({ row, errors });
      continue;
    }

    const unitPrice = totalPrice / quantity;
    const cleanProductRaw = productRaw!.toLowerCase();
    const resolvedProduct = aliasMap.get(cleanProductRaw) ?? productRaw!;
    const resolvedDimension = standardizeDimension(dimensionRaw!);

    const validRow: ImportValidRow = {
      date: dateObj!.toISOString(),
      clientName: clientName!,
      phone: phone || undefined,
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
  for (const row of rows) {
    const sale = await prisma.sale.create({
      data: {
        date: new Date(row.date),
        clientName: row.clientName,
        phone: row.phone || null,
        address: row.address || null,
        deliveryStatus: row.deliveryStatus,
        paymentStatus: row.paymentStatus,
        comments: row.comments || null,
      },
    });

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
