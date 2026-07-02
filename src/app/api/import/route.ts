import { NextRequest, NextResponse } from "next/server";
import { validateAndClassifyRows } from "@/lib/services/importService";
import type { CsvRow } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
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
