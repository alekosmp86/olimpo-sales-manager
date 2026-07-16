import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/session";
import { getStorages, createStorage } from "@/modules/stock/services/storageService";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
});

export async function GET() {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const storages = await getStorages();
  return NextResponse.json(storages);
}

export async function POST(req: NextRequest) {
  const session = await validateSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const storage = await createStorage(parsed.data);
    return NextResponse.json(storage, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al crear depósito.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
