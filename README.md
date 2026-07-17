# Olimpo Sales Manager (OSM)

A full-stack internal sales management system built for a real business, designed to replace spreadsheet-based workflows with a fast, reliable, and opinionated web application.

---

## Overview

Olimpo Sales Manager (OSM) centralises the complete order-to-delivery lifecycle: sales are created manually or bulk-imported from CSV files, products and dimensions are catalogued, stock is tracked across multiple storage locations, and inventory is automatically adjusted when a delivery is confirmed.

The application is used in production in Spanish (`lang="es"`) and is installable as a PWA on mobile devices.

---

## Key Features

### Sales Management
- **Spreadsheet-like grid** powered by TanStack Table — sortable columns, inline cell editing, row selection, and pinch-to-zoom on touch devices.
- **Optimistic updates** — every mutation (create, update, delete, duplicate) reflects instantly in the UI and rolls back automatically on failure, using TanStack Query.
- **Month-sheet navigation** — sales are scoped per month; a tab bar lets users flip between months without reloading the page.
- **Status tracking** — per-sale delivery (`NOT_DELIVERED` / `DELIVERED`) and payment (`NOT_PAID` / `WAITING_BANK_CONFIRMATION` / `PAID`) statuses, settable via inline dropdowns.
- **Row highlighting** — five colour labels (yellow, blue, green, magenta, orange) for manual tagging.
- **Duplicate sale** — one-click clone of an existing row, resetting statuses to their defaults.
- **Global search** — debounced full-text search across client name, address, and phone.

### CSV Bulk Import
- Parses uploaded CSV files with **PapaParse**, handling Uruguayan locale conventions (`.` as thousands separator, `,` as decimal).
- Multi-stage validation pipeline:
  1. **Alias resolution** — product names in the CSV are normalised against a DB alias table before matching.
  2. **Row validation** — date parsing (ISO + `dd-MMM-yyyy`), quantity parsing (supports split-dose `1/1` notation), price parsing, required-field checks.
  3. **Duplicate detection** — classifies conflicts as `exact_duplicate` (same client × date × product) or `name_conflict` (same client name, different details), presenting them to the user for manual review before inserting.
- Confirmed rows are inserted in parallel with pre-resolved dimensions and products to avoid race conditions.

### Product Catalogue
- Products are composed of a **brand name** + **dimension** (e.g. `Ozempic 2.5mg`).
- Dimensions are standalone, reusable entities shared across brands.
- CRUD interface for both products and dimensions inside a modal.

### Stock Management
- **Multi-location inventory** — stock is tracked per `(product, storage)` pair. Storages represent physical or virtual locations (warehouses, delivery vans, persons, etc.).
- **Immutable audit log** (`StockEvent`) — every inventory change is appended as an event with a delta and post-event snapshot. Events are never mutated or deleted.
- **Stock reservations** — when a product is added to a sale, a `StockReservation` is created, reducing available stock without touching the physical quantity. Reservations are automatically released on item removal or sale deletion.
- **Automatic stock deduction** — marking a sale as `DELIVERED` triggers a transaction that converts reservations into `SALE_DELIVERY` events and decrements the physical stock count.
- **Stock transfers** — move quantities between storage locations, with full event history.
- **Physical count** — override the absolute stock level for a given product/storage, with a warning if the new count is below the current reserved quantity.

### Authentication
- Cookie-based sessions signed with **JOSE (HS256 JWT)**, stored as `HttpOnly` / `Secure` / `SameSite=lax` cookies with a 7-day expiry.
- Session validation on every protected API route: verifies the token, checks the user still exists in the DB, and rejects stale cookies.
- Password hashing with **bcryptjs**.

---

## Technical Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Vanilla CSS Modules |
| Data fetching | TanStack Query v5 |
| Table | TanStack Table v8 |
| ORM | Prisma 7 (PostgreSQL adapter via `pg`) |
| Database | PostgreSQL |
| Auth | JOSE (JWT HS256) + bcryptjs |
| CSV parsing | PapaParse |
| Icons | Lucide React |
| E2E tests | Playwright |

---

## Architecture Highlights

- **Server-only service layer** — all database access lives in `src/lib/services/` and `src/modules/stock/services/`, each file annotated with `"server-only"` to prevent accidental client-side imports at build time.
- **Thin API routes** — Next.js Route Handlers act as a thin adapter layer: they validate the session, parse the request body, delegate to a service function, and return a serialised response.
- **Serialization boundary** — Prisma `Date` objects are converted to ISO strings at the service layer so the client receives a plain JSON type it can hydrate from TanStack Query cache without any extra transforms.
- **Optimistic mutation pattern** — all TanStack Query mutations follow a consistent `onMutate → onSuccess / onError → onSettled` flow, giving users instant feedback while keeping server state authoritative.
- **Domain-separated modules** — the stock domain (`src/modules/stock/`) is self-contained with its own types, constants, hooks, service functions, and UI components, keeping it decoupled from the sales domain.
- **Prisma transaction integrity** — multi-step write operations (e.g. replacing sale items + recreating reservations, delivery deduction) run inside `prisma.$transaction` to guarantee atomicity.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── auth/           # Login / logout endpoints
│   │   ├── sales/          # CRUD + duplicate endpoints
│   │   ├── products/       # Product catalogue endpoints
│   │   ├── dimensions/     # Dimension endpoints
│   │   ├── import/         # CSV validate + insert endpoints
│   │   └── stock/          # Stock lines, events, transfers, delivery
│   ├── login/              # Login page
│   └── stock/              # Stock overview page
├── components/
│   ├── sales/              # SalesTable, SalesGrid, inline cell editors
│   ├── catalog/            # Products & Dimensions modals
│   ├── import/             # CSV import wizard
│   └── ui/                 # Reusable: Button, Modal, Toast, Select, Table…
├── hooks/                  # useSales, useSaleColumns, usePinchToZoom, …
├── lib/
│   ├── services/           # saleService, importService, productService, …
│   ├── constants/          # Typed enums for statuses, colors
│   ├── utils/              # Date helpers, API response handler, …
│   └── session.ts          # JWT session helpers
└── modules/
    └── stock/              # Self-contained stock domain (services, hooks, components, types)
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- A running PostgreSQL instance

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/osm"
SESSION_SECRET="a-long-random-secret-string"
```

### Install & Run

```bash
npm install
npm run dev
```

The first production build also runs migrations automatically:

```bash
npm run build   # prisma generate && prisma migrate deploy && next build
npm start
```

### E2E Tests

```bash
npm run test:e2e        # headless
npm run test:e2e:ui     # Playwright UI mode
```
