'use client';

import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  useAdminSettings,
  useUpdateAdminSettings,
} from '../hooks/useAdminConfig';
import { Button, useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';
import { hasPermission } from '@/shared/rbac';
import { cn } from '@/shared/utils/cn';

export function TemuScraperToggle() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const canWrite = user ? hasPermission(user.role, 'settings:write') : false;
  const { data: settings, isLoading } = useAdminSettings();
  const updateMutation = useUpdateAdminSettings();

  const enabled = settings?.temuScraperEnabled ?? true;

  async function setEnabled(next: boolean) {
    try {
      await updateMutation.mutateAsync({ temuScraperEnabled: next });
      toast(
        next ? 'Temu scraper is running' : 'Temu scraper stopped',
        'success',
      );
    } catch (err) {
      toast(
        err instanceof AppError ? err.message : 'Could not update scraper',
        'error',
      );
    }
  }

  return (
    <section className="rounded-lg border border-border bg-surface-raised p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Temu scraper
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Kill switch for Temu URL import and the stock-sync cron. When
            stopped, imports return an error and sync jobs skip.
          </p>
          {isLoading ? (
            <p className="mt-3 text-xs text-text-muted">Loading…</p>
          ) : (
            <p
              className={cn(
                'mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
                enabled
                  ? 'bg-brand-blush text-brand-primary'
                  : 'bg-border text-text-muted',
              )}
            >
              <span
                className={cn(
                  'size-2 rounded-full',
                  enabled ? 'bg-status-success' : 'bg-text-muted',
                )}
                aria-hidden
              />
              {enabled ? 'Running' : 'Stopped'}
            </p>
          )}
        </div>

        {canWrite ? (
          <Button
            type="button"
            variant={enabled ? 'outline' : 'primary'}
            size="sm"
            isLoading={updateMutation.isPending}
            disabled={isLoading}
            aria-pressed={!enabled}
            aria-label={
              enabled ? 'Stop Temu scraper' : 'Start Temu scraper'
            }
            onClick={() => void setEnabled(!enabled)}
          >
            {enabled ? 'Stop scraper' : 'Start scraper'}
          </Button>
        ) : (
          <p className="text-xs text-text-muted">
            Needs settings permission to change
          </p>
        )}
      </div>
    </section>
  );
}
