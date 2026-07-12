'use client';

import {
  AdminBreadcrumbs,
  SettingsForm,
  useAdminSettings,
  useUpdateAdminSettings,
} from '@/features/admin';
import { useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { data, isLoading, isError } = useAdminSettings();
  const updateMutation = useUpdateAdminSettings();

  return (
    <div>
      <AdminBreadcrumbs
        items={[{ label: 'Admin', href: '/admin' }, { label: 'Settings' }]}
      />
      <h1 className="font-(family-name:--font-display) text-3xl font-semibold text-text-primary">
        Settings
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Profit margin, free shipping, and site metadata used across the storefront.
      </p>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : isError || !data ? (
          <p className="text-sm text-status-error">Failed to load settings.</p>
        ) : (
          <SettingsForm
            initial={data}
            isLoading={updateMutation.isPending}
            onSubmit={async (values) => {
              try {
                await updateMutation.mutateAsync(values);
                toast('Settings saved', 'success');
              } catch (err) {
                toast(
                  err instanceof AppError ? err.message : 'Save failed',
                  'error',
                );
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
