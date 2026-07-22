import { FormSkeleton, Skeleton } from '@/shared/components/ui';

export default function AdminSettingsLoading() {
  return (
    <div className="animate-fade-up" aria-busy="true" aria-label="Loading settings">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <FormSkeleton fields={6} className="max-w-2xl" />
    </div>
  );
}
