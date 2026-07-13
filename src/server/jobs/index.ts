import 'server-only';
import { getDb } from '@/server/db/client';
import type { CronJobName } from '@/server/jobs/config';
import { cancelUnpaidOrdersJob } from '@/server/jobs/cancel-unpaid-orders';
import { pendingOrderRemindersJob } from '@/server/jobs/pending-order-reminders';
import { cleanupSessionsJob } from '@/server/jobs/cleanup-sessions';
import { dailySalesSummaryJob } from '@/server/jobs/daily-sales-summary';
import {
  fxRateRefreshJob,
  landedCostRepriceJob,
} from '@/server/jobs/fx-rate-refresh';
import { temuStockSyncJob } from '@/server/jobs/temu-stock-sync';
import { integrationsReconcileJob } from '@/server/jobs/integrations-reconcile';

export const CRON_EVERY_15M = '*/15 * * * *';
export const CRON_DAILY_06 = '0 6 * * *';
export const CRON_EVERY_4H = '0 */4 * * *';
export const CRON_HOURLY = '0 * * * *';

export type JobRunResult = {
  job: CronJobName;
  ok: boolean;
  detail?: Record<string, number | string>;
  error?: string;
};

export async function runCronJob(
  env: CloudflareEnv,
  job: CronJobName,
): Promise<JobRunResult> {
  const db = getDb(env.DB);
  try {
    switch (job) {
      case 'cancel-unpaid': {
        const detail = await cancelUnpaidOrdersJob(db);
        return { job, ok: true, detail };
      }
      case 'pending-reminders': {
        const detail = await pendingOrderRemindersJob(db);
        return { job, ok: true, detail };
      }
      case 'cleanup-sessions': {
        const detail = await cleanupSessionsJob(db);
        return { job, ok: true, detail };
      }
      case 'daily-sales-summary': {
        const detail = await dailySalesSummaryJob(db);
        return { job, ok: true, detail };
      }
      case 'fx-rate-refresh': {
        const detail = await fxRateRefreshJob(db, env);
        return { job, ok: true, detail };
      }
      case 'landed-cost-reprice': {
        const detail = await landedCostRepriceJob(db);
        return { job, ok: true, detail };
      }
      case 'temu-stock-sync': {
        const detail = await temuStockSyncJob(db, env);
        return { job, ok: true, detail };
      }
      case 'integrations-reconcile': {
        const detail = await integrationsReconcileJob(db, env);
        return { job, ok: true, detail };
      }
      default: {
        const _exhaustive: never = job;
        return { job: _exhaustive, ok: false, error: 'Unknown job' };
      }
    }
  } catch (err) {
    console.error(`[cron:${job}]`, err);
    return {
      job,
      ok: false,
      error: err instanceof Error ? err.message : 'Job failed',
    };
  }
}

/**
 * Dispatch from Worker `scheduled` based on the matching cron expression.
 */
export async function dispatchScheduled(
  event: { cron: string },
  env: CloudflareEnv,
): Promise<JobRunResult[]> {
  const cron = event.cron;
  const results: JobRunResult[] = [];

  if (cron === CRON_EVERY_15M) {
    results.push(await runCronJob(env, 'cancel-unpaid'));
    return results;
  }

  if (cron === CRON_HOURLY) {
    results.push(await runCronJob(env, 'integrations-reconcile'));
    return results;
  }

  if (cron === CRON_EVERY_4H) {
    results.push(await runCronJob(env, 'temu-stock-sync'));
    return results;
  }

  if (cron === CRON_DAILY_06) {
    results.push(await runCronJob(env, 'cleanup-sessions'));
    results.push(await runCronJob(env, 'pending-reminders'));
    results.push(await runCronJob(env, 'daily-sales-summary'));
    results.push(await runCronJob(env, 'fx-rate-refresh'));
    return results;
  }

  console.warn(`[cron] Unhandled expression: ${cron}`);
  return results;
}

export {
  cancelUnpaidOrdersJob,
  pendingOrderRemindersJob,
  cleanupSessionsJob,
  dailySalesSummaryJob,
  fxRateRefreshJob,
  landedCostRepriceJob,
  temuStockSyncJob,
  integrationsReconcileJob,
};
