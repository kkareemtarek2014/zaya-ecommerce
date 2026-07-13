import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Strict webhook idempotency (P15). Claim `(provider, event_id)` before applying side effects.
 */
export const webhookEvents = sqliteTable(
  'webhook_events',
  {
    id: text('id').primaryKey(),
    provider: text('provider', { enum: ['paymob', 'bosta'] }).notNull(),
    eventId: text('event_id').notNull(),
    orderId: text('order_id'),
    receivedAt: integer('received_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => [uniqueIndex('webhook_events_provider_event_uidx').on(t.provider, t.eventId)],
);
