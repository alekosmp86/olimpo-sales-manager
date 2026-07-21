import { NextRequest, NextResponse } from "next/server";
import { getClientSuggestions } from "@/lib/services/clientService";
import { validateSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await validateSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const searchQuery = request.nextUrl.searchParams.get("q") ?? "";
    const suggestions = await getClientSuggestions(searchQuery);

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("[GET /api/clients]", error);
    return NextResponse.json({ error: "Error al obtener clientes." }, { status: 500 });
  }
}
