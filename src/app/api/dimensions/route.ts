import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDimensions, createDimension } from "@/lib/services/dimensionService";

const CreateDimensionSchema = z.object({
  label: z.string().min(1, "Etiqueta requerida."),
});

export async function GET() {
  try {
    const dimensions = await getDimensions();
    return NextResponse.json(dimensions);
  } catch (err) {
    console.error("[GET /api/dimensions]", err);
    return NextResponse.json({ error: "Error al obtener dimensiones." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateDimensionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const dimension = await createDimension(parsed.data.label);
    return NextResponse.json(dimension, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Unique")) {
      return NextResponse.json({ error: "Ya existe esa dimensión." }, { status: 409 });
    }
    console.error("[POST /api/dimensions]", err);
    return NextResponse.json({ error: "Error al crear dimensión." }, { status: 500 });
  }
}
