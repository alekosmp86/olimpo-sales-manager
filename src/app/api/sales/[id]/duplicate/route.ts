import { NextRequest, NextResponse } from "next/server";
import { duplicateSale } from "@/lib/services/saleService";
import { validateSession } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { id } = await params;
    const sale = await duplicateSale(id);
    return NextResponse.json(sale, { status: 201 });
  } catch (err) {
    console.error("[POST /api/sales/[id]/duplicate]", err);
    return NextResponse.json({ error: "Error al duplicar venta." }, { status: 500 });
  }
}
