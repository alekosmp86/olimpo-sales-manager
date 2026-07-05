import "server-only";
import { prisma } from "@/lib/prisma";

export async function createProductAlias(alias: string, name: string) {
  const cleanAlias = alias.trim().toLowerCase();
  const cleanName = name.trim();
  return prisma.productAlias.upsert({
    where: { alias: cleanAlias },
    update: { name: cleanName },
    create: { alias: cleanAlias, name: cleanName },
  });
}

export async function resolveProductAliases(rawNames: string[]) {
  const cleanNames = rawNames.map((n) => n.trim().toLowerCase());
  const aliases = await prisma.productAlias.findMany({
    where: { alias: { in: cleanNames } },
  });

  const aliasMap = new Map<string, string>();
  for (const a of aliases) {
    aliasMap.set(a.alias, a.name);
  }
  return aliasMap;
}
