# Deploying Olimpo Sales Manager

## Platform Recommendation: Vercel + Neon

Both Neon and Supabase offer a free-tier PostgreSQL database, but **Neon is the better fit** for this project:

|                        | Neon (Recommended)                       | Supabase                                       |
| ---------------------- | ---------------------------------------- | ---------------------------------------------- |
| **Free DB storage**    | 512 MB                                   | 500 MB                                         |
| **Connection model**   | Serverless / pooled (perfect for Vercel) | Dedicated (can exhaust connections)            |
| **Prisma support**     | Native, first-class                      | Good, but requires `pgbouncer=true` workaround |
| **Connection pooling** | Built-in (no extra config)               | Requires Supabase's pooler URL                 |
| **Cold starts**        | Auto-suspend on free tier (< 1s wake)    | Always-on on free tier                         |
| **Vercel integration** | One-click from Vercel dashboard          | Manual setup                                   |

Neon's serverless connection pooling pairs naturally with Vercel's serverless functions and requires zero extra configuration with `@prisma/adapter-pg`.

---

## ✅ Auth Proxy — Already Correct

**`src/proxy.ts` is the right filename.** As of Next.js 16, the framework officially renamed `middleware.ts` to `proxy.ts` to better reflect its role as a network-level request boundary rather than Express-style chained middleware. The Next.js docs now use the term "Proxy" in the Getting Started navigation, and a codemod (`npx @next/codemod@canary middleware-to-proxy`) was provided to migrate older projects.

This project's `src/proxy.ts` is already using the current convention. No changes needed.

> [!IMPORTANT]
> The proxy calls `checkUserExists()` which hits the database on every matching request. This database check is intentional: it ensures that if a user is deleted from the database, their active sessions are instantly invalidated. Without this check, a deleted user's JWT remains valid for up to 7 days. Because Next.js configures the proxy matcher to ignore static assets, this DB check only runs on API requests and page transitions.

---

## Step-by-Step Deployment

### 1. Set up the repository on GitHub

```bash
git init          # if not already a git repo
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-username>/olimpo-sales-manager.git
git push -u origin main
```

> `.env` is already in `.gitignore` — secrets will never be committed.

---

### 2. Create a Neon database

