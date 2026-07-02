import "server-only";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function getUserCount(): Promise<number> {
  return prisma.user.count();
}

export async function createUser(username: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: { username, passwordHash },
    select: { id: true, username: true },
  });
}

export async function verifyUser(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return { id: user.id, username: user.username };
}
