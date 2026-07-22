'use client';

import {
  AdminPageHeader,
  ShippingSettingsForm,
  useAdminSettings,
  useUpdateAdminSettings,
} from '@/features/admin';
import { useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

export default function AdminShippingSettingsPage() {
  const { toast } = useToast();
  const { data, isLoading, isError } = useAdminSettings();
  const updateMutation = useUpdateAdminSettings();

  return (
    <div>
      <AdminPageHeader
        title="Shipping"
        subtitle="Free-shipping threshold, ETA copy, and zone fees."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Shipping' },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading...</p>
      ) : isError || !data ? (
        <p className="text-sm text-status-error">Failed to load settings.</p>
      ) : (
        <ShippingSettingsForm
          initial={data}
          isLoading={updateMutation.isPending}
          onSubmit={async (values) => {
            try {
              await updateMutation.mutateAsync(values);
              toast('Shipping settings saved', 'success');
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
