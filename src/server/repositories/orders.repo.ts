import { desc, eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { orderItems, orders } from '@/server/db/schema';

export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;

export async function insertOrder(
  db: Db,
  order: typeof orders.$inferInsert,
  items: (typeof orderItems.$inferInsert)[],
): Promise<void> {
  await db.insert(orders).values(order);
  if (items.length > 0) {
    await db.insert(orderItems).values(items);
  }
}

export async function findOrderById(
  db: Db,
  id: string,
): Promise<{ order: OrderRow; items: OrderItemRow[] } | null> {
  const orderRows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  const order = orderRows[0];
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));
  return { order, items };
}

export async function findOrdersByUserId(
  db: Db,
  userId: string,
): Promise<{ order: OrderRow; items: OrderItemRow[] }[]> {
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  const result: { order: OrderRow; items: OrderItemRow[] }[] = [];
  for (const order of orderRows) {
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));
    result.push({ order, items });
  }
  return result;
}
