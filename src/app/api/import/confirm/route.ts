import { NextRequest, NextResponse } from "next/server";
import { insertConfirmedRows } from "@/lib/services/importService";
import { validateSession } from "@/lib/session";
import type { ImportValidRow } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const rows: ImportValidRow[] = body.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No se recibieron filas." }, { status: 400 });
    }
    await insertConfirmedRows(rows);
    return NextResponse.json({ ok: true, inserted: rows.length });
  } catch (err) {
    console.error("[POST /api/import/confirm]", err);
    return NextResponse.json({ error: "Error al insertar datos." }, { status: 500 });
  }
}
