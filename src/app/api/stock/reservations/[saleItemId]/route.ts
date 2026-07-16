import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/session";
import { deleteReservation } from "@/modules/stock/services/reservationService";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ saleItemId: string }> }
) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { saleItemId } = await params;
  try {
    await deleteReservation(saleItemId);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[DELETE /api/stock/reservations/[saleItemId]]", err);
    return NextResponse.json({ error: "Error al eliminar la reserva." }, { status: 500 });
  }
}
