import { FormSkeleton, Skeleton } from '@/shared/components/ui';

export default function AdminSettingsSubLoading() {
  return (
    <div className="animate-fade-up" aria-busy="true" aria-label="Loading settings page">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <FormSkeleton fields={5} className="max-w-2xl" />
    </div>
  );
}
