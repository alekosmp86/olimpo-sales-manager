"use client";

import { StatusSelect } from "./StatusSelect";
import { cn } from "@/lib/utils/classNames";
import styles from "./PaymentDropdown.module.css";
import {
  PaymentStatus,
  PaymentStatusLabel,
} from "@/lib/constants/statuses";

export interface PaymentDropdownProps {
  value: PaymentStatus;
  onChange: (value: PaymentStatus) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * PaymentDropdown renders the status selector for sale payment state.
 */
export function PaymentDropdown({
  value,
  onChange,
  disabled,
  className,
}: PaymentDropdownProps) {
  const options = Object.values(PaymentStatus);

  return (
    <StatusSelect
      value={value}
      options={options}
      labelMap={PaymentStatusLabel as Record<string, string>}
      colorMap={{
        [PaymentStatus.NOT_PAID]: "gray",
        [PaymentStatus.WAITING_BANK_CONFIRMATION]: "blue",
        [PaymentStatus.PAID]: "green",
      }}
      onChange={onChange as (newValue: string) => void}
      disabled={disabled}
      className={cn(styles.paymentDropdown, className)}
    />
  );
}
