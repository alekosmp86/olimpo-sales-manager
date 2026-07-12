import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/session";
import { checkTransferConflict, executeTransfer } from "@/modules/stock/services/transferService";
import { z } from "zod";

const TransferSchema = z.object({
  fromStorageId: z.string().min(1),
  toStorageId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().positive("La cantidad debe ser mayor a cero"),
  force: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = TransferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { fromStorageId, toStorageId, productId, quantity, force, notes } = parsed.data;

    // If not forced, check for reservation conflict first and surface it
    if (!force) {
      const conflict = await checkTransferConflict(fromStorageId, productId, quantity);
      if (conflict) {
        return NextResponse.json(
          { error: "RESERVATION_CONFLICT", conflict },
          { status: 409 }
        );
      }
    }

    await executeTransfer({ fromStorageId, toStorageId, productId, quantity, force, notes });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al realizar la transferencia.";
    const status = msg.includes("insuficiente") || msg.includes("mismo") ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
