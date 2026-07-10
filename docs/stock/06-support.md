# Support & Troubleshooting Runbook

This file is for developers and AI agents debugging issues in the stock module. Each section describes a known failure mode, its root cause, and the resolution path.

---

## 1. "Cannot deliver — storage has insufficient stock" (unexpected)

**Symptom:** User tries to mark a sale as DELIVERED and gets a stock picker modal even though they believe stock is available.

**Root cause candidates:**
1. Another sale's reservation consumed the available stock since this reservation was created.
2. A COUNT operation reduced the storage quantity below the reserved amount.
3. A TRANSFER moved goods out of the reserved storage.

**How to diagnose:**
```sql
-- Check current StockLine quantity
SELECT quantity FROM "StockLine" WHERE "storageId" = '<id>' AND "productId" = '<id>';

-- Check total reserved for this product+storage
SELECT SUM(quantity) FROM "StockReservation" WHERE "storageId" = '<id>' AND "productId" = '<id>';

-- Check recent events
SELECT * FROM "StockEvent"
WHERE "storageId" = '<id>' AND "productId" = '<id>'
ORDER BY "createdAt" DESC LIMIT 10;
```

**Resolution:** The user must pick an alternative storage in the modal. If no storage has stock, a Count must be performed first.

---

## 2. A SaleItem has no StockReservation (data integrity)

**Symptom:** A sale item exists but `StockReservation` for its `saleItemId` is missing.

**When this legitimately happens:**
- The sale was created via CSV import (reservations are created at delivery time for these).

**When this is a bug:**
- A sale item was created through the UI but the reservation write failed (network error mid-mutation).

**How to detect:**
```sql
SELECT si.id, si."saleId", si."productId"
FROM "SaleItem" si
LEFT JOIN "StockReservation" sr ON sr."saleItemId" = si.id
WHERE sr.id IS NULL;
```

**Resolution for UI-created items without reservation:**
- The delivery flow handles this gracefully — it treats them as "unresolved" and prompts the user to pick a storage.
- If this happens systematically, check the `POST /api/stock/reservations` error logs.

---

## 3. StockLine.quantity went negative (invariant violation)

**Symptom:** A `StockLine` row has `quantity < 0`. This should never happen.

**Root cause:** A race condition where two concurrent operations decreased the same StockLine past zero, or a bug in a service that skipped the available-stock check.

**How to detect:**
```sql
SELECT * FROM "StockLine" WHERE quantity < 0;
```

**Resolution:**
1. Run a COUNT operation to set the quantity to the correct physical number.
2. Review recent `StockEvent` rows for that storage/product to understand which operation caused it.
3. File a bug — include the event log rows.

**Prevention:** All service functions that decrease `StockLine.quantity` must use a Prisma transaction with a `WHERE quantity >= delta` guard:
```typescript
// In stockLineService.ts:
await prisma.stockLine.updateMany({
  where: { storageId, productId, quantity: { gte: delta } },
  data: { quantity: { decrement: delta } },
});
// Check that exactly 1 row was updated; if 0, the check failed (throw an error)
```

---

## 4. Transfer conflict modal won't offer "move reservations" option

**Symptom:** The user wants to move reservations to the destination but the option is grayed out or absent.

**Root cause:** The transfer quantity is less than the total reserved quantity in the source storage. Moving only some reserved goods would partially invalidate the reservations in a confusing way.

**Example:** Storage A has 20 units, 15 reserved. Transfer 10. We can't move 15 reservations with only 10 units moving.

**Resolution:** The user must either:
- Transfer at least 15 units (covering all reservations), then the "move reservations" option appears.
- Or transfer without moving reservations and resolve the conflict at delivery time.

---

## 5. "Storage cannot be deleted" error

**Symptom:** `DELETE /api/stock/storages/[id]` returns `409`.

**Resolution:**
1. Navigate to the stock page and find the storage.
2. Transfer all goods to another storage (or count to zero if goods are lost).
3. All reservations pointing to this storage must be re-assigned. Open each affected sale's ProductsModal and change the storage picker.
4. Once quantity = 0 and no reservations exist, deletion will succeed.

**How to check programmatically:**
```sql
-- Check stock
SELECT quantity FROM "StockLine" WHERE "storageId" = '<id>' AND quantity > 0;

-- Check reservations
SELECT COUNT(*) FROM "StockReservation" WHERE "storageId" = '<id>';
```

---

## 6. Reservation quantity out of sync with SaleItem quantity

**Symptom:** `StockReservation.quantity` differs from its linked `SaleItem.quantity`.

**When this legitimately happens:** Never — they should always be equal. The reservation is updated whenever the SaleItem quantity changes.

**How to detect:**
```sql
SELECT si.id, si.quantity AS item_qty, sr.quantity AS reservation_qty
FROM "SaleItem" si
JOIN "StockReservation" sr ON sr."saleItemId" = si.id
WHERE si.quantity != sr.quantity;
```

**Resolution:**
- Run a manual fix (set reservation quantity = item quantity):
```sql
UPDATE "StockReservation" sr
SET quantity = si.quantity
FROM "SaleItem" si
WHERE sr."saleItemId" = si.id AND si.quantity != sr.quantity;
```
- File a bug against the `POST /api/sales/[id]` PATCH handler — it must update the reservation whenever `items` changes.

---

## 7. AI Agent: Adding a new stock operation

If you need to add a new type of stock operation (e.g., "Write-off for damaged goods"):

1. Add the new event type to the `StockEventType` enum in `schema.prisma`.
2. Create the business logic in a new or existing service file in `src/modules/stock/services/`.
3. Add an API route under `src/app/api/stock/`.
4. Add the UI trigger in `src/modules/stock/components/`.
5. Update `docs/stock/03-operations.md` with the new operation spec.
6. Update `docs/stock/05-api-contracts.md` with the new endpoint.
7. If the operation touches core components, follow `docs/stock/04-extension-pattern.md`.

Never write stock logic inside `src/lib/services/` — that folder is for core (non-module) services only.
