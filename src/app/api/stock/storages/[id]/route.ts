import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/session";
import { updateStorage, deleteStorage } from "@/modules/stock/services/storageService";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const storage = await updateStorage(id, parsed.data as Parameters<typeof updateStorage>[1]);
    return NextResponse.json(storage);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al actualizar depósito.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { id } = await params;
  try {
    await deleteStorage(id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al eliminar depósito.";
    const status = msg.includes("No se puede") ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
