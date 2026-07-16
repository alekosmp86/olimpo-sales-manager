import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/session";
import { getStockLines, getStoragesWithStockForProduct } from "@/modules/stock/services/stockLineService";

export async function GET(req: NextRequest) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const storageId = req.nextUrl.searchParams.get("storageId");
    const productId = req.nextUrl.searchParams.get("productId");

    if (productId && !storageId) {
      // Return all storages that have physical stock for this product (for picker)
      const data = await getStoragesWithStockForProduct(productId);
      return NextResponse.json(data);
    }

    if (!storageId) {
      return NextResponse.json({ error: "Se requiere storageId o productId." }, { status: 400 });
    }

    const lines = await getStockLines(storageId);
    return NextResponse.json(lines);
  } catch (err: unknown) {
    console.error("[GET /api/stock/stock-lines]", err);
    return NextResponse.json({ error: "Error al obtener stock." }, { status: 500 });
  }
}
