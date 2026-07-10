import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSales, createSale, deleteSales } from "@/lib/services/saleService";
import { validateSession } from "@/lib/session";

const CreateSaleSchema = z.object({
  date: z.iso.datetime({ offset: true }).or(z.iso.date()),
  clientName: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  comments: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const search = req.nextUrl.searchParams.get("search") ?? undefined;
    const yearParam = req.nextUrl.searchParams.get("year");
    const monthParam = req.nextUrl.searchParams.get("month");

    const year = yearParam ? parseInt(yearParam, 10) : undefined;
    const month = monthParam ? parseInt(monthParam, 10) : undefined;

    const hasValidDateFilter =
      year !== undefined && !isNaN(year) && month !== undefined && !isNaN(month);

    const sales = await getSales(
      hasValidDateFilter ? year : undefined,
      hasValidDateFilter ? month : undefined,
      search
    );
    return NextResponse.json(sales);
  } catch (err) {
    console.error("[GET /api/sales]", err);
    return NextResponse.json({ error: "Error al obtener ventas." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { date, clientName, phone, address, comments } = parsed.data;
    const sale = await createSale({
      date: new Date(date),
      clientName,
      phone,
      address,
      comments,
    });
    return NextResponse.json(sale, { status: 201 });
  } catch (err) {
    console.error("[POST /api/sales]", err);
    return NextResponse.json({ error: "Error al crear venta." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const { ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs no válidos o vacíos." },
        { status: 400 }
      );
    }

    await deleteSales(ids);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/sales]", err);
    return NextResponse.json({ error: "Error al eliminar ventas." }, { status: 500 });
  }
}
