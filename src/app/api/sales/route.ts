import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSales, createSale } from "@/lib/services/saleService";

const CreateSaleSchema = z.object({
  date: z.string().datetime({ offset: true }).or(z.string().date()),
  clientName: z.string(),
  address: z.string().optional(),
  comments: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search") ?? undefined;
    const sales = await getSales(search);
    return NextResponse.json(sales);
  } catch (err) {
    console.error("[GET /api/sales]", err);
    return NextResponse.json({ error: "Error al obtener ventas." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { date, clientName, address, comments } = parsed.data;
    const sale = await createSale({
      date: new Date(date),
      clientName,
      address,
      comments,
    });
    return NextResponse.json(sale, { status: 201 });
  } catch (err) {
    console.error("[POST /api/sales]", err);
    return NextResponse.json({ error: "Error al crear venta." }, { status: 500 });
  }
}
