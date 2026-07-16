# API Contracts

All stock endpoints are mounted under `/api/stock/`.

---

## `GET /api/stock/storages`
Returns all active storages.

**Response:**
```json
[
  { "id": "...", "name": "Depósito Central", "description": null, "isActive": true, "createdAt": "...", "updatedAt": "..." }
]
```

---

## `POST /api/stock/storages`
Create a new storage.

**Body:**
```json
{ "name": "Depósito Norte", "description": "optional" }
```

**Response:** `201` with the created storage.

---

## `PATCH /api/stock/storages/[id]`
Update a storage name/description or soft-delete (set `isActive: false`).

**Body:** Partial `{ name?, description?, isActive? }`

---

## `DELETE /api/stock/storages/[id]`
Hard-delete a storage. **Blocked** if it has `StockLine.quantity > 0` or active `StockReservation`.

**Error response (409):**
```json
{ "error": "Cannot delete storage with active stock or reservations." }
```

---

## `GET /api/stock/stock-lines?storageId=&productId=`
Returns stock lines, optionally filtered. Each row includes computed `available` quantity.

**Response:**
```json
[
  {
    "id": "...",
    "storageId": "...",
    "productId": "...",
    "quantity": 50,
    "reserved": 10,
    "available": 40,
    "product": { "id": "...", "name": "Ozempic", "dimension": { "label": "2.5mg" } }
  }
]
```

---

## `POST /api/stock/count`
Physical count — sets absolute quantity.

**Body:**
```json
{
  "storageId": "...",
  "entries": [
    { "productId": "...", "quantity": 47 }
  ]
}
```

**Effect:** Upserts each `StockLine` and writes a `COUNT` event per product.

**Response:** `200 { "ok": true, "warnings": [ { "productId": "...", "reserved": 10, "newQuantity": 5 } ] }`

---

## `POST /api/stock/transfer`
Move goods between storages.

**Body:**
```json
{
  "fromStorageId": "...",
  "toStorageId": "...",
  "productId": "...",
  "quantity": 10,
  "moveReservations": false  // optional: also re-point active reservations to destination
}
```

**Error responses:**
- `400` — same source and destination
- `409` — insufficient available stock in source
- `409` — reservation conflict (if `moveReservations: true` but qty < reserved)

**Response:** `200 { "ok": true }`

---

## `GET /api/stock/events?storageId=&productId=&limit=50&cursor=`
Paginated event log.

**Response:**
```json
{
  "events": [
    {
      "id": "...",
      "type": "COUNT",
      "delta": 10,
      "quantityAfter": 50,
      "notes": null,
      "saleId": null,
      "createdAt": "...",
      "storage": { "name": "Depósito Central" },
      "product": { "name": "Ozempic", "dimension": { "label": "2.5mg" } }
    }
  ],
  "nextCursor": "..."
}
```

---

## `GET /api/stock/reservations?saleId=`
Returns all reservations for a given sale.

**Response:**
```json
[
  {
    "id": "...",
    "saleItemId": "...",
    "storageId": "...",
    "productId": "...",
    "quantity": 3,
    "storage": { "name": "Depósito Central" }
  }
]
```

---

## `POST /api/stock/reservations`
Create or update a reservation for a SaleItem.

**Body:**
```json
{ "saleItemId": "...", "storageId": "...", "productId": "...", "quantity": 3 }
```

**Error:** `409` if storage has insufficient available stock.

---

## `DELETE /api/stock/reservations/[saleItemId]`
Explicitly release a reservation. Usually handled by cascade, but available for manual use.

---

## `POST /api/stock/deliver`
Executes the delivery stock decrease for a sale. Called by the delivery HOC after user confirms.

**Body:**
```json
{
  "saleId": "...",
  "overrides": [
    // For items where the original reservation is invalid:
    { "saleItemId": "...", "storageId": "..." }
  ]
}
```

**Response:**
- `200 { "ok": true }` — all items processed
- `409 { "error": "...", "unresolvedItems": [...] }` — some items still can't be resolved (insufficient stock in all provided storages)
