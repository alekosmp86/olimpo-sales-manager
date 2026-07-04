import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateProduct, deleteProduct } from "@/lib/services/productService";
import { validateSession } from "@/lib/session";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  dimensionId: z.string().min(1).optional(),
  unitPrice: z.number().positive().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const product = await updateProduct(id, parsed.data);
    return NextResponse.json(product);
  } catch (err) {
    console.error("[PATCH /api/products/[id]]", err);
    return NextResponse.json({ error: "Error al actualizar producto." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { id } = await params;
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[DELETE /api/products/[id]]", err);
    return NextResponse.json({ error: "Error al eliminar producto." }, { status: 500 });
  }
}
