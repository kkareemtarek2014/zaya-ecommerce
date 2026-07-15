'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, useToast } from '@/shared/components/ui';
import type { AdminSettingsDTO } from '@/shared/contracts/admin-config.contract';
import type { AdminJobName } from '@/shared/contracts/admin-jobs.contract';
import { AppError } from '@/shared/contracts/errors';
import { api } from '@/shared/lib/api-client';
import { adminConfigKeys } from '../hooks/useAdminConfig';

const JOBS: { id: AdminJobName; label: string }[] = [
  { id: 'cancel-unpaid', label: 'Cancel unpaid (card/wallet)' },
  { id: 'pending-reminders', label: 'Pending order reminders' },
  { id: 'cleanup-sessions', label: 'Cleanup expired sessions' },
  { id: 'daily-sales-summary', label: 'Daily sales summary' },
  { id: 'fx-rate-refresh', label: 'FX rate refresh (USD→EGP)' },
  { id: 'landed-cost-reprice', label: 'Landed-cost reprice' },
  { id: 'temu-stock-sync', label: 'Temu stock sync' },
  { id: 'integrations-reconcile', label: 'Paymob/Bosta reconcile' },
];

interface CronJobsPanelProps {
  lastRuns?: AdminSettingsDTO['cronLastRuns'];
}

export function CronJobsPanel({ lastRuns }: CronJobsPanelProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [running, setRunning] = useState<AdminJobName | null>(null);

  return (
    <section className="mt-10 max-w-xl rounded-lg border border-border bg-surface-raised p-5">
      <h2 className="font-display text-lg font-semibold text-text-primary">
        Cron jobs
      </h2>
      <p className="mt-1 text-xs text-text-muted">
        Runs on Cloudflare schedule (every 15 min + hourly reconcile + daily
        06:00 UTC + Temu every 4h). Use Run now for a manual smoke test.
      </p>
      <ul className="mt-4 divide-y divide-border">
        {JOBS.map((job) => {
          const last = lastRuns?.[job.id];
          return (
            <li
              key={job.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {job.label}
                </p>
                <p className="text-xs text-text-muted">
                  Last run:{' '}
                  {last ? new Date(last).toLocaleString() : 'Never'}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                isLoading={running === job.id}
                disabled={running != null}
                onClick={async () => {
                  setRunning(job.id);
                  try {
                    const res = await api.post<{
                      job: string;
                      ok: boolean;
                      error?: string;
                      detail?: Record<string, number | string>;
                    }>('/api/admin/jobs/run', { job: job.id });
                    if (!res.ok) {
                      toast(res.error ?? 'Job failed', 'error');
                    } else {
                      const bits = res.detail
                        ? Object.entries(res.detail)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(', ')
                        : 'ok';
                      toast(`${job.id}: ${bits}`, 'success');
                      void qc.invalidateQueries({
                        queryKey: adminConfigKeys.settings,
                      });
                    }
                  } catch (err) {
                    toast(
                      err instanceof AppError ? err.message : 'Job failed',
                      'error',
                    );
                  } finally {
                    setRunning(null);
                  }
                }}
              >
                Run now
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
