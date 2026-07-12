'use client';

import { Select } from '@/shared/components/ui';
import {
  allowedNextStatuses,
  type OrderStatus,
} from '@/shared/contracts/admin-ops.contract';

const LABELS: Record<OrderStatus, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  sourced: 'Sourced',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

interface OrderStatusSelectProps {
  current: OrderStatus;
  value: OrderStatus;
  onChange: (status: OrderStatus) => void;
  disabled?: boolean;
  id?: string;
}

export function OrderStatusSelect({
  current,
  value,
  onChange,
  disabled,
  id = 'order-status',
}: OrderStatusSelectProps) {
  const allowed = allowedNextStatuses(current);
  const options: OrderStatus[] =
    allowed.length === 0 ? [current] : [current, ...allowed.filter((s) => s !== current)];

  return (
    <Select
      id={id}
      label="Status"
      value={value}
      disabled={disabled || allowed.length === 0}
      onChange={(e) => onChange(e.target.value as OrderStatus)}
    >
      {options.map((s) => (
        <option key={s} value={s}>
          {LABELS[s]}
          {s === current ? ' (current)' : ''}
        </option>
      ))}
    </Select>
  );
}

export { LABELS as ORDER_STATUS_LABELS };
