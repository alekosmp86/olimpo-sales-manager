import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";
import { checkUserExists } from "@/lib/services/userService";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/me"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/icons") ||
    pathname.match(/\.(ico|png|svg|webmanifest)$/)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("olimpo_session")?.value;
  const session = await decrypt(token);

  const userExists = session?.userId ? await checkUserExists(session.userId) : false;

  if (!session || !userExists) {
    // If it's an API request, return a 401 Unauthorized instead of redirecting
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
