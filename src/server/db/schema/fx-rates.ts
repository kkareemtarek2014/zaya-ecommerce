import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const fxRates = sqliteTable('fx_rates', {
  id: text('id').primaryKey(),
  base: text('base').notNull().default('USD'),
  quote: text('quote').notNull().default('EGP'),
  rate: real('rate').notNull(),
  source: text('source').notNull(),
  fetchedAt: integer('fetched_at', { mode: 'timestamp_ms' }).notNull(),
});