1. Go to [neon.tech](https://neon.tech) → **Sign up free**.
2. Create a new project (e.g. `olimpo-db`).
3. Copy the **connection string** — it looks like:
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Keep this tab open — you'll need it for Vercel.

---

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your GitHub repo.
2. Vercel auto-detects Next.js — no framework changes needed.
3. Before clicking **Deploy**, go to **Environment Variables** and add:

| Variable         | Value                                                 |
| ---------------- | ----------------------------------------------------- |
| `DATABASE_URL`   | Your Neon connection string (with `?sslmode=require`) |
| `SESSION_SECRET` | A random 64-character string (see below)              |
| `NODE_ENV`       | `production`                                          |

**Generating a secure `SESSION_SECRET`:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. Click **Deploy**.

---

### 4. Run Prisma migrations on the new database

After deploy, you need to push the schema to Neon. Run this from your **local machine** with the Neon `DATABASE_URL` set in your `.env`:

```bash
# Temporarily set DATABASE_URL to your Neon connection string in .env, then:

# Option A — Push schema directly (recommended for first deploy, no migration history)
npx prisma db push

# Option B — Use migrations (recommended for ongoing deployments)
npx prisma migrate deploy
```

> [!NOTE]
> **`db push` vs `migrate deploy`**
>
> - `prisma db push` — fast, syncs schema without a migration history. Good for initial setup or solo projects.
> - `prisma migrate deploy` — applies pending migration files from `prisma/migrations/`. Required if you use `prisma migrate dev` locally and want reproducible deployments.
> - Since this project currently has no `prisma/migrations/` folder, **start with `db push`**. When you make future schema changes, run `npx prisma migrate dev --name <description>` locally to generate the migration, commit it, then use `migrate deploy` in production.

---

### 5. Create the first user

There is no registration UI — users must be created directly via a script or Prisma Studio:

```bash
# Open Prisma Studio (GUI) — connects to your Neon DB
npx prisma studio

# — OR — run a one-time seed script
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('yourpassword', 12);
  await prisma.user.create({ data: { username: 'admin', passwordHash: hash } });
  console.log('User created');
  await prisma.\$disconnect();
}
main();
"
```

---

### 6. Vercel Build Command (auto-configured)

Vercel runs `npm run build` which executes `next build`. Prisma client is generated automatically during build because `@prisma/client` is in `dependencies` (not `devDependencies`) and Vercel runs `npm install` before build.

If you ever see `PrismaClient is unable to be run in the browser`, add this to `package.json`:

```json
"scripts": {
  "build": "prisma generate && next build"
}
```

---

## Prisma Command Reference

| Command                               | When to use                                                   |
| ------------------------------------- | ------------------------------------------------------------- |
| `npx prisma generate`                 | Regenerate the TypeScript client after schema changes         |
| `npx prisma db push`                  | Push schema to DB without migration files (dev/initial setup) |
| `npx prisma migrate dev --name <msg>` | Create a migration file + apply it locally (ongoing dev)      |
| `npx prisma migrate deploy`           | Apply pending migrations in production                        |
| `npx prisma migrate reset`            | ⚠️ Drops and recreates DB — **local dev only**                |
| `npx prisma studio`                   | Open GUI to browse/edit DB records                            |
| `npx prisma db seed`                  | Run `prisma/seed.ts` if you add a seed file                   |

---

## Environment Variables Summary

```env
# .env (local) / Vercel Environment Variables (production)

# Neon PostgreSQL connection string
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# JWT session secret — minimum 32 chars, ideally 64
SESSION_SECRET="your-long-random-secret-here"

# Node environment
NODE_ENV="production"
```

---

## Post-Deploy Checklist

- [ ] `DATABASE_URL` set in Vercel with `?sslmode=require`
- [ ] `SESSION_SECRET` is at least 32 random characters
- [ ] `npx prisma db push` run against the Neon DB
- [ ] First admin user created
- [ ] Login works at `https://your-app.vercel.app/login`
- [ ] Import a CSV and verify data appears in the table
- [ ] Verify delivery/payment status dropdowns save correctly

---

## Project Review & Suggestions for Future Improvements

### 🟠 High Priority

1. **Add a `postinstall` script**: `"postinstall": "prisma generate"` — ensures the Prisma client is always regenerated after `npm install` in CI/CD and fresh checkouts.
2. **Generate migration files** — run `npx prisma migrate dev --name init` locally to create `prisma/migrations/`. This makes future schema changes reproducible and safe to deploy.

### 🟡 Medium Priority

1. **Rate-limit the login endpoint** — `/api/auth/login` has no brute-force protection. A simple in-memory counter or Vercel's edge rate limiting would help.
2. **Session refresh** — sessions expire after 7 days with no automatic renewal. Add a middleware step that re-issues the JWT on each visit.
3. **Error boundaries in the UI** — if a React Query fetch fails silently, the table shows an empty state with no visible error message. Add an `error` state display.
4. **`DIRECT_URL` for migrations** — when using Neon's connection pooler, add a `DIRECT_URL` env var pointing to the non-pooled connection and set it in `schema.prisma` as `directUrl`. This prevents migration timeouts.

### 🟢 Nice to Have

1. **Export to CSV** — mirror of the import feature, allowing download of the current month's filtered sales.
2. **Sales totals row** — total units and total revenue displayed at the bottom of the visible month's table.
3. **Seed file** — `prisma/seed.ts` with initial product aliases and dimensions for faster fresh installs.
4. **PWA offline support** — the `manifest.webmanifest` is already in place; adding a service worker would make the app installable and usable offline on tablets.
