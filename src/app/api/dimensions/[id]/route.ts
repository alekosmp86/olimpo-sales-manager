import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateDimension, deleteDimension } from "@/lib/services/dimensionService";

const UpdateSchema = z.object({ label: z.string().min(1) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const dimension = await updateDimension(id, parsed.data.label);
    return NextResponse.json(dimension);
  } catch (err) {
    console.error("[PATCH /api/dimensions/[id]]", err);
    return NextResponse.json({ error: "Error al actualizar dimensión." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDimension(id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[DELETE /api/dimensions/[id]]", err);
    return NextResponse.json({ error: "Error al eliminar dimensión." }, { status: 500 });
  }
}
