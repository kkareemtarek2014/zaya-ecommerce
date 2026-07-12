import type { OrderDTO } from '@/shared/contracts/order.contract';
import { orderStatusSchema } from '@/shared/contracts/order.contract';
import type { z } from 'zod';

/** Public order shape — matches API OrderDTO. */
export type Order = OrderDTO;

export type OrderItem = OrderDTO['items'][number];
export type ShippingAddress = OrderDTO['address'];
export type PaymentMethod = OrderDTO['paymentMethod'];
export type OrderStatus = z.infer<typeof orderStatusSchema>;
