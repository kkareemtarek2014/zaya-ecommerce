import { desc, eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { orderStatusHistory } from '@/server/db/schema';
import type { OrderStatus } from '@/shared/contracts/order.contract';

export type OrderStatusHistoryRow = typeof orderStatusHistory.$inferSelect;

export type TimelineActor = 'admin' | 'system' | 'paymob' | 'bosta';

export async function insertStatusHistory(
  db: Db,
  input: {
    id: string;
    orderId: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    actor: TimelineActor;
    actorId?: string | null;
    note?: string | null;
    createdAt?: Date;
  },
): Promise<OrderStatusHistoryRow> {
  await db.insert(orderStatusHistory).values({
    id: input.id,
    orderId: input.orderId,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    actor: input.actor,
    actorId: input.actorId ?? null,
    note: input.note ?? null,
    createdAt: input.createdAt ?? new Date(),
  });
  const rows = await db
    .select()
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.id, input.id))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error('Failed to write order status history');
  return row;
}

export async function findHistoryByOrderId(
  db: Db,
  orderId: string,
): Promise<OrderStatusHistoryRow[]> {
  return db
    .select()
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, orderId))
    .orderBy(desc(orderStatusHistory.createdAt));
}
