import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/session";
import { getStockEvents } from "@/modules/stock/services/stockEventService";

export async function GET(req: NextRequest) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const params = req.nextUrl.searchParams;
    const storageId = params.get("storageId") ?? undefined;
    const productId = params.get("productId") ?? undefined;
    const limitParam = params.get("limit");
    const cursor = params.get("cursor") ?? undefined;
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50;

    const result = await getStockEvents({ storageId, productId, limit, cursor });
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[GET /api/stock/events]", err);
    return NextResponse.json({ error: "Error al obtener eventos." }, { status: 500 });
  }
}
