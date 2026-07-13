import 'server-only';
import type { OrderTimelineEntry } from '@/shared/contracts/order.contract';
import type { OrderStatus } from '@/shared/contracts/order.contract';
import type { Db } from '@/server/db/client';
import * as historyRepo from '@/server/repositories/order-status-history.repo';
import type { TimelineActor } from '@/server/repositories/order-status-history.repo';

function historyId(): string {
  return `osh_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

export function toTimelineEntry(
  row: historyRepo.OrderStatusHistoryRow,
): OrderTimelineEntry {
  const entry: OrderTimelineEntry = {
    id: row.id,
    toStatus: row.toStatus,
    actor: row.actor,
    createdAt: row.createdAt.toISOString(),
  };
  if (row.fromStatus) entry.fromStatus = row.fromStatus;
  else entry.fromStatus = null;
  if (row.actorId) entry.actorId = row.actorId;
  if (row.note) entry.note = row.note;
  return entry;
}

export async function recordOrderStatusChange(
  db: Db,
  input: {
    orderId: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    actor: TimelineActor;
    actorId?: string | null;
    note?: string | null;
  },
): Promise<void> {
  await historyRepo.insertStatusHistory(db, {
    id: historyId(),
    orderId: input.orderId,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    actor: input.actor,
    actorId: input.actorId ?? null,
    note: input.note ?? null,
  });
}

export async function getOrderTimeline(
  db: Db,
  orderId: string,
): Promise<OrderTimelineEntry[]> {
  const rows = await historyRepo.findHistoryByOrderId(db, orderId);
  // Oldest first for UI chronology
  return rows.map(toTimelineEntry).reverse();
}
