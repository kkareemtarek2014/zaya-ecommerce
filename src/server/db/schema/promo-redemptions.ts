import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { promos } from './promos';
import { orders } from './orders';
import { users } from './users';

export const promoRedemptions = sqliteTable('promo_redemptions', {
  id: text('id').primaryKey(),
  promoCode: text('promo_code')
    .notNull()
    .references(() => promos.code),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  discount: integer('discount').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
