'use client';

import { use } from 'react';
import {
  AdminBreadcrumbs,
  useAdminBridalRequest,
  useUpdateBridalStatus,
} from '@/features/admin';
import { Button, useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

export default function AdminBridalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();
  const { data: request, isLoading, isError } = useAdminBridalRequest(id);
  const updateMutation = useUpdateBridalStatus(id);

  const setStatus = (status: 'pending' | 'answered') => {
    updateMutation.mutate(status, {
      onSuccess: () => toast('Status updated', 'success'),
      onError: (err) =>
        toast(
          err instanceof AppError ? err.message : 'Update failed',
          'error',
        ),
    });
  };

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Bridal', href: '/admin/bridal' },
          { label: request?.fullName ?? id },
        ]}
      />
      <h1 className="font-(family-name:--font-display) text-3xl font-semibold text-text-primary">
        Bridal request
      </h1>

      {isLoading ? (
        <p className="mt-6 text-sm text-text-muted">Loading…</p>
      ) : isError || !request ? (
        <p className="mt-6 text-sm text-status-error">Request not found.</p>
      ) : (
        <div className="mt-6 max-w-2xl space-y-8">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={request.status === 'pending' ? 'primary' : 'outline'}
              size="sm"
              disabled={updateMutation.isPending}
              onClick={() => setStatus('pending')}
            >
              Mark pending
            </Button>
            <Button
              type="button"
              variant={request.status === 'answered' ? 'primary' : 'outline'}
              size="sm"
              disabled={updateMutation.isPending}
              onClick={() => setStatus('answered')}
            >
              Mark answered
            </Button>
          </div>

          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-muted">Name</dt>
              <dd className="font-medium">{request.fullName}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Phone</dt>
              <dd className="font-medium">{request.phone}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Wedding date</dt>
              <dd className="font-medium">{request.weddingDate ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Status</dt>
              <dd className="font-medium capitalize">{request.status}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Submitted</dt>
              <dd className="font-medium">
                {new Date(request.createdAt).toLocaleString()}
              </dd>
            </div>
            {request.userId ? (
              <div>
                <dt className="text-text-muted">User ID</dt>
                <dd className="font-mono text-xs">{request.userId}</dd>
              </div>
            ) : null}
          </dl>

          <section>
            <h2 className="font-display text-lg font-semibold">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
              {request.description}
            </p>
          </section>

          {request.mediaUrl ? (
            <section>
              <h2 className="font-display text-lg font-semibold">Media</h2>
              <p className="mt-1 text-xs text-text-muted">
                {request.fileName ?? 'Attachment'}
                {request.fileType ? ` · ${request.fileType}` : ''}
              </p>
              <div className="mt-3 overflow-hidden rounded-(--radius-lg) border border-border">
                {request.fileType?.startsWith('video/') ? (
                  <video
                    src={request.mediaUrl}
                    controls
                    className="max-h-96 w-full bg-black"
                  >
                    <track kind="captions" />
                  </video>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={request.mediaUrl}
                    alt={request.fileName ?? 'Bridal reference'}
                    className="max-h-96 w-full object-contain"
                  />
                )}
              </div>
            </section>
          ) : (
            <p className="text-sm text-text-muted">No media attached.</p>
          )}
        </div>
      )}
    </div>
  );
}
