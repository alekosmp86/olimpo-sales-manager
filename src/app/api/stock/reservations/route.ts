import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/session";
import {
  getReservationsForSale,
  upsertReservation,
} from "@/modules/stock/services/reservationService";
import { z } from "zod";

const UpsertSchema = z.object({
  saleItemId: z.string().min(1),
  storageId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export async function GET(req: NextRequest) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const saleId = req.nextUrl.searchParams.get("saleId");
  if (!saleId) {
    return NextResponse.json({ error: "Se requiere saleId." }, { status: 400 });
  }

  try {
    const reservations = await getReservationsForSale(saleId);
    return NextResponse.json(reservations);
  } catch (err: unknown) {
    console.error("[GET /api/stock/reservations]", err);
    return NextResponse.json({ error: "Error al obtener reservas." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = UpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const reservation = await upsertReservation(parsed.data);
    return NextResponse.json(reservation);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al guardar la reserva.";
    const status = msg.includes("stock físico") ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
