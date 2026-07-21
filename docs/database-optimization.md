# Database Optimization & Scaling Guide

This document outlines database query optimizations and future indexing procedures as the dataset grows.

---

## Client Autocomplete Search

### Architecture & Current Implementation
Client suggestions in the sales grid (`ClientNameCell`) query all sales across the database via `getClientSuggestions` in `src/lib/services/clientService.ts`.

To avoid oversampling repeat clients or missing distinct matches, the query uses PostgreSQL's native `DISTINCT ON` clause:

```sql
SELECT DISTINCT ON (LOWER("clientName"))
  "clientName",
  "phone",
  "address"
FROM "Sale"
WHERE LOWER("clientName") LIKE LOWER($1)
ORDER BY LOWER("clientName"), "updatedAt" DESC
LIMIT 5;
```

### Performance Scaling & Trigram Indexing

#### Current Behavior (< 10,000 Sales)
For smaller datasets, PostgreSQL performs a sequential scan over the `Sale` table. Because `DISTINCT ON` limits results at the engine level, execution takes < 5ms without requiring custom indexes.

#### Scaling Behavior (50,000+ Sales)
As the sales database expands beyond tens of thousands of rows, substring matches (`LIKE '%query%'`) will require more CPU and I/O during sequential scans.

To maintain sub-5ms autocomplete responses at high scale, add a PostgreSQL **GIN Trigram Index**.

---

### Step-by-Step Guide: Adding the Trigram Index

When sales count reaches scale (50,000+ rows):

#### 1. Create a Prisma Migration
Run the following command to generate an empty migration file:
```bash
npx prisma migrate dev --create-only --name add_trigram_index_on_client_name
```

#### 2. Edit the Generated SQL Migration File
Add the following SQL statements to the generated `migration.sql` file:

```sql
-- Enable the PostgreSQL Trigram extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index on case-insensitive clientName for instant LIKE '%query%' search
CREATE INDEX IF NOT EXISTS "idx_sale_client_name_trgm"
ON "Sale" USING gin (LOWER("clientName") gin_trgm_ops);
```

#### 3. Apply the Migration
Apply the migration to your database:
```bash
npx prisma migrate deploy
```

#### 4. Verification
Verify index usage in PostgreSQL by running an `EXPLAIN ANALYZE`:
```sql
EXPLAIN ANALYZE
SELECT DISTINCT ON (LOWER("clientName")) "clientName", "phone", "address"
FROM "Sale"
WHERE LOWER("clientName") LIKE LOWER('%test%')
ORDER BY LOWER("clientName"), "updatedAt" DESC
LIMIT 5;
```
The execution plan should show `Bitmap Index Scan on idx_sale_client_name_trgm`.
