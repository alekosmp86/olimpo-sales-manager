"use client";

import { StatusSelect } from "./StatusSelect";
import { cn } from "@/lib/utils/classNames";
import styles from "./DeliveryDropdown.module.css";
import {
  DeliveryStatus,
  DeliveryStatusLabel,
} from "@/lib/constants/statuses";

export interface DeliveryDropdownProps {
  value: DeliveryStatus;
  onChange: (value: DeliveryStatus) => void;
  onBeforeChange?: (value: DeliveryStatus) => Promise<boolean>;
  disabled?: boolean;
  className?: string;
}

/**
 * DeliveryDropdown renders the status selector for sale delivery state.
 */
export function DeliveryDropdown({
  value,
  onChange,
  onBeforeChange,
  disabled,
  className,
}: DeliveryDropdownProps) {
  const options = Object.values(DeliveryStatus);

  async function handleSelect(newValue: string) {
    if (onBeforeChange) {
      const isConfirmed = await onBeforeChange(newValue as DeliveryStatus);
      if (!isConfirmed) {
        return;
      }
    }
    onChange(newValue as DeliveryStatus);
  }

  return (
    <StatusSelect
      value={value}
      options={options}
      labelMap={DeliveryStatusLabel as Record<string, string>}
      colorMap={{
        [DeliveryStatus.NOT_DELIVERED]: "gray",
        [DeliveryStatus.DELIVERED]: "amber",
      }}
      onChange={handleSelect}
      disabled={disabled}
      className={cn(styles.deliveryDropdown, className)}
    />
  );
}
