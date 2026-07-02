import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProducts, createProduct } from "@/lib/services/productService";

const CreateProductSchema = z.object({
  name: z.string().min(1, "Nombre requerido."),
  dimensionId: z.string().min(1, "Dimensión requerida."),
  unitPrice: z.number().positive("El precio debe ser mayor a 0."),
});

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ error: "Error al obtener productos." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const product = await createProduct(parsed.data);
    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Unique")) {
      return NextResponse.json(
        { error: "Ya existe un producto con ese nombre y dimensión." },
        { status: 409 }
      );
    }
    console.error("[POST /api/products]", err);
    return NextResponse.json({ error: "Error al crear producto." }, { status: 500 });
  }
}
