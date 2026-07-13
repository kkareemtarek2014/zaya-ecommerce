import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { orders } from './orders';

export const shipments = sqliteTable('shipments', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  provider: text('provider', { enum: ['bosta'] }).notNull().default('bosta'),
  bostaDeliveryId: text('bosta_delivery_id'),
  trackingNumber: text('tracking_number').unique(),
  bostaState: text('bosta_state'),
  /** Last webhook/event id for idempotency (when Bosta sends one). */
  lastEventId: text('last_event_id'),
  mappedStatus: text('mapped_status', {
    enum: [
      'placed',
      'confirmed',
      'sourced',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ],
  }),
  codAmount: integer('cod_amount').notNull().default(0),
  raw: text('raw', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});
