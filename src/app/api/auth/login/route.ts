import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserCount, createUser, verifyUser } from "@/lib/services/userService";
import { createSession } from "@/lib/session";

const LoginSchema = z.object({
  username: z.string().min(1, "Usuario requerido."),
  password: z.string().min(1, "Contraseña requerida."),
  confirmPassword: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { username, password, confirmPassword } = parsed.data;
    const count = await getUserCount();

    if (count === 0) {
      // First-time setup — create the user
      if (!confirmPassword) {
        return NextResponse.json(
          { error: "Se requiere confirmación de contraseña.", firstTime: true },
          { status: 400 }
        );
      }
      if (password !== confirmPassword) {
        return NextResponse.json(
          { error: "Las contraseñas no coinciden." },
          { status: 400 }
        );
      }
      const user = await createUser(username, password);
      await createSession(user.id);
      return NextResponse.json({ ok: true, firstTime: true });
    }

    // Normal login
    const user = await verifyUser(username, password);
    if (!user) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos." },
        { status: 401 }
      );
    }
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
