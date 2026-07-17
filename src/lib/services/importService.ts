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
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }

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
      return new Date(Date.UTC(year, month, day));
    }
  }
  return null;
}

function getUtcDateStr(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
    new Set(
      rows.flatMap((r) => {
        const p = r.product?.trim();
        return p ? [p] : [];
      })
    )
  );

  // Resolve against db aliases and get standard names concurrently
  const [aliasMap, existingProducts] = await Promise.all([
    resolveProductAliases(csvProductNames),
    prisma.product.findMany({ select: { name: true } }),
  ]);

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

  // Fetch existing sales with items (products), dates, phones, addresses
  const existingSales = await prisma.sale.findMany({
    select: {
      id: true,
      clientName: true,
      phone: true,
      address: true,
      date: true,
      items: {
        select: {
          product: {
            select: {
              name: true,
              dimension: {
                select: {
                  label: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Group existing sales by lowercase client name
  const existingSalesByName = new Map<string, typeof existingSales>();
  for (const sale of existingSales) {
    const key = sale.clientName.toLowerCase();
    if (!existingSalesByName.has(key)) {
      existingSalesByName.set(key, []);
    }
    existingSalesByName.get(key)!.push(sale);
  }

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
      rowNumber: row.rowNumber,
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

    // Duplicate check
    const nameKey = clientName!.toLowerCase();
    const matchSales = existingSalesByName.get(nameKey);

    if (matchSales && matchSales.length > 0) {
      const incomingDateStr = getUtcDateStr(dateObj!);
      
      const exactDuplicateSale = matchSales.find((s) => {
        const existingDateStr = getUtcDateStr(s.date);
        const isSameDate = existingDateStr === incomingDateStr;
        const hasSameProduct = s.items.some((item) => {
          const nameMatches =
            item.product.name.toLowerCase() === resolvedProduct.toLowerCase();
          const dimensionMatches =
            item.product.dimension.label.toLowerCase() === resolvedDimension.toLowerCase();
          return nameMatches && dimensionMatches;
        });
        return isSameDate && hasSameProduct;
      });

      // Use the last sale (likely most recent) as representative for details
      const representativeSale = matchSales[matchSales.length - 1];

      if (exactDuplicateSale) {
        duplicates.push({
          type: "exact_duplicate",
          incoming: validRow,
          existingClientName: exactDuplicateSale.clientName,
          existingSaleDate: getUtcDateStr(exactDuplicateSale.date),
          existingSaleProduct: exactDuplicateSale.items.map((item) => `${item.product.name} ${item.product.dimension.label}`).join(', '),
          existingPhone: exactDuplicateSale.phone,
          existingAddress: exactDuplicateSale.address,
          existingSaleId: exactDuplicateSale.id,
        });
      } else {
        duplicates.push({
          type: "name_conflict",
          incoming: validRow,
          existingClientName: representativeSale.clientName,
          existingSaleDate: getUtcDateStr(representativeSale.date),
          existingSaleProduct: representativeSale.items.map((item) => `${item.product.name} ${item.product.dimension.label}`).join(', '),
          existingPhone: representativeSale.phone,
          existingAddress: representativeSale.address,
          existingSaleId: representativeSale.id,
        });
      }
    } else {
      valid.push(validRow);
    }
  }

  return { valid, invalid, duplicates };
}

export async function insertConfirmedRows(rows: ImportValidRow[]) {
  // Pre-resolve all unique dimensions concurrently to avoid race conditions.
  const uniqueDimensions = Array.from(new Set(rows.map((row) => row.dimension.trim())));
  const dims = await Promise.all(
    uniqueDimensions.map((label) => findOrCreateDimension(label))
  );
  const dimensionMap = new Map<string, string>(); // label -> id
  for (const dim of dims) {
    dimensionMap.set(dim.label, dim.id);
  }

  // Pre-resolve all unique products concurrently to avoid race conditions.
  const uniqueProductKeys = new Map<string, { name: string; dimensionId: string; unitPrice: number }>();
  for (const row of rows) {
    const dimId = dimensionMap.get(row.dimension);
    if (!dimId) continue;
    const key = `${row.product.trim().toLowerCase()}|${dimId}`;
    if (!uniqueProductKeys.has(key)) {
      uniqueProductKeys.set(key, {
        name: row.product,
        dimensionId: dimId,
        unitPrice: row.unitPrice,
      });
    }
  }

  const products = await Promise.all(
    Array.from(uniqueProductKeys.values()).map((product) =>
      findOrCreateProduct(product.name, product.dimensionId, product.unitPrice)
    )
  );

  const productMap = new Map<string, string>(); // name.toLowerCase()|dimensionId -> id
  for (const prod of products) {
    productMap.set(`${prod.name.toLowerCase()}|${prod.dimensionId}`, prod.id);
  }

  // Create sales and items concurrently using Promise.all (one sale record per CSV row)
  await Promise.all(
    rows.map(async (row) => {
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

      const dimId = dimensionMap.get(row.dimension);
      if (!dimId) return;
      const prodId = productMap.get(`${row.product.trim().toLowerCase()}|${dimId}`);
      if (!prodId) return;

      await prisma.saleItem.create({
        data: {
          saleId: sale.id,
          productId: prodId,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
        },
      });
    })
  );
}


