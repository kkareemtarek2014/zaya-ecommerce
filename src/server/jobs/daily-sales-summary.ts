import 'server-only';
import { and, count, gte, lt, ne, sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { orders } from '@/server/db/schema';
import { createNotification } from '@/server/services/notifications.service';
import { markCronJobRun } from '@/server/jobs/config';

function startOfUtcDay(d = new Date()): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/** UTC-day sales rollup for the admin notification bell. */
export async function dailySalesSummaryJob(
  db: Db,
): Promise<{ orders: number; revenue: number }> {
  const start = startOfUtcDay();
  const end = new Date(start.getTime() + 24 * 60 * 60_000);

  const [row] = await db
    .select({
      orders: count(),
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .where(
      and(
        ne(orders.status, 'cancelled'),
        gte(orders.createdAt, start),
        lt(orders.createdAt, end),
      ),
    );

  const ordersCount = row?.orders ?? 0;
  const revenue = Number(row?.revenue ?? 0);
  const day = start.toISOString().slice(0, 10);

  await createNotification(db, {
    type: 'daily_summary',
    title: `Sales summary · ${day}`,
    body: `${ordersCount} order(s) · ${revenue} EGP (excl. cancelled)`,
    entity: 'stats',
    entityId: day,
    dedupe: true,
  });

  await markCronJobRun(db, 'daily-sales-summary');
  return { orders: ordersCount, revenue };
}
