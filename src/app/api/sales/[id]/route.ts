import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateSale, deleteSales } from "@/lib/services/saleService";
import { DeliveryStatus, PaymentStatus } from "@/lib/constants/statuses";
import { validateSession } from "@/lib/session";

const UpdateSaleSchema = z.object({
  date: z.string().optional(),
  clientName: z.string().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  deliveryStatus: z.enum([DeliveryStatus.NOT_DELIVERED, DeliveryStatus.DELIVERED]).optional(),
  paymentStatus: z
    .enum([
      PaymentStatus.NOT_PAID,
      PaymentStatus.WAITING_BANK_CONFIRMATION,
      PaymentStatus.PAID,
    ])
    .optional(),
  comments: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .optional(),
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
    const parsed = UpdateSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { date, ...rest } = parsed.data;
    const data = {
      ...rest,
      date: date ? new Date(date) : undefined,
    };

    const sale = await updateSale(id, data);
    return NextResponse.json(sale);
  } catch (err) {
    console.error("[PATCH /api/sales/[id]]", err);
    return NextResponse.json({ error: "Error al actualizar venta." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { id } = await params;
    await deleteSales([id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/sales/[id]]", err);
    return NextResponse.json({ error: "Error al eliminar venta." }, { status: 500 });
  }
}
