import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { orders } from './orders';
import { users } from './users';

export const orderStatusHistory = sqliteTable('order_status_history', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  fromStatus: text('from_status', {
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
  toStatus: text('to_status', {
    enum: [
      'placed',
      'confirmed',
      'sourced',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ],
  }).notNull(),
  actor: text('actor', {
    enum: ['admin', 'system', 'paymob', 'bosta'],
  }).notNull(),
  actorId: text('actor_id').references(() => users.id),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
