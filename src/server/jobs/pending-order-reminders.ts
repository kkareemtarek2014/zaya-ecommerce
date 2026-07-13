import 'server-only';
import { and, inArray, lt } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { orders } from '@/server/db/schema';
import { createNotification } from '@/server/services/notifications.service';
import {
  getPendingReminderHours,
  markCronJobRun,
} from '@/server/jobs/config';

/** Notify admins about orders stuck in placed/confirmed past the window. */
export async function pendingOrderRemindersJob(
  db: Db,
): Promise<{ reminded: number }> {
  const hours = await getPendingReminderHours(db);
  const cutoff = new Date(Date.now() - hours * 60 * 60_000);

  const stuck = await db
    .select()
    .from(orders)
    .where(
      and(
        inArray(orders.status, ['placed', 'confirmed']),
        lt(orders.createdAt, cutoff),
      ),
    )
    .limit(50);

  let reminded = 0;
  for (const order of stuck) {
    await createNotification(db, {
      type: 'order_reminder',
      title: 'Order needs attention',
      body: `${order.id} still ${order.status} after ${hours}h`,
      entity: 'order',
      entityId: order.id,
      dedupe: true,
    });
    reminded += 1;
  }

  await markCronJobRun(db, 'pending-reminders');
  return { reminded };
}
