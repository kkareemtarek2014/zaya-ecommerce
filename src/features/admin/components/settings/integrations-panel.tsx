'use client';

import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import type { AdminSettingsDTO } from '@/shared/contracts/admin-config.contract';
import { Input } from '@/shared/components/ui';
import { StickySaveBar } from '../ui';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { IntegrationsStatusPanel } from '../IntegrationsStatusPanel';
import { TemuScraperToggle } from '../TemuScraperToggle';

const schema = z.object({
  unpaidOrderTimeoutMinutes: z
    .coerce.number()
    .int()
    .min(5)
    .max(10080),
  pendingReminderHours: z
    .coerce.number()
    .int()
    .min(1)
    .max(720),
});

type Values = z.infer<typeof schema>;

export type IntegrationsCronSettingsSubmit = {
  unpaidOrderTimeoutMinutes: number;
  pendingReminderHours: number;
};

export interface IntegrationsPanelProps {
  initial: AdminSettingsDTO;
  onSubmit: (values: IntegrationsCronSettingsSubmit) => Promise<void>;
  isLoading?: boolean;
}

export function IntegrationsPanel({
  initial,
  onSubmit,
  isLoading,
}: IntegrationsPanelProps) {
  const defaultValues = useMemo<Values>(
    () => ({
      unpaidOrderTimeoutMinutes: initial.unpaidOrderTimeoutMinutes,
      pendingReminderHours: initial.pendingReminderHours,
    }),
    [initial],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema) as Resolver<Values>,
    defaultValues,
    shouldUnregister: false,
  });

  useUnsavedChangesGuard(isDirty);

  return (
    <div className="space-y-6">
      <IntegrationsStatusPanel />
      <TemuScraperToggle />

      <div className="space-y-2">
        <div className="text-xs text-text-secondary">
          Cron job status + manual runs:
          {' '}
          <Link
            href="/admin/cron"
            className="font-semibold text-brand-primary hover:underline"
          >
            /admin/cron
          </Link>
        </div>
      </div>

      <form
        className="max-w-2xl space-y-6 pb-24"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values);
          reset(values);
        })}
      >
        <fieldset className="space-y-4 rounded-(--radius) border border-border p-4">
          <legend className="px-1 text-sm font-medium text-text-secondary">
            Cron timing
          </legend>

          <Input
            label="Unpaid order timeout (minutes)"
            type="number"
            step="1"
            min={5}
            error={errors.unpaidOrderTimeoutMinutes?.message}
            {...register('unpaidOrderTimeoutMinutes')}
          />
          <p className="text-xs text-text-muted">
            Auto-cancel card/wallet orders still pending past this window.
            COD is never auto-cancelled.
          </p>

          <Input
            label="Pending order reminder (hours)"
            type="number"
            step="1"
            min={1}
            error={errors.pendingReminderHours?.message}
            {...register('pendingReminderHours')}
          />
          <p className="text-xs text-text-muted">
            Daily job notifies admins when orders stay placed/confirmed
            longer than this.
          </p>
        </fieldset>

        <StickySaveBar
          isDirty={isDirty}
          isSubmitting={Boolean(isLoading)}
          submitLabel="Save cron timing"
          onDiscard={() => reset(defaultValues)}
        />
      </form>
    </div>
  );
}

