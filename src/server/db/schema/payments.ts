import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { orders } from './orders';

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  provider: text('provider', { enum: ['paymob'] }).notNull().default('paymob'),
  method: text('method', { enum: ['card', 'wallet'] }).notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('EGP'),
  paymobIntentionId: text('paymob_intention_id'),
  paymobTransactionId: text('paymob_transaction_id').unique(),
  clientSecret: text('client_secret'),
  status: text('status', {
    enum: ['pending', 'paid', 'failed', 'refunded'],
  })
    .notNull()
    .default('pending'),
  raw: text('raw', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});
