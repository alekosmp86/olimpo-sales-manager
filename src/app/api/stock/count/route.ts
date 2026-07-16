import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/session";
import { performCount } from "@/modules/stock/services/countService";
import { z } from "zod";

const CountSchema = z.object({
  storageId: z.string().min(1),
  entries: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(0, "La cantidad no puede ser negativa"),
    })
  ).min(1, "Debe ingresar al menos un producto"),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = CountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { storageId, entries, notes } = parsed.data;
    const result = await performCount(storageId, entries, notes);
    return NextResponse.json({ ok: true, warnings: result.warnings });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al realizar el conteo.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
