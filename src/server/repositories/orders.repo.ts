import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { orderItems, orders } from '@/server/db/schema';

export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;

export type AdminOrderListFilters = {
  q?: string;
  status?: OrderRow['status'];
  governorate?: string;
  dateFromMs?: number;
  dateToMs?: number;
  page?: number;
  pageSize?: number;
};

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
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
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
  limit?: number,
): Promise<{ order: OrderRow; items: OrderItemRow[] }[]> {
  const base = db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  const orderRows = limit != null ? await base.limit(limit) : await base;

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

export async function countOrdersByUserId(
  db: Db,
  userId: string,
): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(orders)
    .where(eq(orders.userId, userId));
  return rows[0]?.value ?? 0;
}

export async function listAdminOrders(
  db: Db,
  filters: AdminOrderListFilters = {},
): Promise<{ rows: OrderRow[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const conditions = [];

  if (filters.status) {
    conditions.push(eq(orders.status, filters.status));
  }
  if (filters.governorate) {
    conditions.push(eq(orders.governorateId, filters.governorate));
  }
  if (filters.dateFromMs != null) {
    conditions.push(gte(orders.createdAt, new Date(filters.dateFromMs)));
  }
  if (filters.dateToMs != null) {
    conditions.push(lte(orders.createdAt, new Date(filters.dateToMs)));
  }
  if (filters.q?.trim()) {
    const q = `%${filters.q.trim().toLowerCase()}%`;
    conditions.push(
      sql`(lower(${orders.id}) like ${q} or lower(${orders.phone}) like ${q} or lower(${orders.fullName}) like ${q})`,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const totalRows = await db
    .select({ value: count() })
    .from(orders)
    .where(where);
  const total = totalRows[0]?.value ?? 0;

  const rows = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { rows, total, page, pageSize };
}

export async function updateOrderStatus(
  db: Db,
  id: string,
  status: OrderRow['status'],
): Promise<OrderRow | null> {
  await db.update(orders).set({ status }).where(eq(orders.id, id));
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return rows[0] ?? null;
}
