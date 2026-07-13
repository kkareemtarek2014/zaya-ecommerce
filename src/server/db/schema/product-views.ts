import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { products } from './products';

export const productViews = sqliteTable('product_views', {
  productId: text('product_id')
    .primaryKey()
    .references(() => products.id, { onDelete: 'cascade' }),
  views: integer('views').notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});
