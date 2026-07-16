# Operations

## COUNT — Physical Inventory Count

**Trigger:** User opens the Count modal on the Stock page, selects a storage, enters quantities for each product.

**Effect:**
- For each product entered: `StockLine.quantity = entered value`
- Logs a `COUNT` event with `delta = new_qty - old_qty`
- If `entered value < SUM(active reservations for that product in that storage)`: **warn** the user. The count proceeds — but affected sales will be flagged at delivery time.

**Why not block the count?** A physical count is ground truth. If the physical reality contradicts the reservations, the reservations are wrong — not the count. The system flags the inconsistency rather than refusing to record reality.

**What about "Adjust In / Adjust Out"?**
These operations were removed. "Count" subsumes them: if you receive 10 units and previously had 40, you count 50. This eliminates arithmetic errors and keeps the operation model simple.

---

## TRANSFER — Move Goods Between Storages

**Trigger:** User opens the Transfer modal, picks source storage, destination storage, product, and quantity.

**Validation:**
- `quantity > 0`
- `source.available >= quantity` (available = total − reserved). If not: block and show error.

**Effect (happy path):**
1. `Source.StockLine.quantity -= quantity` → logs `TRANSFER_OUT`
2. `Dest.StockLine.quantity += quantity` → logs `TRANSFER_IN`
3. Both writes happen in a single DB transaction.

**Reservation conflict flow:**

If the transfer would reduce Source's **total** quantity below its **reserved** quantity (meaning reserved items may no longer physically be there), a warning modal appears **before** committing:

> **Advertencia:** El depósito origen tiene X unidades reservadas para Y ventas. Si continúas, esas ventas deberán resolver el origen de stock al momento de la entrega.

Options:
1. **Cancelar** — no changes.
2. **Confirmar** — goods move; reservations stay in the source. Affected sales will prompt the user to pick a new storage at delivery time.

No "move reservations" option exists — keeping it simple.

---

## RESERVE — Claim Stock for a Sale

**Trigger:** User adds a product to a sale in the ProductsModal. The storage picker (`StoragePickerSlot`) appears inline per item.

**Rules:**
- Reservations are **mandatory**. A SaleItem cannot be saved without a valid reservation.
- The storage picker shows storages where `StockLine.quantity > 0` (physical stock exists).
- "Available" stock (`StockLine.quantity − reserved`) CAN go negative — backorders are allowed at reservation time.
- **Delivery is blocked** when `StockLine.quantity < item.quantity` at the moment the user marks the sale as Delivered.
- If no storage has any physical stock, the user cannot reserve until a Count is performed.

**Effect:**
- Creates a `StockReservation` row.
- Does **not** change `StockLine.quantity`. Available stock is computed dynamically.
- No `StockEvent` is logged (reservations are not physical movements).

---

## RE-RESERVE — Change Source Storage

**Trigger:** User edits an existing sale item in the ProductsModal and picks a different storage.

**Rules:**
- New storage must have `available >= item.quantity` (same as Reserve).
- Old reservation is deleted; new one is created (in a transaction).

---

## RELEASE — Remove a Reservation

**Trigger:** User removes a product from a sale, or the entire sale is deleted.

**Effect:**
- `StockReservation` is deleted (by cascade or explicit delete).
- `StockLine.quantity` unchanged.
- No `StockEvent` logged.

---

## DELIVER — Auto-Decrease on Delivery

**Trigger:** User changes `deliveryStatus` to `DELIVERED` on a sale.

**Intercepted by:** `withStockDeliveryDropdown` HOC via the `onBeforeChange` hook on `DeliveryDropdown`.

**Flow:**

```
For each SaleItem in the sale:
  If reservation EXISTS and storage.available >= item.quantity:
    → auto-decrease (no user input needed)
  If reservation EXISTS but storage.available < item.quantity:
    → show DeliveryStoragePickerModal for this item
  If NO reservation (e.g., CSV-imported sale):
    → show DeliveryStoragePickerModal for this item
```

**After all items resolved:**
1. For each item: `StockLine.quantity -= item.quantity` (in a single DB transaction)
2. Logs `SALE_DELIVERY` event per item
3. Deletes all `StockReservation` rows for this sale
4. Status change proceeds → `deliveryStatus = DELIVERED`

**If the user cancels the modal at any point:** the entire delivery is aborted. No stock changes. `deliveryStatus` remains unchanged.

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Sale quantity edited after reservation | Reservation quantity updated. If new qty > storage available, show warning. |
| Count sets qty below reserved | Warn, proceed. Flag affected reservations. |
| Transfer into a storage that has a reservation | Transfer proceeds. No conflict — more stock arriving is always fine. |
| Storage deleted | Blocked if it has any `StockLine.quantity > 0` or active `StockReservation`. User must transfer goods and release reservations first. |
| Product deleted | Blocked if any `StockLine.quantity > 0` for that product. User must count to zero first. |
| Sale duplicated | Duplicate starts with **no reservations**. User must assign storages in the new sale's ProductsModal. |
| Two sales reserve same product in same storage | Allowed. Available stock decreases. If it hits 0, no further reservations allowed from that storage. |
| Delivery with reservation pointing to deleted storage | Impossible — storage deletion is blocked when it has reservations. |
