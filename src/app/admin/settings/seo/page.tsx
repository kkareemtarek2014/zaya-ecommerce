'use client';

import {
  AdminPageHeader,
  SeoSettingsForm,
  useAdminSettings,
  useUpdateAdminSettings,
} from '@/features/admin';
import { useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

export default function AdminSeoSettingsPage() {
  const { toast } = useToast();
  const { data, isLoading, isError } = useAdminSettings();
  const updateMutation = useUpdateAdminSettings();

  return (
    <div>
      <AdminPageHeader
        title="SEO"
        subtitle="Default titles, descriptions, and footer text."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Settings', href: '/admin/settings' },
          { label: 'SEO' },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading...</p>
      ) : isError || !data ? (
        <p className="text-sm text-status-error">Failed to load settings.</p>
      ) : (
        <SeoSettingsForm
          initial={data}
          isLoading={updateMutation.isPending}
          onSubmit={async (values) => {
            try {
              await updateMutation.mutateAsync(values);
              toast('SEO saved', 'success');
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

