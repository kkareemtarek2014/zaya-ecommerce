import 'server-only';
import { and, eq, inArray, lt, notInArray } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { orders } from '@/server/db/schema';
import * as ordersRepo from '@/server/repositories/orders.repo';
import { releaseStockForOrder } from '@/server/services/inventory.service';
import { recordOrderStatusChange } from '@/server/services/order-timeline.service';
import { createNotification } from '@/server/services/notifications.service';
import {
  getUnpaidTimeoutMinutes,
  markCronJobRun,
} from '@/server/jobs/config';

/**
 * Cancel card/wallet orders still pending payment past the configured window.
 * COD is never auto-cancelled. Releases reserved stock.
 */
export async function cancelUnpaidOrdersJob(
  db: Db,
): Promise<{ cancelled: number }> {
  const minutes = await getUnpaidTimeoutMinutes(db);
  const cutoff = new Date(Date.now() - minutes * 60_000);

  const candidates = await db
    .select()
    .from(orders)
    .where(
      and(
        inArray(orders.paymentMethod, ['card', 'wallet']),
        eq(orders.paymentStatus, 'pending'),
        notInArray(orders.status, ['cancelled', 'delivered']),
        lt(orders.createdAt, cutoff),
      ),
    )
    .limit(100);

  let cancelled = 0;
  for (const order of candidates) {
    const found = await ordersRepo.findOrderById(db, order.id);
    if (!found) continue;
    if (
      found.order.paymentStatus !== 'pending' ||
      found.order.status === 'cancelled' ||
      found.order.status === 'delivered'
    ) {
      continue;
    }

    const updated = await ordersRepo.updateOrderStatus(
      db,
      order.id,
      'cancelled',
    );
    if (!updated) continue;

    await recordOrderStatusChange(db, {
      orderId: order.id,
      fromStatus: found.order.status,
      toStatus: 'cancelled',
      actor: 'system',
      note: `Auto-cancelled: unpaid ${found.order.paymentMethod} past ${minutes}m`,
    });

    await releaseStockForOrder(db, order.id, found.items);

    await createNotification(db, {
      type: 'payment_failed',
      title: 'Unpaid order cancelled',
      body: `${order.id} auto-cancelled (payment pending > ${minutes}m)`,
      entity: 'order',
      entityId: order.id,
      dedupe: true,
    });

    cancelled += 1;
  }

  await markCronJobRun(db, 'cancel-unpaid');
  return { cancelled };
}
