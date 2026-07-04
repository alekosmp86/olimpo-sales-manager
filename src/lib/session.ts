import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { checkUserExists } from "./services/userService";

const SESSION_COOKIE = "olimpo_session";
const secretKey = process.env.SESSION_SECRET;

function getEncodedKey() {
  if (!secretKey) throw new Error("SESSION_SECRET environment variable is not set");
  return new TextEncoder().encode(secretKey);
}

export interface SessionPayload {
  userId: string;
  expiresAt: Date;
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey());
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await encrypt({ userId, expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function validateSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await decrypt(token);
  if (!session) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  const userExists = await checkUserExists(session.userId);
  if (!userExists) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return session;
}
