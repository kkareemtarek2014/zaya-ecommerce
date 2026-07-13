import 'server-only';
import { eq } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { settings } from '@/server/db/schema';

export const DEFAULT_UNPAID_TIMEOUT_MINUTES = 60;
export const DEFAULT_PENDING_REMINDER_HOURS = 48;

export type CronJobName =
  | 'cancel-unpaid'
  | 'pending-reminders'
  | 'cleanup-sessions'
  | 'daily-sales-summary'
  | 'fx-rate-refresh'
  | 'landed-cost-reprice'
  | 'temu-stock-sync'
  | 'integrations-reconcile';

export type CronLastRuns = Partial<Record<CronJobName, string>>;

async function getSettingRaw(db: Db, key: string): Promise<unknown | undefined> {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return rows[0]?.value;
}

export { getSettingRaw };

export async function setSettingRaw(
  db: Db,
  key: string,
  value: unknown,
): Promise<void> {
  const now = new Date();
  const existing = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  if (existing[0]) {
    await db
      .update(settings)
      .set({ value, updatedAt: now })
      .where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value, updatedAt: now });
  }
}

export async function getUnpaidTimeoutMinutes(db: Db): Promise<number> {
  const raw = await getSettingRaw(db, 'unpaid_order_timeout_minutes');
  return typeof raw === 'number' && raw > 0
    ? Math.floor(raw)
    : DEFAULT_UNPAID_TIMEOUT_MINUTES;
}

export async function getPendingReminderHours(db: Db): Promise<number> {
  const raw = await getSettingRaw(db, 'pending_reminder_hours');
  return typeof raw === 'number' && raw > 0
    ? Math.floor(raw)
    : DEFAULT_PENDING_REMINDER_HOURS;
}

export async function getCronLastRuns(db: Db): Promise<CronLastRuns> {
  const raw = await getSettingRaw(db, 'cron_last_runs');
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as CronLastRuns;
  }
  return {};
}

export async function markCronJobRun(
  db: Db,
  job: CronJobName,
  at = new Date(),
): Promise<void> {
  const current = await getCronLastRuns(db);
  current[job] = at.toISOString();
  await setSettingRaw(db, 'cron_last_runs', current);
}
