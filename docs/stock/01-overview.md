# Stock Management Module — Overview

## Goal

Track the physical inventory of products across multiple **storages** (warehouses, people, vehicles, etc.), keeping the stock data consistent with the sales lifecycle.

## Non-Goals (v1)

- Multi-user roles or permission levels (all users see all stock).
- Expiry tracking of goods.
- Supplier management or purchase orders.
- Inter-storage "in transit" status — all transfers are instantaneous.
- CSV import of stock data.

## Module Location

All code for this feature lives in `src/modules/stock/`. Everything outside that folder is considered **core** and should only receive minimal, additive changes.

## Key Concepts

| Term | Meaning |
|---|---|
| **Storage** | A named place that holds inventory (warehouse, person, delivery van) |
| **StockLine** | The current quantity of a specific product in a specific storage (snapshot) |
| **StockEvent** | An immutable log entry recording every stock change (audit trail) |
| **StockReservation** | A claim on stock in a specific storage, tied to a SaleItem |
| **Available stock** | `StockLine.quantity − SUM(active reservations for that product+storage)` |

## Invariants (never broken)

1. `StockLine.quantity` is **never negative**.
2. Every change to `StockLine.quantity` creates a corresponding `StockEvent`.
3. Every `SaleItem` has exactly **one** `StockReservation` (mandatory, created when the item is added to the sale).
4. A reservation is released only when: its `SaleItem` is deleted, its parent `Sale` is deleted, or the sale is marked `DELIVERED` (which converts the reservation into a delivery event).

## Entry Points

- **UI**: `/stock` page — manage storages, run counts, transfer goods, view event log.
- **Sales integration**: `ProductsModal` (extended via HOC) shows a storage picker per item.
- **Delivery hook**: `DeliveryDropdown` (extended via HOC) intercepts the `DELIVERED` status change to trigger auto-decrease.
