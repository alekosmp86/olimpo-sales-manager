import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/session";
import { processSaleDelivery } from "@/modules/stock/services/deliveryService";
import { z } from "zod";

const DeliverSchema = z.object({
  saleId: z.string().min(1),
  overrides: z
    .array(
      z.object({
        saleItemId: z.string().min(1),
        storageId: z.string().min(1),
      })
    )
    .optional()
    .default([]),
});

export async function POST(req: NextRequest) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = DeliverSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { saleId, overrides } = parsed.data;
    const result = await processSaleDelivery(saleId, overrides);

    if (result.unresolvedItems.length > 0) {
      // Surface unresolved items — frontend must prompt the user and re-submit with overrides
      return NextResponse.json({ unresolvedItems: result.unresolvedItems }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[POST /api/stock/deliver]", err);
    const msg = err instanceof Error ? err.message : "Error al procesar la entrega.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
