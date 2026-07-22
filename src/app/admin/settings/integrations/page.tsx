'use client';

import {
  AdminPageHeader,
  IntegrationsPanel,
  useAdminSettings,
  useUpdateAdminSettings,
} from '@/features/admin';
import { useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

export default function AdminIntegrationsSettingsPage() {
  const { toast } = useToast();
  const { data, isLoading, isError } = useAdminSettings();
  const updateMutation = useUpdateAdminSettings();

  return (
    <div>
      <AdminPageHeader
        title="Integrations"
        subtitle="Paymob/Bosta health, Temu kill switch, and cron timing."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Integrations' },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading...</p>
      ) : isError || !data ? (
        <p className="text-sm text-status-error">Failed to load settings.</p>
      ) : (
        <IntegrationsPanel
          initial={data}
          isLoading={updateMutation.isPending}
          onSubmit={async (values) => {
            try {
              await updateMutation.mutateAsync(values);
              toast('Cron timing saved', 'success');
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
  );
}

