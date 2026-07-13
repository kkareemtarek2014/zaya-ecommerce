import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { products } from './products';
import {
  BUNDLE_TYPES,
  type BundleType,
} from '@/shared/contracts/admin-bundles.contract';

export type { BundleType };

export const bundles = sqliteTable('bundles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: BUNDLE_TYPES }).notNull(),
  /** bxgy: { buyQty, getQty }; fixed_price/set: { price } */
  config: text('config', { mode: 'json' })
    .$type<Record<string, unknown>>()
    .notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  startsAt: integer('starts_at', { mode: 'timestamp_ms' }),
  endsAt: integer('ends_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const bundleItems = sqliteTable(
  'bundle_items',
  {
    bundleId: text('bundle_id')
      .notNull()
      .references(() => bundles.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    qty: integer('qty').notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.bundleId, t.productId] })],
);
