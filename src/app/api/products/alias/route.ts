import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createProductAlias } from "@/lib/services/aliasService";
import { validateSession } from "@/lib/session";

const AliasMappingSchema = z.object({
  mappings: z.array(
    z.object({
      alias: z.string().min(1),
      name: z.string().min(1),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = AliasMappingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    for (const mapping of parsed.data.mappings) {
      await createProductAlias(mapping.alias, mapping.name);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/products/alias]", err);
    return NextResponse.json(
      { error: "Error al guardar asociaciones de alias." },
      { status: 500 }
    );
  }
}
