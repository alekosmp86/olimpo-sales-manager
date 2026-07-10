# Extension Pattern

## Philosophy

The existing sales code is **core** — it works and must not be broken. The stock module needs to inject UI and behavior into core components. We do this via two patterns:

1. **Slot props** — a core component exposes optional `render*` props. If provided, the slot is rendered. If not, behavior is unchanged.
2. **HOC (Higher-Order Components)** — the stock module wraps a core component and passes enriched props to it, including a slot renderer or a lifecycle hook.

The HOC is the "glue". The core component exposes the "socket". The module plugs into the socket.

---

## Pattern 1: Slot prop — `ProductsModal`

### Core change (minimal)

```tsx
// src/components/sales/ProductsModal.tsx

interface ProductsModalProps {
  // ...existing props...
  renderItemExtras?: (item: EditableItem, index: number) => React.ReactNode; // NEW
}

// Inside the item render loop, after the qty input:
{props.renderItemExtras?.(item, index)}
```

This renders nothing when `renderItemExtras` is `undefined`. Zero behavior change for any consumer that doesn't pass it.

### Module HOC

```tsx
// src/modules/stock/components/extensions/withStockProductsModal.tsx

import { ProductsModal } from "@/components/sales/ProductsModal";
import { StoragePickerSlot } from "./StoragePickerSlot";

export function withStockProductsModal(Modal: typeof ProductsModal) {
  return function StockProductsModal(props: React.ComponentProps<typeof Modal>) {
    return (
      <Modal
        {...props}
        renderItemExtras={(item, index) => (
          <StoragePickerSlot
            key={item.keyId}
            productId={item.productId}
            quantity={item.quantity}
            saleItemId={/* derived from saleId + item */}
          />
        )}
      />
    );
  };
}
```

### Usage (in `SalesTable.tsx` or `useSalesTableState.ts`)

```tsx
// Instead of importing ProductsModal directly:
import { withStockProductsModal } from "@/modules/stock/components/extensions/withStockProductsModal";
import { ProductsModal } from "@/components/sales/ProductsModal";

const StockProductsModal = withStockProductsModal(ProductsModal);
// Use <StockProductsModal ...> everywhere ProductsModal was used
```

---

## Pattern 2: Lifecycle hook — `DeliveryDropdown`

### Core change (minimal)

```tsx
// src/components/sales/StatusDropdown.tsx

interface DeliveryDropdownProps {
  // ...existing props...
  onBeforeChange?: (newValue: DeliveryStatus) => Promise<boolean>; // NEW
}

// Inside DeliveryDropdown, wrap the onChange call:
async function handleChange(val: string) {
  if (props.onBeforeChange) {
    const proceed = await props.onBeforeChange(val as DeliveryStatus);
    if (!proceed) return;
  }
  props.onChange(val as DeliveryStatus);
}
```

### Module HOC

```tsx
// src/modules/stock/components/extensions/withStockDeliveryDropdown.tsx

export function withStockDeliveryDropdown(Dropdown: typeof DeliveryDropdown) {
  return function StockDeliveryDropdown(
    props: React.ComponentProps<typeof Dropdown> & { sale: Sale }
  ) {
    async function handleBeforeChange(newValue: DeliveryStatus): Promise<boolean> {
      if (newValue !== DeliveryStatus.DELIVERED) return true;
      // Runs the delivery resolution flow. Returns true if user confirms, false if cancelled.
      return runDeliveryFlow(props.sale);
    }
    return <Dropdown {...props} onBeforeChange={handleBeforeChange} />;
  };
}
```

---

## How to Add More Extensions

If a future feature needs to inject into another core component, follow this checklist:

1. **Identify the injection point** — where in the core component does the new UI/behavior go?
2. **Add the minimal socket** — a `render*` slot prop or an `onBefore*` async hook. Keep it optional with a sensible default.
3. **Write the HOC** in `src/modules/<feature>/components/extensions/`.
4. **Update the consumer** — replace the direct import with the wrapped version.
5. **Document** the new extension point in this file.

> [!WARNING]
> Never modify core component *logic* in a HOC. HOCs should only compose — they pass through all existing props and add new behavior via the extension points. A HOC that overrides core behavior is a maintenance trap.
