import { z } from 'zod';
import {
  orderDtoSchema,
  orderStatusSchema,
  type OrderDTO,
} from '@/shared/contracts/order.contract';
import type { Paginated } from '@/shared/contracts/admin-catalog.contract';

export { type Paginated };

export const adminOrderDtoSchema = orderDtoSchema.extend({
  userId: z.string().nullable(),
});

export type AdminOrderDTO = z.infer<typeof adminOrderDtoSchema>;

export const adminOrderStatusPatchSchema = z.object({
  status: orderStatusSchema,
});

export type AdminOrderStatusPatch = z.infer<typeof adminOrderStatusPatchSchema>;

export const adminUserDtoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
  role: z.enum(['customer', 'admin']),
  createdAt: z.string(),
  ordersCount: z.number().int(),
});

export type AdminUserDTO = z.infer<typeof adminUserDtoSchema>;

export const adminUserDetailDtoSchema = adminUserDtoSchema.extend({
  recentOrders: z.array(adminOrderDtoSchema),
});

export type AdminUserDetailDTO = z.infer<typeof adminUserDetailDtoSchema>;

const egyptianPhone = /^01[0125][0-9]{8}$/;

export const adminUserWriteSchema = z.object({
  name: z.string().trim().min(2).optional(),
  phone: z
    .string()
    .trim()
    .regex(egyptianPhone, 'Enter a valid Egyptian mobile number')
    .optional()
    .nullable(),
  role: z.enum(['customer', 'admin']).optional(),
});

export type AdminUserWrite = z.infer<typeof adminUserWriteSchema>;

/** Forward flow (one step). Cancel handled separately. */
export const ORDER_STATUS_FLOW = [
  'placed',
  'confirmed',
  'sourced',
  'shipped',
  'out_for_delivery',
  'delivered',
] as const;

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export function allowedNextStatuses(current: OrderStatus): OrderStatus[] {
  if (current === 'delivered' || current === 'cancelled') return [];
  const idx = ORDER_STATUS_FLOW.indexOf(
    current as (typeof ORDER_STATUS_FLOW)[number],
  );
  const next: OrderStatus[] = [];
  if (idx >= 0 && idx < ORDER_STATUS_FLOW.length - 1) {
    next.push(ORDER_STATUS_FLOW[idx + 1]!);
  }
  next.push('cancelled');
  return next;
}

export function isOrderStatusTransitionAllowed(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) return true;
  return allowedNextStatuses(from).includes(to);
}

export type { OrderDTO };
