import { NextResponse } from "next/server";
import { validateSession } from "@/lib/session";
import { getUserCount } from "@/lib/services/userService";

export async function GET() {
  const session = await validateSession();
  const userCount = await getUserCount();

  if (!session) {
    return NextResponse.json(
      { authenticated: false, firstTime: userCount === 0 },
      { status: 401 }
    );
  }
  return NextResponse.json({ authenticated: true, userId: session.userId });
}
