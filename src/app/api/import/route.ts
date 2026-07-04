import { NextRequest, NextResponse } from "next/server";
import { validateAndClassifyRows } from "@/lib/services/importService";
import { validateSession } from "@/lib/session";
import type { CsvRow } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const rows: CsvRow[] = body.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No se recibieron filas." }, { status: 400 });
    }
    const result = await validateAndClassifyRows(rows);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/import]", err);
    return NextResponse.json({ error: "Error al procesar el archivo." }, { status: 500 });
  }
}
