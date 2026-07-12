# Domain Model

## Prisma Models

### `Storage`
A named physical or virtual location that holds products.

**Fields:**
- `id` — CUID primary key
- `name` — Unique name (e.g. "Depósito Central", "Juan")
- `description` — Optional free-text
- `isActive` — Soft-delete flag; inactive storages are hidden from pickers but data is preserved

**Why not hard-delete?** Storages may have historical `StockEvent` rows. Hard-deleting would orphan those log entries and break the audit trail. Soft-delete preserves history.

---

### `StockLine`
The **current snapshot** of how many units of a product exist in a storage.

**Fields:**
- `storageId` + `productId` — Composite unique key
- `quantity` — Integer, **never negative**, represents total physical units (reserved + available)

**Why a snapshot instead of summing events?**
Reading the current quantity by summing the entire event log would be O(n) on the log size. A snapshot gives O(1) reads. The event log remains the source of truth for history; the snapshot is always derived from it and kept in sync transactionally.

**"Available" is always computed, never stored:**
```
available = StockLine.quantity - SUM(StockReservation.quantity WHERE storageId = X AND productId = Y)
```
Storing `available` as a column would create denormalization and risk inconsistency when reservations are created/released concurrently.

---

### `StockEvent`
An **immutable** log entry. Once written, it is never updated or deleted.

**Fields:**
- `type` — See `StockEventType` enum below
- `storageId`, `productId` — What changed
- `delta` — Signed integer: positive = stock increased, negative = decreased
- `quantityAfter` — Snapshot of `StockLine.quantity` after this event (for easy reconstruction without replaying history)
- `notes` — Optional human-readable note
- `saleId` — Optional link to the triggering sale

**Why store `quantityAfter`?**
It allows rendering a timeline chart or table of stock levels over time without replaying every event from the beginning.

**Event types:**
| Type | When | Delta |
|---|---|---|
| `COUNT` | Physical count operation | New qty − Old qty (can be negative) |
| `TRANSFER_OUT` | Goods leave a storage | Negative |
| `TRANSFER_IN` | Goods arrive at a storage | Positive |
| `SALE_DELIVERY` | Sale marked DELIVERED, stock decreases | Negative |

---

### `StockReservation`
A claim on stock in a specific storage for a pending sale.

**Fields:**
- `saleItemId` — 1-to-1 with `SaleItem`. `onDelete: Cascade` ensures reservation is released when item is removed.
- `storageId`, `productId`, `quantity` — What is claimed and where

**Lifecycle:**
1. **Created** → when a product is added to a sale (mandatory)
2. **Updated** → when the user changes the source storage or quantity in the ProductsModal
3. **Deleted (cascade)** → when the SaleItem is removed or the Sale is deleted
4. **Deleted (delivery)** → when the sale is marked DELIVERED; the delivery service reads the reservation, decreases the StockLine, writes a SALE_DELIVERY event, then deletes the reservation

**Why 1-to-1 with SaleItem?**
A SaleItem already captures product + quantity + sale. The reservation adds the "source storage" dimension. If a SaleItem is split across multiple storages, it becomes two SaleItems — which is the correct data model (cleaner audit trail).

---

## Schema Relationships

```
Product ──< StockLine >── Storage
Product ──< StockEvent >── Storage
Product ──< StockReservation >── Storage

Sale ──< StockEvent
Sale ──< SaleItem ──── StockReservation
```

## Additive Changes to Existing Models

These are back-relations only — no new columns on existing tables, no migration data changes:

```prisma
// SaleItem
reservation  StockReservation?

// Sale
stockEvents  StockEvent[]

// Product
stockLines    StockLine[]
reservations  StockReservation[]
stockEvents   StockEvent[]
```
