'use client';

import {
  AdminPageHeader,
  PricingSettingsForm,
  useAdminSettings,
  useUpdateAdminSettings,
} from '@/features/admin';
import { useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

export default function AdminPricingSettingsPage() {
  const { toast } = useToast();
  const { data, isLoading, isError } = useAdminSettings();
  const updateMutation = useUpdateAdminSettings();

  return (
    <div>
      <AdminPageHeader
        title="Pricing"
        subtitle="Profit margin and landed-cost engine defaults."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Pricing' },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading...</p>
      ) : isError || !data ? (
        <p className="text-sm text-status-error">Failed to load settings.</p>
      ) : (
        <PricingSettingsForm
          initial={data}
          isLoading={updateMutation.isPending}
          onSubmit={async (values) => {
            try {
              await updateMutation.mutateAsync(values);
              toast('Pricing saved', 'success');
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

