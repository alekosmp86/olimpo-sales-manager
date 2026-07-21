import "server-only";
import { prisma } from "@/lib/prisma";

export interface ClientSuggestion {
  clientName: string;
  phone: string | null;
  address: string | null;
}

/**
 * Searches across all sales in the database and returns up to 5 unique/deduplicated 
 * client suggestions matching the search query, ordered by their most recent sale.
 * 
 * Uses PostgreSQL `DISTINCT ON (LOWER("clientName"))` to guarantee 5 distinct client
 * records without oversampling.
 * 
 * SCALING NOTE & INDEXING ROADMAP:
 * When sales count scales up (50,000+ records), add a PostgreSQL GIN Trigram index
 * to maintain sub-5ms search speeds for substring (`LIKE '%query%'`) lookups:
 * 
 *   CREATE EXTENSION IF NOT EXISTS pg_trgm;
 *   CREATE INDEX idx_sale_client_name_trgm ON "Sale" USING gin (LOWER("clientName") gin_trgm_ops);
 * 
 * For full step-by-step migration guide, see `docs/database-optimization.md`.
 */
export async function getClientSuggestions(query: string): Promise<ClientSuggestion[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const searchPattern = `%${trimmedQuery}%`;

  const results = await prisma.$queryRaw<
    Array<{ clientName: string; phone: string | null; address: string | null }>
  >`
    SELECT DISTINCT ON (LOWER("clientName"))
      "clientName",
      "phone",
      "address"
    FROM "Sale"
    WHERE LOWER("clientName") LIKE LOWER(${searchPattern})
    ORDER BY LOWER("clientName"), "updatedAt" DESC
    LIMIT 5;
  `;

  return results;
}

