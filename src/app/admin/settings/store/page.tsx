'use client';

import {
  AdminPageHeader,
  StoreSettingsForm,
  useAdminSettings,
  useUpdateAdminSettings,
} from '@/features/admin';
import { useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

export default function AdminStoreSettingsPage() {
  const { toast } = useToast();
  const { data, isLoading, isError } = useAdminSettings();
  const updateMutation = useUpdateAdminSettings();

  return (
    <div>
      <AdminPageHeader
        title="Store"
        subtitle="Branding, contact, social links, announcements, and maintenance."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Store' },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading...</p>
      ) : isError || !data ? (
        <p className="text-sm text-status-error">Failed to load settings.</p>
      ) : (
        <StoreSettingsForm
          initial={data}
          isLoading={updateMutation.isPending}
          onSubmit={async (values) => {
            try {
              await updateMutation.mutateAsync(values);
              toast('Store settings saved', 'success');
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
