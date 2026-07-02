import styles from "./Badge.module.css";
import { DeliveryStatus, PaymentStatus, DeliveryStatusLabel, PaymentStatusLabel } from "@/lib/constants/statuses";

interface DeliveryBadgeProps {
  status: DeliveryStatus;
}

interface PaymentBadgeProps {
  status: PaymentStatus;
}

export function DeliveryBadge({ status }: DeliveryBadgeProps) {
  const variantMap: Record<DeliveryStatus, string> = {
    [DeliveryStatus.NOT_DELIVERED]: styles.gray,
    [DeliveryStatus.DELIVERED]: styles.amber,
  };
  return (
    <span className={[styles.badge, variantMap[status]].join(" ")}>
      {DeliveryStatusLabel[status]}
    </span>
  );
}

export function PaymentBadge({ status }: PaymentBadgeProps) {
  const variantMap: Record<PaymentStatus, string> = {
    [PaymentStatus.NOT_PAID]: styles.gray,
    [PaymentStatus.WAITING_BANK_CONFIRMATION]: styles.blue,
    [PaymentStatus.PAID]: styles.green,
  };
  return (
    <span className={[styles.badge, variantMap[status]].join(" ")}>
      {PaymentStatusLabel[status]}
    </span>
  );
}
